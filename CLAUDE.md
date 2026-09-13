# nova-oms-backend — Contexto operativo

Nova OMS Backend es un proyecto de portafolio técnico que implementa, de punta a punta y con código desplegable, el bounded context de **Identity & Access Management** (usuarios, roles, permisos RBAC, sesiones, adjuntos, auditoría, notificaciones) sobre una arquitectura serverless AWS completa. El dominio de negocio que da nombre al proyecto (Orders/Catalog/Inventory/Billing) es la excusa temática, no el objetivo — lo que se evalúa acá es la arquitectura: Clean/Hexagonal + DDD a nivel de código, event-driven con patrón Outbox transaccional a nivel de infraestructura, y un pipeline de CI/CD propio.

Ver también el `CLAUDE.md` de la raíz del workspace para el panorama general (qué carpetas del workspace tienen código real).

## Comandos

- `pnpm dev` — servidor Express local (`src/local/server.ts`) que adapta HTTP → los mismos handlers que corren en Lambda.
- `docker compose -f docker/docker-compose.yml up -d` — Postgres 17 local + LocalStack/MinIO, para desarrollo y tests de integración.
- `pnpm test` / `pnpm test:u` — Vitest, suite `tests/unit` (56 tests).
- `pnpm test:i` — Vitest, suite `tests/integration` (5 tests contra Postgres real, requiere DB levantada).
- `pnpm test:coverage` — cobertura v8.
- `pnpm lint` / `pnpm typecheck` — cubren `src/`, `infra/`, `tests/`, `prisma/seed.ts` y `scripts/` (excepto `scripts/dev-tools/`, excluida a propósito).
- Prisma: migraciones y seed en `prisma/` (`prisma/seeds/` siembra 5 roles: `ADMIN`, `SUPPORT`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `REPORT_ANALYST`, más el catálogo de permisos).
- `pnpm cdk bootstrap` / `pnpm cdk:synth` / `pnpm cdk:deploy` — sintetizan y despliegan los dos stacks (`NovaOmsApiStack` + `NovaOmsPipelineStack`).

## Arquitectura

Clean/Hexagonal Architecture + DDD, "modular monolith". Cada módulo en `src/modules/<nombre>/` sigue siempre 4 capas:

```
domain/          entidades, interfaces de repositorio (puertos), value objects
application/     casos de uso, DTOs, mappers, puertos de providers, servicios
infrastructure/  implementaciones Prisma, implementaciones de providers AWS (adaptadores)
presentation/    handlers de cara a Lambda + schemas de validación Zod
```

Módulos: `health`, `auth`, `users` (incluye roles/permisos), `attachments` (S3, presigned URLs, emite domain events propios vía `DomainEventDispatcher`), `audit` (reactivo a eventos de dominio — solo `domain/`+`infrastructure/`, sin `application/`/`presentation/` porque no expone HTTP ni casos de uso propios, es intencional), `notifications` (implementado de punta a punta: `CreateNotificationUseCase`, plantillas por tipo, persistencia con idempotencia, envío real vía SES; reacciona a eventos de `users` y `attachments`).

### Pipeline de request

`API Gateway → src/lambdas/.../*.ts → LambdaFactory.create(handler) → LambdaHandler (AsyncLocalStorage RequestContext + exceptionMiddleware) → Pipeline (Logging → Authentication → Authorization → RequestValidation → Idempotency → Transaction) → Handler.handle() → UseCase.execute() → Repository (Prisma)`

Cada handler declara su comportamiento de forma declarativa vía `HandlerDescriptor`:
```ts
{ request?: ZodType, permissions?: string[], authenticated?: boolean, transaction?: boolean, idempotent?: boolean }
```
`PipelineBehaviorRegistry.resolve()` arma la cadena exacta según ese descriptor — para agregar/quitar comportamiento a un endpoint, se edita el descriptor, no el pipeline. El mismo mecanismo, adaptado (`SqsLambdaHandler`), corre para los consumers de cola.

### Puertos y adaptadores intercambiables — ambos lados desplegados

El patrón es swap por variable de entorno, sin tocar casos de uso:

- `AuthenticationProvider` / `IdentityManagementProvider`: `Local*Impl` (activo por defecto) ↔ `Cognito*Impl` (User Pool + Client reales en CDK, activable con `AUTH_PROVIDER=cognito`). Los access tokens de Cognito no llevan `email` (solo `sub`), así que `users.cognitoSub` guarda el `sub` real y `PrismaIdentityRepositoryImpl.load()` resuelve por `id OR cognitoSub` — misma consulta para ambos proveedores.
- `StorageProvider`: `LocalStorageProvider` (filesystem) ↔ `S3StorageProvider` (bucket real, conectado vía `/attachments*`).
- `Logger`: `ConsoleLogger` (activo) ↔ `PowertoolsLogger` (implementado, no default).

### Infraestructura AWS — dos stacks

- **`NovaOmsApiStack`**: API Gateway HTTP API v2, 23 Lambdas, RDS PostgreSQL (`db.t4g.micro`), Cognito User Pool, EventBridge (bus + reglas + Scheduler), SNS, 3 colas SQS + DLQ, S3, Secrets Manager (con rotación automática activa: JWT 15 días, DB 30 días), SSM, SES.
- **`NovaOmsPipelineStack`**: CodePipeline propio (Source GitHub → Build → Deploy → MigrateAndSeed), independiente del stack funcional, toma su VPC vía cross-stack reference. El stage `MigrateAndSeed` corre `prisma migrate deploy` + seed en un contenedor CodeBuild con filesystem escribible. Buildspecs versionados en `pipeline/buildspecs/`.

