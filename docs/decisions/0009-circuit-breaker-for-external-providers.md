# 0009 - Circuit breaker + retry sobre adaptadores externos, con política compartida por servicio

## Estado

Aceptada

## Contexto

Cuando un servicio externo (Cognito, SES) empieza a fallar o a responder lento, seguir reintentando sin control agrava el problema — satura al servicio ya degradado y hace que cada request local espere el timeout completo antes de fallar, en vez de fallar rápido. Además, si el mismo servicio externo se llama desde más de un adaptador (Cognito se usa tanto para autenticación como para gestión de usuarios), armar un breaker independiente por adaptador diluye la protección: cada uno necesita sus propios fallos consecutivos antes de abrirse, en vez de reaccionar como una sola unidad ante una caída real del servicio.

## Decisión

Se centralizó la construcción de la política de resiliencia en `ResiliencePolicyFactory` (`cockatiel`), que combina 3 mecanismos:

- **Retry** con backoff exponencial (con jitter, por defecto de `cockatiel`).
- **Circuit breaker** (`ConsecutiveBreaker`, abre tras 5 fallos consecutivos por defecto, medio-abierto tras 10s).
- **Timeout** por intento individual, para no depender del timeout completo de la Lambda ante una llamada colgada.

**Una única instancia de la política por servicio externo**, no una por clase de adaptador — se arma una vez en el composition root (`ApplicationServices.ts` para Cognito, `NotificationContainer.ts` para SES) y se **inyecta por constructor** a todos los adaptadores que llaman a ese mismo servicio (`CognitoAuthenticationProviderImpl` y `CognitoIdentityManagementProviderImpl` comparten la misma política de Cognito). Así, un fallo detectado desde cualquiera de los dos cuenta para el mismo breaker.

Cada servicio define su propio filtro de "qué cuenta como fallo real" (`isTransientError`) — errores de negocio (`NotAuthorizedException`, `UserNotFoundException`, `AliasExistsException`) quedan explícitamente excluidos tanto del retry como del conteo del breaker, para no confundir "el cliente mandó datos inválidos" con "el servicio está degradado".

`authenticate()` (verificación local de JWT con `aws-jwt-verify`) queda deliberadamente fuera de la política — no hay ninguna llamada de red que proteger ahí.

La anotación de X-Ray (`circuitBreakerState=open` en el segmento activo cuando una llamada corta por `BrokenCircuitError`) y la métrica de aperturas del breaker (`onStateChange`) también viven centralizadas dentro del factory — ningún adaptador repite ese código.

## Alternativas consideradas

- **`opossum`** — librería de circuit breaker más simple y más vieja, sin composición nativa de retry+breaker bajo la misma API de políticas. Descartada por ser menos completa para este caso.
- **Reintentos manuales con `for`/`try-catch`** — reinventa lo que una librería madura ya resuelve (backoff, jitter, estado del breaker), con más superficie para bugs propios.
- **Un breaker por clase de adaptador** (el diseño inicial) — más simple de escribir al principio, pero deja la protección fragmentada: dos breakers independientes para el mismo Cognito significa que una caída real tarda el doble en activar protección completa (cada uno necesita sus propios 5 fallos). Se descartó una vez detectado, en favor de una política compartida inyectada.

## Consecuencias

- Un fallo real y sostenido de Cognito (o SES) abre el circuito **una vez**, y esa protección aplica a todos los adaptadores que comparten la política — no hay una "mitad" del sistema desprotegida mientras la otra ya reaccionó.
- La política se recibe por constructor, no se crea a nivel de módulo — permite probar el comportamiento del breaker de forma aislada si en algún momento se agregan tests sobre resiliencia (hoy no los hay).
- `SesNotificationSenderImpl` tiene el mismo tratamiento que Cognito — el mismo patrón aplicado a los dos únicos adaptadores con llamada de red síncrona en el camino crítico de un request. El resto de las integraciones del proyecto (SQS, EventBridge, S3) no lo necesitan: son asíncronas o no están en el camino crítico de una respuesta HTTP.
- **Matiz importante para Lambda** (no exclusivo de esta decisión, pero vale dejarlo escrito acá): el estado del breaker vive en memoria del proceso — se comparte entre invocaciones que reutilizan el mismo contenedor cálido, pero **no** entre contenedores concurrentes distintos (cada uno con su propia instancia). No es un circuit breaker global entre toda la concurrencia del sistema; para eso haría falta estado compartido externo (ej. DynamoDB/Redis), fuera de alcance para este proyecto.
