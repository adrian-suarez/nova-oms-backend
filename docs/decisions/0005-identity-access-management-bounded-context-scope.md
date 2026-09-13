# 0005 - Alcance del proyecto acotado al bounded context de Identity & Access Management

## Estado

Aceptada

## Contexto

Nova OMS es un proyecto de portafolio técnico orientado a demostrar arquitectura de software y AWS serverless. El nombre del proyecto (Order Management System) sugiere un dominio de negocio completo (Orders, Catálogo, Inventario, Facturación), pero construir ese dominio entero no aporta más señal arquitectónica que construir uno bien — agrega superficie de código sin agregar profundidad de patrones.

## Decisión

Se construyó, de punta a punta, un único bounded context — Identity & Access Management (usuarios, roles, permisos, sesiones, adjuntos, auditoría, notificaciones) — con toda la profundidad arquitectónica del proyecto (Hexagonal, Outbox, event-driven, pipeline propio de CI/CD) aplicada sobre él. El dominio de Orders/Catálogo/Inventario/Facturación queda fuera de alcance; solo existen como strings de permisos placeholder en el seed de roles, sin entidades ni casos de uso.

## Alternativas consideradas

- **Construir el dominio de negocio completo (Orders, Catálogo, Inventario)** — hubiera hecho al proyecto más fiel a su nombre, pero a costa de repartir el esfuerzo entre más superficie de dominio en vez de profundizar los patrones arquitectónicos que son el objetivo real de la demostración.
- **Construir varios bounded contexts superficialmente** (Orders y Users ambos con CRUD básico, sin Outbox/eventos en ninguno) — se descartó porque diluye la señal: es más valioso un contexto completo con todos los patrones aplicados que varios incompletos.

## Consecuencias

- El proyecto demuestra profundidad arquitectónica (RBAC completo, Outbox, doble adaptador por puerto, pipeline de CI/CD propio) sobre un único contexto, en vez de amplitud superficial sobre varios.
- Un revisor que entre esperando encontrar pedidos/catálogo no los va a encontrar — el nombre del proyecto es la excusa temática, no el alcance real; esto se documenta explícitamente para no generar una expectativa que el código no cumple.
- Extender el proyecto a un segundo bounded context (Orders) en el futuro es viable sin rediseño — la arquitectura modular (`src/modules/<nombre>/`) y los mecanismos compartidos (Outbox, pipeline de behaviors, DI manual) ya están pensados para agregar módulos nuevos sin tocar los existentes.
