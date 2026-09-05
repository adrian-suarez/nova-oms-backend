import { NotificationType } from "@modules/notifications/domain/entities/Notification.js";



export class NotificationTemplateFactory {

    build(type:NotificationType, data: Record<string,unknown>): {subject:string, message:string}{
        switch(type){
            case NotificationType.USER_WELCOME:
                return {
                    subject: "Bienvenido a Nova OMS",
                    message: `Hola, tu cuenta (${data.email}) fue creada correctamente.`
                };
            case NotificationType.USER_UPDATED:
                return {
                    subject: "Tu cuenta fue actualizada",
                    message: `Se actualizaron los datos de tu cuenta (${data.email}).`
                };
            case NotificationType.USER_DISABLED:
                return {
                    subject: "Tu cuenta fue deshabilitada",
                    message: `Tu cuenta fue deshabilitada (${data.email}), contactar al administrador.`
                };
            case NotificationType.ATTACHMENT_PROCESSING:
                return {
                    subject: "Procesando tu archivo",
                    message: `Se esta procesando el archivo (${data.key}).`
                };
            case NotificationType.ATTACHMENT_UPLOADED:
                return {
                    subject: "Archivo confirmado",
                    message: `Tu archivo (${data.fileName}) fue procesado correctamente.`
                };
            case NotificationType.ATTACHMENT_FAILED:
                return {
                    subject: "Archivo fallido",
                    message: `No se pudo procesar tu archivo (${data.fileName}) ${data.error}.`
                };
            case NotificationType.ATTACHMENT_DELETED:
                return {
                    subject: "Archivo eliminado",
                    message: `Tu archivo (${data.fileName}) fue eliminado.`
                };
        }
    }
}