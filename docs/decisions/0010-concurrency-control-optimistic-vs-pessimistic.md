# 0010 - Optimistic locking para edición de recursos, pessimistic locking para colas de trabajo

## Estado

Aceptada

## Contexto

Dos problemas de concurrencia distintos, con dos escrituras concurrentes en juego cada uno: (a) dos clientes HTTP editando el mismo `User`/`Role` a partir de una lectura previa (lost update si el segundo pisa al primero sin saberlo), y (b) dos ejecuciones concurrentes de `OutboxPublisherWorker` reclamando el mismo lote de eventos pendientes (`claimPending`) para publicar, con riesgo de procesar el mismo evento dos veces.

## Decisión

Se aplicó **optimistic locking** a `User`/`Role`: columna `version`, incrementada atómicamente en cada `UPDATE` (`version: {increment: 1}`), con el `WHERE` filtrando por `id` y la `version` que el cliente declaró haber visto (`request.version`, comparada explícitamente contra la entidad recién leída antes de aplicar cambios). Si la comparación falla, o si el `UPDATE` no afecta ninguna fila (`P2025`), se traduce a `409 Conflict` (`ConflictError`).

Se aplicó **pessimistic locking** a `claimPending`: `SELECT ... FOR UPDATE SKIP LOCKED` dentro de una transacción, con la confirmación (`UPDATE status = PROCESSING`) corriendo sobre el mismo cliente transaccional (`tx`). Un segundo worker que llega mientras las filas están bloqueadas las salta automáticamente y toma las siguientes disponibles, sin esperar ni poder reclamar la misma fila dos veces.

## Alternativas consideradas

- **Pessimistic locking en `User`/`Role`** (`SELECT ... FOR UPDATE`) — bloquearía lecturas de otros requests mientras dura la edición de uno, con bajo beneficio real: la probabilidad de que dos clientes editen el mismo usuario en la misma ventana de milisegundos es baja, y pagar el costo de bloqueo por un caso raro no se justifica.
- **Optimistic locking en `claimPending`** (compare-and-swap vía `WHERE status = PENDING`, sin `SELECT FOR UPDATE`) — es de hecho el diseño con el que arrancó el proyecto, y tenía un bug real: el `UPDATE` de confirmación podía afectar 0 filas para ids que otro worker ya había reclamado, pero el método igual devolvía esos eventos como reclamados (leídos en un `findMany` previo, no en lo que el `UPDATE` realmente confirmó) — duplicando el procesamiento. Corregido migrando a locking pesimista real.

## Consecuencias

- **Regla general para decisiones futuras**: pesimista cuando el recurso es "una cola de trabajo con un solo dueño por item" (alta probabilidad de colisión, el costo de esperar el lock es aceptable, como `claimPending`); optimista cuando es "edición ocasional de un recurso de negocio" (baja probabilidad de colisión, no vale pagar el costo de bloquear lecturas todo el tiempo, como `User`/`Role`).
- El chequeo de versión en optimistic locking depende de que el cliente reciba y reenvíe la versión que vio — `UserResponse`/`RoleResponse` exponen `version`, y `UpdateUserSchema`/`UpdateRoleSchema` lo exigen en el request. Sin esto, el "lock" no protege nada: comparar la versión recién leída contra sí misma nunca detecta una colisión real.
- `SKIP LOCKED` evita que un worker bloqueado espere indefinidamente a otro — a costa de que, bajo carga muy alta, algunas filas puedan quedar "saltadas" varias rondas seguidas si siempre hay algún otro worker con lock sobre ellas (mitigado por el reintento periódico del propio `OutboxPublisherWorker`).
