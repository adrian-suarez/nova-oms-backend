# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo. El formato está inspirado en [Keep a Changelog](https://keepachangelog.com/). Es la primera versión publicada del proyecto — no hay versiones anteriores ni historial de commits previo, así que esta entrada describe el estado completo en el orden en que se construyó, no un diff contra una versión publicada antes.

## [1.0.0-RC1] - 2026-09-04

### Fundación y pipeline de request

- Framework base `Handler` / `HandlerDescriptor` / `Pipeline` — arma la cadena de comportamiento (autenticación, autorización, transacción, validación) de forma declarativa por handler, sin tocar el pipeline en sí.
- `LambdaFactory` / `LambdaHandler` con contexto de ejecución vía `AsyncLocalStorage` (`ExecutionContextProvider`) y `exceptionMiddleware` centralizado.
- `IdempotencyBehavior`: idempotencia genérica vía header `Idempotency-Key`, con claim atómico (`INSERT` + constraint de unicidad), guarda en caché la respuesta y detecta reuso de la misma key con un body distinto (`409 Conflict` por hash del request). Una key que queda en `PROCESSING` por un Lambda caído (timeout, crash) se recupera sola pasados 60s, sin intervención manual.
- Módulo `health` — referencia mínima del patrón de 4 capas.

### Autenticación

- Módulo `auth`: JWT local (`LocalAuthenticationProviderImpl`, `jose`), sesiones persistidas en Postgres (`UserSession`), `LoginUseCase`/`LoginHandler`. Proveedor activo por defecto.
- Adaptador alterno `CognitoAuthenticationProviderImpl`/`CognitoIdentityManagementProviderImpl`: `CognitoConstruct` crea un `User Pool` + `UserPoolClient` reales en CDK, IDs expuestos vía SSM y `CfnOutput`. Se activa con `AUTH_PROVIDER=cognito`, sin tocar casos de uso.
- `ResiliencePolicyFactory` (`cockatiel`): circuit breaker + retry con backoff + timeout por intento, una única política compartida por servicio externo (inyectada por constructor a los adaptadores que la necesitan, no una por clase) — cubre las llamadas de Cognito (`login`/`refresh`/`logout`/gestión de usuarios) y de SES. Filtra errores de negocio (credenciales inválidas, email ya existente) para que no cuenten como falla del servicio externo. `authenticate()` (verificación local de JWT) queda fuera a propósito, sin llamada remota que proteger.

### Gestión de usuarios y RBAC

- Módulo `users`: entidades `User`, `Role`, `Permission`, con roles y permisos integrados en el mismo módulo.
- CRUD completo de usuarios y roles (6 + 5 endpoints), catálogo de permisos por dominio funcional.
- Eventos de dominio `UserCreatedEvent` / `UserUpdatedEvent` / `UserDeletedEvent`.
- Optimistic concurrency control (columna `version`) en `User`/`Role`: `UPDATE ... WHERE id AND version` atómico, conflicto de escritura concurrente traducido a `409 Conflict`.

### Almacenamiento de archivos

- Módulo `attachments`: entidades y value objects de dominio, `StorageProvider` como puerto con `S3StorageProviderImpl` (URLs prefirmadas de subida/descarga).
- Casos de uso de upload, confirmación (con validación real de tipo de archivo vía `file-type`), descarga, listado y borrado.
- Denormalización de `ownerUserEmail` en `Attachment` para desacoplar de consultas a `users` en runtime.
- Domain events propios (`AttachmentUploadedEvent`, `AttachmentFailedEvent`, `AttachmentDeletedEvent`), publicados vía `DomainEventDispatcher`.

### Auditoría

- Módulo `audit`: reactivo a eventos de dominio, `AuditEventHandler` corre síncronamente en `DomainEventDispatcher.confirmSuccess()`, en una transacción propia inmediatamente después de que confirma la transacción principal del caso de uso — no dentro de la misma.

### Arquitectura orientada a eventos

- Entidad `OutboxEvent` y patrón Outbox transaccional: los eventos de dominio se persisten en la misma transacción que el cambio de datos antes de intentar publicarse.
- `DomainEventDispatcher`: orquesta la publicación post-transacción y la ejecución de handlers síncronos (como `audit`).
- `ExternalSyncOrchestrator`: orquestación de sincronización con servicios externos sobre el mismo mecanismo de Unit of Work.
- `OutboxPublisherWorker` + Lambda `OutboxPublisherWorkerLambda`, disparado por EventBridge Scheduler (`rate(1 day)`) — reintento de eventos pendientes/fallidos como red de seguridad del patrón.
- `claimPending` usa locking pesimista real (`SELECT ... FOR UPDATE SKIP LOCKED`) para que dos ejecuciones concurrentes del worker nunca reclamen el mismo evento.

### Notificaciones

- Módulo `notifications`: entidad `Notification`, persistencia con idempotencia por `id` de evento origen, `NotificationSender` como puerto con `SesNotificationSenderImpl` (real, con circuit breaker + retry) y `ConsoleNotificationSenderImpl` (desarrollo local).
- Integración con Amazon SES (identidad de email verificada / verificación programática contra LocalStack).
- Reacciona a eventos de `users` y `attachments` con plantillas propias por tipo de notificación.

