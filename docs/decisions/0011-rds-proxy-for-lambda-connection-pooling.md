# 0011 - RDS Proxy para pooling de conexiones desde Lambda

## Estado

Aceptada

## Contexto

Cada invocación fría de Lambda puede abrir su propia conexión a Postgres. Con concurrencia alta, el número de conexiones abiertas puede superar el límite que soporta la instancia de RDS antes que cualquier otro cuello de botella del sistema — un problema conocido de la combinación Lambda + base de datos relacional tradicional, donde no hay un proceso de larga vida que mantenga un pool de conexiones como en un servidor convencional.

## Decisión

Se agregó `rds.DatabaseProxy` delante de la instancia (`DatabaseConstruct.ts`), y se redirigió `DB_HOST` para que las Lambdas se conecten al proxy en vez de a la instancia directa. El proxy multiplexa y reutiliza conexiones reales hacia RDS entre invocaciones, sin que cada Lambda gestione la suya. Se combina con `reservedConcurrentExecutions` en `NodeLambdaFactory.ts` (configurable por ambiente vía `LAMBDA_RESERVED_CONCURRENCY` en `cdk.json`), que ya limitaba el techo de invocaciones concurrentes como mitigación previa a esta capa.

El construct completo (instancia + proxy) queda condicionado a `env !== "local"` — no se crea contra LocalStack, donde RDS Proxy tiene soporte muy limitado o inexistente incluso en el tier Pro.

## Alternativas consideradas

- **Solo `reservedConcurrentExecutions`** (lo que había antes) — limita el techo de invocaciones concurrentes, pero no resuelve el problema de fondo: cada una de esas invocaciones concurrentes igual abre su propia conexión, solo que ahora hay un límite superior más bajo. Mitigación parcial, no la solución.
- **Pool de conexiones en la aplicación** (ej. `pg-pool` gestionado a mano dentro del proceso Lambda) — no resuelve nada entre invocaciones distintas de Lambda, que son procesos separados (salvo reutilización de contenedor en warm start) — el pool se reinicia con cada cold start, sin coordinación real entre instancias concurrentes de la función.
- **Aumentar el tamaño de instancia de RDS** solo para tener más conexiones disponibles — ataca el síntoma (el límite de conexiones) subiendo el costo fijo, no la causa (cada Lambda abriendo su propia conexión en vez de compartir un pool).

## Consecuencias

- El punto de fallo por agotamiento de conexiones se resuelve sin cambiar código de aplicación — solo el endpoint al que apuntan las Lambdas.
- RDS Proxy tiene un costo fijo adicional por hora, independiente del tráfico — aceptado porque resuelve un riesgo real de escala, no un problema hipotético.
- Al quedar fuera del ambiente `local`, el flujo de desarrollo contra LocalStack/Docker Compose no se ve afectado ni intenta aprovisionar un recurso que ese entorno no soporta.