### Otros mecanismos clave

- `ExecutionContextProvider` (`AsyncLocalStorage`) — contexto de request (`requestId`/`userId`/body ya interpretado/transacción activa) disponible en cualquier capa sin pasar parámetros.
- `src/shared/database/queries/` — capa de queries genérica sobre Prisma: operadores (`ComparisonOperator`, `InOperator`, `LikeOperator`), `OperatorRegistry`, `PrismaQueryInterpreter`, `UnitOfWork`/`PrismaUnitOfWorkImpl` para transacciones.
- Errores estandarizados en `src/shared/errors/` (`ApplicationError` y subclases), mapeados centralmente a HTTP en `exceptionMiddleware.ts`.
- DI manual: cada módulo tiene su `*Container.ts`, compuestos desde `SharedContainer`/`SharedInfrastructure`/`ApplicationServices` en `src/bootstrap/Bootstrap.ts`. El contenedor de eventos (`EventSharedContainer`, `EventWorkerSharedContainer`) vive aparte en `src/bootstrap/events/`, instanciado manualmente en el `bootstrap.ts` de cada lambda que lo necesita.
- Fan-out de eventos con dos mecanismos conviviendo a propósito (demuestra ambos patrones): `EventConstruct.addEventRule()` (EventBridge, eventos de dominio propios, ej. `user.*`) y `EventConstruct.addTopic()` (SNS, notificación nativa de S3→SNS→SQS de `attachments`). Ambos pueden apuntar a la misma cola SQS — el mensaje llega desenvuelto y normalizado vía `normalizeSqsMessage()` (`src/shared/aws/lambda/messages/MessageMapper.ts`).
- Outbox pattern: `DomainEventDispatcher` persiste el evento en la misma transacción que el cambio de datos antes de publicar; `OutboxPublisherWorker` (Lambda disparado por EventBridge Scheduler cada día) reintenta eventos pendientes/fallidos como red de seguridad.
- `CfnOutput` en cada construct expone lo necesario para probar manualmente tras un deploy (URL de API, IDs de Cognito, bucket, endpoint de RDS, nombre del bus, nombre del pipeline, URL de cada cola) — evita tener que buscar cada recurso en la consola.
- Resiliencia: `ResiliencePolicyFactory` (`cockatiel`) arma una política de retry+circuit breaker+timeout por servicio externo, inyectada por constructor a los adaptadores que lo llaman (una sola instancia compartida por servicio, no una por clase) — hoy cubre Cognito y SES. `SharedContainer.metrics` (`@aws-lambda-powertools/metrics`) sigue el mismo patrón que `logger`: una instancia por cold start, inyectada donde haga falta, emitida centralmente en `exceptionMiddleware` (HTTP) y `SqsLambdaHandler` (SQS) — nunca por el componente que la usa.

### Testing

61 tests (56 unit + 5 integration), elegidos por criterio de riesgo/valor arquitectónico: pipeline de comportamientos completo, `shared/errors`, `shared/database/queries`, `LoginUseCase`, `CreateUserUseCase` (con su orquestación externa), patrón Outbox completo, `notifications`, y tests de integración reales contra Postgres (`PrismaUserRepositoryImpl` — incluyendo el incremento de `version` y el conflicto por versión desactualizada — y `PrismaOutboxRepositoryImpl.claimPending` probando la semántica de concurrencia real). Dobles armados con [`vitest-mock-extended`](https://www.npmjs.com/package/vitest-mock-extended) (`mock<T>()`) — tipados contra la interfaz real, no clases fake escritas a mano.

### Convenciones de código

- Alias de paths (`tsconfig.json`, espejados en `vitest.config.ts`): `@bootstrap/*`, `@modules/*`, `@shared/*`, `@lambdas/*`, `@generated/*`.
- Naming: `XUseCase`, `XRepository` (sin prefijo `I`), `XProviderImpl`, eventos `XEvent`, handlers `XHandler`, consumers de cola `XQueueConsumerHandler` (archivo y clase deben coincidir).
- Eventos de dominio: publicación vía **Outbox pattern** centralizado en `shared/` — no crear una clase "Producer" por módulo, cada módulo solo define sus propios `XEvent.ts`.
- Tests de integración usan `executionContextProvider.run(...)` para simular el contexto que en producción establece el pipeline real — necesario porque `PrismaProvider.getClient()` depende de un `ExecutionContext` activo.
- `tsconfig` estricto: `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `isolatedModules`.

## Decisiones de scope (no son carencias)

- El dominio de negocio (Orders/Catalog/Inventory/Billing) queda fuera de alcance a propósito — el objetivo es demostrar arquitectura sobre un bounded context completo, no construir un ERP entero.
- `GITHUB_CONNECTION_ARN` (contexto `pipeline` de `cdk.json`) requiere un paso manual de autorización OAuth en la consola de AWS antes de poder desplegar `NovaOmsPipelineStack` contra un repo real — no es automatizable con CDK.

Detalle operativo adicional en `README.md` (referencia completa, incluye los diagramas de arquitectura de infraestructura y de aplicación en `docs/architecture/`), `CHANGELOG.md` (historia de lo construido) y `UPGRADE.md` (puesta en marcha paso a paso).
