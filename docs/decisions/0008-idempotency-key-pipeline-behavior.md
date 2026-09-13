# 0008 - Idempotency-Key como comportamiento genérico del pipeline

## Estado

Aceptada

## Contexto

Un cliente que reintenta una request (timeout, retry automático del lado del navegador o del SDK) no sabe si el intento anterior llegó a procesarse o no. Sin protección, un `POST`/`PATCH` reintentado puede duplicar el efecto (crear el mismo recurso dos veces, aplicar el mismo cambio dos veces) — el problema clásico que header `Idempotency-Key` (patrón popularizado por Stripe) existe para resolver.

## Decisión

Se agregó `IdempotencyBehavior` como un comportamiento más del pipeline declarativo existente (`PipelineBehaviorRegistry`, activable por `HandlerDescriptor.idempotent`), no como lógica ad-hoc dentro de cada caso de uso.

El behavior implementa un **claim atómico** sobre la key, no un simple "buscar y después guardar":

1. **`claim(key)`** — intenta un `INSERT` con `id = Idempotency-Key`, `status: "PROCESSING"`. La constraint de unicidad de `id` hace que, si dos requests con la misma key llegan en simultáneo, solo uno de los dos `INSERT` tenga éxito — sin ventana entre "mirar si existe" y "escribir", el motor de la base resuelve la carrera de forma atómica.
2. Si el `INSERT` falla por la constraint (ya existe una fila con esa key), `claim()` intenta un segundo camino antes de rendirse: un `UPDATE` condicional que solo afecta la fila si sigue en `"PROCESSING"` **y** su `createdAt` es más viejo que `STALE_PROCESSING_MS` (60s, bien por encima del timeout máximo de Lambda). Si ese `UPDATE` afecta una fila, este request reclama la key igual que si el `INSERT` hubiera tenido éxito — cubre el caso de un Lambda que murió (timeout, crash) entre `claim()` y `complete()`/`release()`, sin dejar la key bloqueada para siempre.
3. Si el claim **tiene éxito** (por `INSERT` o por reclamo de una fila abandonada) — este request es el único dueño de la key: ejecuta el handler normalmente. Si el handler termina bien, `complete()` actualiza la fila a `status: "COMPLETED"` con la respuesta real. Si el handler tira una excepción, `release()` borra la fila reservada, para que un reintento legítimo después de un fallo real no quede bloqueado para siempre.
4. Si el claim **falla del todo** (la fila existe, sigue viva, y no calificó para reclamo) — se lee la fila existente: si el hash del body no coincide, `409 Conflict` (reuso de la key con un payload distinto); si `status` sigue `"PROCESSING"`, `409 Conflict` (hay otro request con la misma key en curso ahora mismo, no se espera ni se duplica trabajo); si ya está `"COMPLETED"`, se devuelve la respuesta guardada sin ejecutar el handler de nuevo.

## Alternativas consideradas

- **Deduplicación solo por constraint de base de datos** (ej. `email @unique` en `User`) — funciona para evitar el dato duplicado, pero no le devuelve al cliente la misma respuesta que obtuvo (o hubiera obtenido) la primera vez — el reintento recibe un error de conflicto en vez de la respuesta original, rompiendo la semántica esperada de idempotencia real.
- **Idempotencia manual por caso de uso** (cada `UseCase` implementando su propio chequeo) — se descartó por dispersar la misma lógica de infraestructura en cada lugar que la necesite, en vez de centralizarla una vez en el pipeline, igual que ya se hace con autenticación/autorización/validación.
- **"Buscar, ejecutar, guardar al final"** (la primera versión de esta implementación) — más simple de escribir, pero con una condición de carrera real: entre la lectura inicial (nada existe todavía) y la escritura final (después de ejecutar el handler completo), dos requests con la misma key pueden pasar el chequeo las dos y ejecutar el trabajo de negocio **en paralelo** — para `CreateUserUseCase` con `AUTH_PROVIDER=cognito`, eso significa dos llamadas reales a `AdminCreateUserCommand` para el mismo email, exactamente lo que la idempotencia debía evitar. La ventana es más ancha cuanto más tarda el handler (una llamada de red real a Cognito, potencialmente con reintentos del circuit breaker, la agranda bastante) — y es precisamente en esa situación (respuesta lenta) donde un cliente real tiene más probabilidad de reintentar. Se reemplazó por el claim atómico descrito arriba, que cierra la ventana por completo delegando la exclusión mutua al motor de la base, no a la lógica de la aplicación.
- **`@aws-lambda-powertools/idempotency`** — el utility oficial de AWS para exactamente este problema, con el mismo patrón de fondo (`INPROGRESS`/`COMPLETED` con escritura condicional atómica) y manejo nativo de registros `INPROGRESS` abandonados vía TTL. Esta implementación cubre el mismo caso con un `UPDATE` condicional por antigüedad en vez de un TTL nativo de la base (ver Decisión, paso 2). Se descartó porque es **DynamoDB-nativo por diseño** (`DynamoDBPersistenceLayer`): usarlo contra la base real del proyecto (Postgres/Prisma) hubiera exigido escribir una `BasePersistenceLayer` custom de todos modos — el mismo esfuerzo de storage que ya se escribió, sin ahorrar nada salvo la lógica del claim (que es la parte que sí se resolvió bien acá). Además, introducir DynamoDB únicamente para esta pieza — o escribir un adaptador de Powertools contra Postgres — hubiera roto la consistencia del resto del proyecto, donde toda la persistencia pasa por Postgres sin excepción (ver [ADR-0001](0001-hexagonal-architecture-ports-and-adapters.md), mitigación de vendor lock-in).

## Consecuencias

- Activar idempotencia en un endpoint nuevo es un flag en su `HandlerDescriptor`, no código nuevo repetido.
- El chequeo del hash del body (no solo la key) es lo que evita que un reuso accidental de la misma key con datos distintos se resuelva en silencio con la respuesta vieja — se avisa explícitamente con `409 Conflict`.
- Dos requests concurrentes con la misma key nunca ejecutan el handler dos veces — el segundo recibe `409 Conflict` de inmediato si el primero sigue en curso, sin haber tocado el caso de uso.
- Costo: una tabla adicional (`IdempotencyKey`), una escritura extra por cada request idempotente exitosa, y ahora dos escrituras en el camino de error (`claim` + `release`) en vez de ninguna.
- Una key que quedó en `"PROCESSING"` por un Lambda caído se recupera sola en el siguiente intento, pasados los 60s de `STALE_PROCESSING_MS` — sin intervención manual ni limpieza de datos.
