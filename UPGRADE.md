# Upgrade Guide

## [1.0.0-RC1] - 2026-09-04

Primera versión de Nova OMS Backend — no hay una versión anterior desde la cual migrar. Esta guía cubre la **puesta en marcha inicial** completa. Cuando exista una `1.x` siguiente, los pasos de migración entre versiones se agregarán como nuevas secciones en este mismo documento.

## Requisitos previos

| Herramienta | Versión | Necesaria para |
|---|---|---|
| Node.js | 24.x | Runtime de la app y de las Lambdas |
| pnpm | ^11.9.0 | Instalación de dependencias y scripts (`devEngines` lo fuerza) |
| Docker + Docker Compose | cualquiera reciente | Postgres local, LocalStack/MinIO |
| AWS CLI | v2 | Despliegue a AWS real (credenciales configuradas) |
| SAM CLI | cualquiera reciente | Solo si se va a probar `sam local` |
| Licencia LocalStack | Pro (opcional) | Solo si se usa el `docker-compose.yml` tal cual (usa `sesv2`, `scheduler`, servicios Pro) |

`aws-cdk` y `aws-cdk-local` ya vienen como `devDependencies` — no hace falta instalarlos globalmente, se invocan vía `pnpm cdk`/`pnpm lcdk`.

## 1. Variables de entorno

Crear un `.env` en la raíz de `nova-oms-backend/` con, como mínimo, las variables de conexión a base de datos y JWT (ver la tabla completa en el [README, sección 8](./README.md#8-variables-de-entorno)):

```env
APP_NAME=nova-oms
APP_VERSION=1.0.0-RC1
APP_ENV=local

DB_USER=nova
DB_PASSWORD=changeme
DB_HOST=localhost:5432
DB_NAME=nova_oms

JWT_SECRET=<generar-un-valor-propio>
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_DAYS=1

AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1

AWS_S3_BUCKET=novaoms-dev-attachments
SES_EMAIL_ADDRESS=notificaciones@tudominio.com
```

No reutilizar ninguno de estos valores en un entorno productivo — son placeholders de desarrollo.

## 2. Base de datos — migraciones y seed (pasos explícitos y separados)

El proyecto no tiene scripts `pnpm` dedicados a Prisma — se usa la CLI directo vía `npx`. `prisma.config.ts` define el seed (`tsx prisma/seed.ts`), pero **solo se ejecuta automáticamente en un caso**, no en todos.

```bash
# 1. Levantar Postgres
docker compose -f docker/docker-compose.yml up -d db
```

**Aplicar migraciones** — dos caminos según el entorno:

```bash
# Desarrollo: crea la DB si no existe, genera migración si el schema cambió,
# y SIEMBRA AUTOMÁTICAMENTE al final
npx prisma migrate dev
```

```bash
# Tipo producción/CI: solo aplica las migraciones ya existentes en prisma/migrations/
# NO siembra datos por sí solo
npx prisma migrate deploy
```

**Correr el seed explícitamente** — obligatorio si se usó `migrate deploy` (no se ejecuta solo):

```bash
npx prisma db seed
```

Esto corre `SeedRunner` en orden (`PermissionSeeder` → `RoleSeeder` → `RolePermissionSeeder` → `UserSeeder`), poblando:
- 5 roles: `ADMIN`, `SUPPORT`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `REPORT_ANALYST`.
- El catálogo completo de permisos por dominio funcional.
- Usuarios de prueba — ver `prisma/seeds/UsersCatalog.ts` para las credenciales de desarrollo (no se publican en este documento).

Si en algún momento hace falta regenerar el cliente Prisma manualmente (normalmente ya lo hacen `migrate dev`/`migrate deploy`):

```bash
npx prisma generate
```

Estos pasos son para local/LocalStack. Contra AWS real, el stage `MigrateAndSeed` de `NovaOmsPipelineStack` corre `prisma migrate deploy` + seed automáticamente en cada ejecución del pipeline — ver sección 4.1.

## 3. Instalación y compilación

```bash
pnpm install
pnpm build       # compila a dist/ (tsc -p tsconfig.build.json)
# o, para solo validar tipos sin emitir:
pnpm typecheck
```

## 4. Despliegue — 3 caminos

### 4.1 AWS real

El proyecto sintetiza **dos stacks**: `NovaOmsApiStack` (todo lo funcional) y `NovaOmsPipelineStack` (CI/CD). `PipelineStack` depende del VPC de `ApiStack` vía cross-stack reference, así que se sintetizan/despliegan juntos por defecto.

```bash
pnpm cdk bootstrap        # solo la primera vez por cuenta/región
pnpm cdk:synth            # sintetiza los 2 stacks
pnpm cdk:deploy           # despliega ambos
```

Antes de desplegar `NovaOmsPipelineStack` de verdad (no solo sintetizar), hace falta crear manualmente la conexión de CodeStar a GitHub en la consola de AWS (autorización OAuth) y completar `GITHUB_CONNECTION_ARN` en el contexto `pipeline` de `cdk.json` — no se puede crear solo con CDK.

Verificar al final los `CfnOutput` del stack — `HttpApiUrl` (URL base de la API), `CognitoUserPoolIdOutput`/`CognitoUserPoolClientIdOutput`, `AttachmentsBucketName`, `DatabaseEndpoint`, `EventBusName`, `PipelineName`, y un `<Módulo>QueueUrl` por cada cola SQS.

### 4.2 LocalStack

```bash
docker compose -f docker/docker-compose.yml up -d stack   # levanta LocalStack

pnpm lcdki    # bootstrap (una vez por contenedor de LocalStack)
pnpm lcdkd    # deploy completo
```

Verificación:
```bash
aws --endpoint-url=http://localhost:4566 lambda list-functions --query "Functions[].FunctionName"
```
Debería listar las 23 funciones `NovaOms-*`.

Para iterar rápido en desarrollo (solo cambios de código Lambda, sin cambios de infraestructura):
```bash
pnpm lcdkh    # deploy con hotswap
```
o, para no repetir el comando en cada cambio:
```bash
pnpm lcdk watch --profile localstack
```

Para reiniciar desde cero:
```bash
pnpm lcdkrd   # destroy + deploy en un solo comando
```

### 4.3 SAM local (sobre el template generado por CDK)

No existe `template.yaml`/`samconfig.toml` propio del proyecto — se reutiliza el CloudFormation que sintetiza CDK:

```bash
pnpm cdk:synth
sam local start-api -t cdk.out/NovaOmsApiStack.template.json
```

## 5. Verificación post-despliegue

1. `GET /health` sobre la URL del API Gateway — debe responder `200`.
2. `POST /auth/login` con un usuario sembrado — debe devolver un `accessToken`/`refreshToken`.
3. `POST /users` (autenticado, con permiso correspondiente) — confirma que el flujo completo (pipeline → UseCase → Repository → Outbox → EventBridge → `user-queue`) no rompe; revisar logs del `UserQueueConsumerLambda` para confirmar que recibió el evento `user.created`.
4. **Confirmar la suscripción de email de la alarma de DLQ** — SNS manda un mail de "AWS Notification - Subscription Confirmation" a `SES_EMAIL_ADDRESS` apenas se despliega el stack; sin hacer click en el link de confirmación, la alarma de CloudWatch queda "conectada" pero nunca va a notificar nada. Revisar la bandeja de entrada (y spam) apenas termine el deploy.

---

## Autor

**Adrian Suarez**
Líder Técnico · Arquitecto de Software · Desarrollador Full Stack

📧 adriansuarezucv@gmail.com

*Nova OMS — 2026*
