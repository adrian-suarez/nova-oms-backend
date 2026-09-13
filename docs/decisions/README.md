# Architecture Decision Records

Registro de las decisiones de arquitectura relevantes de Nova OMS Backend, en formato [ADR](https://adr.github.io/) (una decisión por archivo, numerada de forma secuencial). Cada registro documenta el contexto, la decisión tomada, las alternativas consideradas y sus consecuencias — no solo qué se construyó, sino por qué.

## Índice

| # | Decisión | Estado |
|---|---|---|
| [0001](0001-hexagonal-architecture-ports-and-adapters.md) | Hexagonal Architecture con puertos y adaptadores intercambiables | Aceptada |
| [0002](0002-outbox-pattern-for-eventual-consistency.md) | Patrón Outbox transaccional para consistencia eventual entre datos y eventos | Aceptada |
| [0003](0003-domain-events-over-event-sourcing.md) | Domain events con auditoría separada, en vez de Event Sourcing | Aceptada |
| [0004](0004-rbac-over-abac.md) | RBAC como modelo de control de acceso | Aceptada |
| [0005](0005-identity-access-management-bounded-context-scope.md) | Alcance del proyecto acotado al bounded context de Identity & Access Management | Aceptada |
| [0006](0006-modular-monolith-over-microservices.md) | Modular monolith (Lambdas por endpoint, código compartido) en vez de microservicios independientes | Aceptada |
| [0007](0007-interchangeable-auth-providers-local-cognito.md) | Doble proveedor de autenticación (Local JWT y Cognito) intercambiable por configuración | Aceptada |
| [0008](0008-idempotency-key-pipeline-behavior.md) | Idempotency-Key como comportamiento genérico del pipeline | Aceptada |
| [0009](0009-circuit-breaker-for-external-providers.md) | Circuit breaker + retry sobre adaptadores externos | Aceptada |
| [0010](0010-concurrency-control-optimistic-vs-pessimistic.md) | Optimistic locking para edición de recursos, pessimistic locking para colas de trabajo | Aceptada |
| [0011](0011-rds-proxy-for-lambda-connection-pooling.md) | RDS Proxy para pooling de conexiones desde Lambda | Aceptada |
| [0012](0012-centralized-metrics-emission.md) | Métricas custom centralizadas, con flush por camino de invocación | Aceptada |

## Formato

Cada ADR sigue esta estructura:

- **Estado** — Aceptada / Reemplazada por otra ADR / En reconsideración.
- **Contexto** — el problema o la necesidad real que motiva la decisión.
- **Decisión** — qué se eligió y por qué es correcto para este proyecto.
- **Alternativas consideradas** — qué otras opciones existían y por qué no se eligieron acá.
- **Consecuencias** — qué trade-offs se aceptan a cambio.

## Cómo se relaciona con el resto de la documentación

- El detalle operativo de cada patrón (dónde vive el código, cómo se prueba) está en [`CLAUDE.md`](../../CLAUDE.md) y en los diagramas de arquitectura del [`README.md`](../../README.md#2-arquitectura).
- El listado completo de patrones de diseño aplicados está en la sección 6 del [`README.md`](../../README.md).
