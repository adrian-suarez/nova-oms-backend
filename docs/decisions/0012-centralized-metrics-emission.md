# 0012 - Métricas custom centralizadas, con emisión por camino de invocación

## Estado

Aceptada

## Contexto

Powertools Metrics (`@aws-lambda-powertools/metrics`) acumula datos en memoria (`addDimension`/`addMetric`) y necesita una emisión explícita (`publishStoredMetrics()`) para que ese buffer se escriba como una línea de log en formato EMF, que CloudWatch Logs detecta y convierte automáticamente en métricas — sin esa emisión, los datos se acumulan y nunca se emiten, un fallo silencioso (sin excepción, sin error de compilación) fácil de dejar pasar. Además, si cada adaptador crea su propia instancia de `Metrics`, cualquier componente que quiera emitir "todo lo acumulado en esta invocación" no tiene forma de alcanzar instancias creadas en otros archivos.

## Decisión

`Metrics` es un servicio único del contenedor compartido (`SharedContainer.metrics`), con el mismo ciclo de vida que `logger` — una instancia por cold start, inyectada por constructor a quien la necesite (hoy: `ResiliencePolicyFactory`, vía `ApplicationServices.ts`/`NotificationContainer.ts`). Ningún componente de negocio llama a `publishStoredMetrics()` — la emisión está centralizada en los puntos de entrada de cada camino de invocación:

- **HTTP**: `exceptionMiddleware`, en un bloque `finally` (corre siempre, éxito o error).
- **SQS**: `SqsLambdaHandler`, una vez después de procesar todo el batch de records.

## Alternativas consideradas

- **Una instancia de `Metrics` por adaptador/módulo** (el diseño inicial) — más simple de escribir al empezar, pero cada instancia queda aislada: nadie más puede emitirla, y de hecho así fue como quedó un bug real donde las métricas de SES nunca llegaban a CloudWatch porque su instancia local nunca se emitía desde ningún lado.
- **Emisión manual al final de cada método de negocio** (ej. al final de `login()`) — funciona, pero dispersa una responsabilidad de infraestructura (cuándo cerrar el ciclo de una invocación) dentro de lógica de negocio, y es fácil olvidarlo en un método nuevo. Se prefirió centralizarlo en los 3 puntos de entrada existentes, el mismo lugar que ya centraliza el manejo de excepciones.
- **Middleware oficial de Powertools** (`@middy/core` + `logMetrics`) — el proyecto no usa Middy ni el framework de handlers de Powertools, tiene su propio `Pipeline`/`Middleware` (`exceptionMiddleware`, `Behavior`s). Adoptar Middy solo para esto hubiera significado dos sistemas de middleware conviviendo sin necesidad — se prefirió replicar el mismo `finally` dentro del mecanismo propio ya existente.

## Consecuencias

- Agregar una métrica nueva en cualquier módulo es solo `metrics.addMetric(...)` — nunca hace falta pensar en cuándo se emite, es responsabilidad ya resuelta en los puntos de entrada.
- El camino de **EventBridge Scheduler** (`ScheduleLambdaHandler`, usado por `OutboxPublisherWorkerLambda`) todavía no recibe `metrics` ni emite — no hay ninguna métrica emitida desde ese camino hoy, así que no es un bug, pero si se agrega alguna en el futuro ahí, hay que replicar el mismo `finally` en `ScheduleLambdaHandler`/`ScheduleLambdaFactory` — no es automático por estar centralizado en los otros dos caminos.
- Namespace único (`"NovaOMS"`) para todas las métricas custom del proyecto — todo vive bajo el mismo espacio en CloudWatch, diferenciado por dimensiones (`provider`, `operation`), no por namespaces separados por módulo.
