# 0004 - RBAC como modelo de control de acceso

## Estado

Aceptada

## Contexto

El sistema necesita controlar qué operaciones puede ejecutar cada usuario autenticado, sin hardcodear checks de permisos dispersos en cada caso de uso.

## Decisión

Se implementó RBAC (Role-Based Access Control): los permisos se agrupan en roles (`ADMIN`, `SUPPORT`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `REPORT_ANALYST`, sembrados en `prisma/seeds/`), cada usuario tiene uno o más roles, y cada handler declara los permisos que requiere de forma declarativa vía `HandlerDescriptor.permissions`. `AuthorizationBehavior`, parte del pipeline de comportamientos (`PipelineBehaviorRegistry`), resuelve el check antes de que el caso de uso se ejecute.

## Alternativas consideradas

- **ABAC (Attribute-Based Access Control)** — reglas de acceso basadas en atributos dinámicos (ej. "un usuario solo puede editar su propio perfil", "solo durante horario laboral"). Da más flexibilidad, pero es más difícil de razonar, probar y auditar cuando el modelo de acceso es mayormente estable, que es el caso hoy — no existe ningún caso de uso actual que necesite una regla dinámica de ese tipo.
- **Checks de permisos manuales por caso de uso** (`if (!user.hasPermission("users:create")) throw ...`) — se descartó porque es fácil de olvidar en un endpoint nuevo, y dispersa la política de seguridad por todo el código en vez de centralizarla en un único behavior del pipeline.

## Consecuencias

- Agregar o quitar un permiso a un endpoint es editar el `HandlerDescriptor`, no tocar el pipeline ni el caso de uso.
- Si en el futuro aparece una regla de acceso realmente dinámica (ej. "el usuario solo puede editar su propio perfil salvo que sea admin"), RBAC por sí solo no la cubre — se resolvería con una regla ABAC puntual conviviendo con RBAC como base, no reemplazándolo.
