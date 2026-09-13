# Costos estimados en AWS

Referencia rápida para dimensionar el costo de desplegar `nova-oms-backend` contra una cuenta AWS real. Cifras aproximadas, región `us-east-1` — **verificar con la [AWS Pricing Calculator](https://calculator.aws) antes de comprometerse**, esto no es un compromiso de costo real, es orden de magnitud para decidir cuánto tiempo dejar el stack desplegado.

## Costo dominante: NAT Gateway

- ~$0.045/hora fijo + cargo por GB procesado — cobra esté en uso o no, independientemente del tráfico real.
- Es necesario porque una Lambda no puede salir a internet sin NAT aunque esté en una subnet "pública": su ENI nunca recibe IP pública, a diferencia de una instancia EC2.
- **Patrón recomendado**: `pnpm cdk:deploy` para probar, `cdk destroy` al terminar. Una sesión de pruebas de unas horas cuesta ~$1.5-3.5 total, contra ~$32-35/mes si el stack queda desplegado todo el mes.

## Por qué no se reemplazó por VPC Endpoints

Reemplazar el NAT Gateway por VPC Endpoints tipo Interface **no ahorra** en este proyecto: harían falta ~7 endpoints (Secrets Manager, SSM, SQS, SNS, EventBridge, Cognito, CloudWatch Logs) a ~$0.01/hora cada uno, más caro en conjunto que el NAT Gateway solo al volumen de tráfico de un proyecto de portafolio. La única excepción gratuita es el Gateway Endpoint de S3, que no cambia el cálculo porque S3 no está en la ruta caliente Lambda → NAT de este proyecto.

## Resto de servicios — orden de magnitud

| Servicio | Costo aproximado |
| --- | --- |
| RDS `db.t4g.micro` + almacenamiento GP3 20 GB | Segundo costo más alto del stack, fijo por hora |
| RDS Proxy | Cargo adicional pequeño por hora + por capacidad |
| Lambda (23 funciones) | Prácticamente gratis a este volumen — el free tier cubre la mayoría de sesiones de prueba |
| API Gateway HTTP API, SQS, SNS, EventBridge | Centavos por millón de requests/mensajes |
| Cognito | Gratis por debajo del umbral de MAU del free tier |
| Secrets Manager | Cargo mensual fijo por secreto (2 secretos: JWT y credenciales de DB) |
| SSM Parameter Store (parámetros estándar) | Gratis |
| CodePipeline / CodeBuild | Centavos a pocos dólares por sesión de pruebas |
| CodeStar Connection (GitHub) | Sin costo |
| SES | Prácticamente gratis al volumen de notificaciones de este proyecto |

## Recomendación operativa

No dejar el stack (`NovaOmsApiStack`) desplegado de forma permanente solo para tenerlo disponible — el costo fijo del NAT Gateway y de RDS corre aunque no haya tráfico. Desplegar, probar/tomar evidencia, y ejecutar `cdk destroy` cuando no se esté usando activamente.
