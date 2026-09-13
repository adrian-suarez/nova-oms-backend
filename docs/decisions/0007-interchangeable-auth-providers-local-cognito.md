# 0007 - Doble proveedor de autenticación (Local JWT y Cognito) intercambiable por configuración

## Estado

Aceptada

## Contexto

Un sistema serverless con múltiples Lambdas sin estado compartido en memoria necesita un mecanismo de autenticación que no dependa de sesión mantenida en un único proceso. Existe además la decisión de si delegar identidad y gestión de usuarios en un servicio gestionado (Cognito) o mantenerla resuelta dentro de la propia aplicación.

## Decisión

Se implementaron **ambos** adaptadores del puerto `AuthenticationProvider`/`IdentityManagementProvider` ([ADR-0001](0001-hexagonal-architecture-ports-and-adapters.md)), completos y funcionales: `Local*Impl` (JWT firmado con secreto rotado automáticamente cada 15 días vía Secrets Manager, sesiones en Postgres) y `Cognito*Impl` (User Pool + Client real desplegados en CDK). El proveedor activo se controla con `AUTH_PROVIDER`, sin cambios de código en los casos de uso que consumen el puerto.

## Alternativas consideradas

- **Solo Cognito** — es la opción recomendada por AWS para producción real (maneja MFA, recuperación de contraseña, verificación de email, compliance, sin mantenerlo uno mismo), pero implementar únicamente el adaptador gestionado no demuestra que el puerto de autenticación es realmente intercambiable — solo mostraría un adaptador funcionando, sin evidencia de que el diseño hexagonal cumple lo que promete.
- **Solo JWT local** — más simple y sin dependencia de un servicio gestionado, pero no demuestra integración real con un servicio de identidad de AWS, que es parte de lo que el proyecto busca evidenciar.

## Consecuencias

- Tener ambos adaptadores completos, no solo declarados, es la prueba concreta del patrón Ports & Adapters — no una interfaz con un único caso de uso disfrazada de "intercambiable".
- Duplica el esfuerzo de mantenimiento de la capa de autenticación (dos implementaciones a mantener en paralelo) frente a haber elegido una sola desde el principio.
- El proveedor activo por defecto es Local, no Cognito — en un despliegue real a producción, la decisión correcta sería `AUTH_PROVIDER=cognito` por las razones de la alternativa considerada; Local queda como el default de desarrollo/portafolio por no depender de un recurso AWS desplegado para correr localmente.
