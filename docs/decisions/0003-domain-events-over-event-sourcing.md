# 0003 - Domain events con auditoría separada, en vez de Event Sourcing

## Estado

Aceptada

## Contexto

El sistema necesita trazabilidad de qué le pasó a cada entidad de negocio (quién cambió qué y cuándo) y un mecanismo para que otros módulos reaccionen a esos cambios. Existen dos formas de resolver esto: hacer que el estado actual de cada entidad se derive del propio historial de eventos (Event Sourcing), o mantener el estado actual en su propia tabla y usar los eventos solo como notificación/registro histórico.

## Decisión

Se optó por domain events: cada entidad (`User`, `Attachment`) mantiene su estado actual en su propia tabla (Postgres, vía Prisma), y los cambios de negocio publican `DomainEvent`s que son (a) despachados a otros módulos en el momento (`DomainEventHandler`) y (b) persistidos permanentemente como registro histórico en el módulo `audit` (`Audit.fromDomainEvents`), reutilizando los mismos eventos que ya se generan para el Outbox ([ADR-0002](0002-outbox-pattern-for-eventual-consistency.md)).

El estado actual del sistema **nunca depende** de reproducir el historial de eventos — si se borrara toda la tabla `Audit`, `users.status` seguiría siendo correcto.

## Alternativas consideradas

- **Event Sourcing completo** — el estado de cada entidad se calcularía reproduciendo su historial de eventos, con snapshots periódicos para no recalcular desde el evento inicial en cada lectura. Da auditoría perfecta y capacidad de reconstruir el estado exacto en cualquier punto del pasado ("time travel"), pero exige: versionado formal de cada tipo de evento (¿qué pasa cuando cambia la forma de un evento y ya hay millones guardados con la forma vieja?), una función de reducción (`reducer`) mantenida y sincronizada con cada cambio de la entidad, infraestructura de snapshots para que las lecturas no se degraden con el volumen, y la garantía estricta de que **ningún** cambio de estado ocurra sin generar su evento correspondiente — un solo cambio que se escape rompe la reconstrucción, no solo un reporte.
- **Sin ningún registro histórico** — más simple, pero sin auditoría ni capacidad de diagnosticar qué pasó ante un reporte de incidente.

## Consecuencias

- Se obtiene auditoría completa (`Audit`) sin que el estado en caliente del sistema dependa de ella para nada — un evento que se pierda afecta solo al historial, nunca a la corrección del sistema en producción.
- No hay capacidad de "time travel" real (reconstruir el estado exacto de una entidad en un punto arbitrario del pasado) con el diseño actual de los eventos, porque el payload de los eventos de actualización no lleva el delta completo de todos los campos cambiados — solo lo mínimo necesario para la notificación (ver `UserUpdatedEvent.toPayload()`). Extender el payload a un delta completo dejaría esa capacidad disponible como una consulta de solo lectura bajo demanda, sin necesidad de adoptar Event Sourcing como mecanismo de estado.
- Se evita la complejidad de mantenimiento de Event Sourcing (versionado de eventos, snapshots, reducers) para un dominio donde ningún requisito de negocio exige reconstrucción histórica exacta.