### Base de datos gestionada

- `DatabaseConstruct`: RDS PostgreSQL 17 (`db.t4g.micro`, GP3, subnets privadas aisladas, cifrado en reposo), con `deletionProtection`/`removalPolicy: SNAPSHOT` en `prod`. El endpoint real se inyecta a las Lambdas vía `ConfigConstruct.setDbHostProperty(...)`.
- RDS Proxy delante de la instancia (pooling/multiplexado de conexiones) — activo en todo ambiente salvo `local`, donde el construct completo queda condicionado para no crearse contra LocalStack.

### Infraestructura AWS

- Stack `ApiStack`: API Gateway HTTP API v2 (18 rutas), 23 Lambdas, 3 colas SQS + 3 DLQ, 2 topics SNS (`UploadTopic` para la notificación nativa de S3, `DlqAlarmTopic` para las alarmas de las 3 DLQ), bus de EventBridge con 2 reglas de fan-out + 1 Scheduler, bucket S3 con notificaciones, Secrets Manager + SSM, SES.
- Fan-out dual EventBridge (eventos de dominio) + SNS (notificación nativa de S3) conviviendo a propósito, como demostración de ambos patrones de integración.
- Rotación automática de secretos: JWT cada 15 días (`JwtRotationLambda`), credenciales de DB cada 30 días (`HostedRotation.postgreSqlSingleUser()`).
- Tracing distribuido con X-Ray: activo en cada Lambda (`tracing: ACTIVE`), instrumentando cada query de Prisma como segmento propio (`prisma.<model>.<operation>`, con captura de errores) y los clientes AWS de Cognito/SES (`captureAWSv3Client`), con anotación del estado del circuit breaker cuando corta una llamada.
- Métricas custom vía CloudWatch EMF (`@aws-lambda-powertools/metrics`): instancia única compartida (`SharedContainer.metrics`), emitida al final de cada invocación HTTP (`exceptionMiddleware`) y SQS (`SqsLambdaHandler`) — aperturas de circuit breaker, reintentos consumidos y latencia real de las llamadas externas.
- Throttling en el stage del API Gateway (`rateLimit`/`burstLimit`), CORS restringido por ambiente (`allowedOrigins` obligatorio, ya no `"*"` por default), y alarmas de CloudWatch sobre cada DLQ con notificación por email vía SNS.
- `CfnOutput` por cada recurso relevante para probar manualmente tras un deploy: URL de API, IDs de Cognito, bucket S3, endpoint de RDS, nombre del bus de EventBridge, y URL de cada cola SQS.

### CI/CD — pipeline propio

- Stack `PipelineStack` (independiente de `ApiStack`, comparte VPC vía cross-stack reference) con `PipelineConstruct`: CodePipeline de 4 stages (Source GitHub → Build → Deploy → MigrateAndSeed), buildspecs versionados en `pipeline/buildspecs/`.
- El stage `MigrateAndSeed` corre `prisma migrate deploy` + seed en CodeBuild, dentro de la VPC privada.
- IAM de mínimo privilegio en el stage de migración: `Secret.fromSecretNameV2`/`StringParameter.fromStringParameterName` + `.grantRead()`, sin permisos abiertos.
- `PipelineName` expuesto vía `CfnOutput`.

### Testing

- 56 tests: pipeline de comportamientos completo, `shared/errors`, `shared/database/queries`, `LoginUseCase`, `CreateUserUseCase` (con su orquestación externa), patrón Outbox completo, `notifications`, y tests de integración reales contra Postgres.
- Dobles armados con [`vitest-mock-extended`](https://www.npmjs.com/package/vitest-mock-extended) (`mock<T>()`), tipados contra la interfaz real.

### Calidad de código

- ESLint cubre `src/`, `infra/`, `tests/`, `prisma/seed.ts` y `scripts/` (excepto `scripts/dev-tools/`, herramientas de desarrollo local excluidas a propósito).
- `scripts/dev-tools/` — herramientas de desarrollo local sin mantenimiento formal, fuera del alcance de `tsconfig`/`eslint`.

### Documentación

- Diagramas de arquitectura de infraestructura y de aplicación (`docs/architecture/`), integrados directamente en el README.
- README completo (raíz y backend), este `CHANGELOG.md`, y `UPGRADE.md`.

### Notas conocidas

- `GITHUB_CONNECTION_ARN` (contexto `pipeline` de `cdk.json`) requiere un paso manual de autorización OAuth en la consola de AWS antes de poder desplegar `PipelineStack` contra un repositorio real — no es automatizable con CDK.
- La suscripción de email de la alarma de DLQ (SNS) requiere confirmación manual (click en el mail de "confirm subscription") la primera vez tras el deploy.

---

## Autor

**Adrian Suarez**
Líder Técnico · Arquitecto de Software · Desarrollador Full Stack

📧 adriansuarezucv@gmail.com

*Nova OMS — 2026*
