# 0001 - Hexagonal Architecture con puertos y adaptadores intercambiables

## Estado

Aceptada

## Contexto

Acoplar la lógica de negocio directamente a SDKs y servicios propietarios (AWS Cognito, S3, EventBridge) hace que esa lógica sea difícil de probar sin infraestructura real, y encarece cualquier cambio de proveedor o migración fuera de AWS — cada caso de uso terminaría con imports directos de `@aws-sdk/*` mezclados con reglas de negocio.

## Decisión

Se adoptó Clean/Hexagonal Architecture: cada módulo separa `domain` (entidades, interfaces de repositorio y de providers — los puertos), `application` (casos de uso, que dependen solo de esas interfaces), `infrastructure` (implementaciones concretas — los adaptadores) y `presentation` (handlers HTTP/cola). Los casos de uso nunca importan un SDK de AWS directamente, solo interfaces propias.

Cuatro puertos tienen **dos adaptadores reales funcionando**, no solo la interfaz declarada:

- `AuthenticationProvider`/`IdentityManagementProvider`: `Local*Impl` (JWT + sesiones Postgres) ↔ `Cognito*Impl` (User Pool real).
- `StorageProvider`: `LocalStorageProvider` (filesystem) ↔ `S3StorageProvider` (bucket real).
- `Logger`: `ConsoleLogger` ↔ `PowertoolsLogger`.
- `NotificationSender`: `ConsoleNotificationSenderImpl` ↔ `SesNotificationSenderImpl`.

El swap entre adaptadores es por variable de entorno (`AUTH_PROVIDER=cognito`, etc.), sin tocar ningún caso de uso.

## Alternativas consideradas

- **Arquitectura en capas tradicional (N-tier)** — más simple de escribir inicialmente, pero la lógica de negocio termina dependiendo de detalles de framework/infraestructura, dificultando tests unitarios reales y cualquier cambio de proveedor.
- **Acoplar directo a los SDKs de AWS desde los casos de uso** — menos código de por medio a corto plazo, pero cada test de caso de uso necesitaría simular el SDK de AWS en vez de una interfaz propia simple, y migrar de proveedor implicaría reescribir lógica de negocio, no solo un adaptador.

## Consecuencias

- Los 56 tests unitarios usan `mock<T>()` (`vitest-mock-extended`) contra las interfaces de dominio, sin necesidad de levantar infraestructura real ni simular SDKs de AWS.
- Cambiar de Cognito a otro proveedor de identidad (o de vuelta a Local) es una variable de entorno, no una migración de código.
- Costo: una capa de indirección adicional (interfaz + implementación) por cada integración externa, incluso cuando hoy solo se usa un adaptador en producción.
