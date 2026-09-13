# 0006 - Modular monolith en vez de microservicios independientes

## Estado

Aceptada

## Contexto

El sistema tiene varios módulos de dominio claramente separables (`health`, `auth`, `users`, `attachments`, `audit`, `notifications`). Existe la opción de desplegarlos como microservicios completamente independientes (repos, pipelines y bases de datos separadas por módulo) o como un monorepo con Lambdas separadas por endpoint que comparten código base y esquema de base de datos.

## Decisión

Se implementó un modular monolith: un único paquete (`nova-oms-backend`), un único esquema de Prisma, y un único stack de CDK (`NovaOmsApiStack`) que despliega ~23 Lambdas — una por endpoint/consumer, no una por módulo — con límites de módulo estrictos a nivel de código (`src/modules/<nombre>/`, cada uno con sus 4 capas) pero infraestructura y base de datos compartidas.

## Alternativas consideradas

- **Microservicios reales** (repo, pipeline, base de datos y despliegue independientes por módulo) — el patrón correcto cuando distintos equipos necesitan desplegar de forma independiente o cuando un módulo tiene requisitos de escala radicalmente distintos al resto. Para un proyecto de portafolio de un solo desarrollador, sin equipos separados ni necesidad de escalar un módulo de forma aislada, hubiera agregado el costo operacional de microservicios (múltiples pipelines, versionado de contratos entre servicios, bases de datos separadas con sus propias migraciones) sin ningún beneficio real a cambio.
- **Monolito tradicional** (un único proceso/Lambda gigante para toda la API) — se descartó porque pierde el beneficio real de Lambda (escalado y facturación independiente por endpoint) y porque un cold start de una función gigante afecta a todos los endpoints por igual, no solo al que realmente se usó.

## Consecuencias

- Cada Lambda es pequeña y específica (una por endpoint/consumer) y se empaqueta por separado con esbuild — el bundle de una no comparte nada en tiempo de ejecución con las demás. Lo que sí comparten es lo que realmente acopla los módulos entre sí: el mismo `package.json`/lockfile (un cambio de versión de una dependencia afecta a los 23 a la vez), un único `schema.prisma`, y un único stack/pipeline de despliegue. Los límites entre módulos se sostienen por disciplina de código (imports solo a través de las interfaces del módulo), no por un límite físico de repositorio ni de ciclo de release independiente.
- El esquema único es el acoplamiento real entre módulos — no una cuestión de infraestructura separable del código: todos los modelos de Prisma viven en el mismo archivo, así que un cambio de columna que otro módulo también consulta exige coordinar entre "servicios" que en teoría deberían poder evolucionar solos. Mitigado hoy porque cada módulo mantiene su propio conjunto de tablas bien delimitado dentro del esquema compartido.
- Migrar a microservicios reales en el futuro es factible sin rediseñar la lógica de negocio, pero requiere dos cambios concretos que hoy no existen: (1) partir `schema.prisma` en un esquema (o una base) por módulo, y (2) parametrizar el CDK/pipeline para desplegar el subconjunto de Lambdas de un módulo de forma independiente, en vez del stack completo en cada corrida. Los límites de dominio ya trazados en el código (`src/modules/<nombre>/`) son justamente lo que hace que esos dos cambios sean extraer un módulo a su propio schema/stack, y no reescribir nada de negocio.
