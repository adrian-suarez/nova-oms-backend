# 0002 - Patrón Outbox transaccional para consistencia eventual entre datos y eventos

## Estado

Aceptada

## Contexto

Cuando una operación necesita, a la vez, escribir en Postgres y publicar un evento en EventBridge (para que otros módulos reaccionen — auditoría, notificaciones), no existe una forma de hacer ambas cosas de forma atómica: son dos sistemas distintos, sin una transacción distribuida disponible de forma práctica en un entorno serverless. Si se escribe el dato y falla la publicación del evento (o al revés), el sistema queda inconsistente — un cambio sin su notificación correspondiente, o un evento publicado sobre un cambio que nunca se confirmó.

## Decisión

Se implementó el patrón Transactional Outbox: `DomainEventDispatcher` persiste el evento en una tabla `OutboxEvent`, **en la misma transacción de base de datos** que el cambio de negocio (vía `UnitOfWork`). Recién después de que esa transacción confirma, se intenta publicar el evento a EventBridge. Si la publicación falla, el evento queda en `OutboxEvent` con estado `PENDING`/`FAILED`; un worker independiente (`OutboxPublisherWorker`, disparado por EventBridge Scheduler cada día) reintenta los eventos pendientes como red de seguridad — sin duplicar el trabajo entre workers concurrentes, verificado con un test de integración específico sobre `claimPending`.

## Alternativas consideradas

- **Two-Phase Commit (2PC)** — daría consistencia fuerte real, pero Postgres y EventBridge no soportan un protocolo de dos fases entre sí; hubiera requerido un coordinador de transacciones externo, con la latencia y complejidad que eso implica, para un beneficio marginal frente a la alternativa elegida.
- **Publicar el evento directo después del commit, sin Outbox** — más simple de escribir, pero si la publicación falla después de que el commit ya se hizo, el evento se pierde para siempre sin ningún mecanismo de recuperación.
- **Dual write ingenuo (escribir el dato y publicar el evento como dos pasos sin garantía)** — el problema clásico que el patrón Outbox existe para resolver; se descartó por ser la fuente exacta de la inconsistencia que se buscaba evitar.

## Consecuencias

- El sistema opera con **consistencia eventual** entre el estado de los datos y la publicación del evento correspondiente — aceptado conscientemente, no es un compromiso accidental.
- Nunca se pierde un evento: en el peor caso, se publica con demora (hasta que el worker de reintento lo reclama), nunca se descarta silenciosamente.
- Costo: una tabla adicional (`OutboxEvent`), un worker adicional (`OutboxPublisherWorker`), y la necesidad de que `claimPending` maneje concurrencia real entre workers (resuelto y probado con test de integración).
