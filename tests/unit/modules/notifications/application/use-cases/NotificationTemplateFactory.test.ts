import { NotificationTemplateFactory } from "@modules/notifications/application/use-cases/NotificationTemplateFactory.js";
import { NotificationType } from "@modules/notifications/domain/entities/Notification.js";

describe("NotificationTemplateFactory",()=>{
    const factory = new NotificationTemplateFactory();

    it("USER_WELCOME includes the email in the message",()=>{
        const { subject, message } = factory.build(NotificationType.USER_WELCOME,{email:"adrian@novaoms.com"});

        expect(subject).toBe("Bienvenido a Nova OMS");
        expect(message).toContain("adrian@novaoms.com");
    });

    it("ATTACHMENT_FAILED includes the file name and error",()=>{
        const { message } = factory.build(NotificationType.ATTACHMENT_FAILED,{fileName:"invoice.pdf",error:"invalid file content"});

        expect(message).toContain("invoice.pdf");
        expect(message).toContain("invalid file content");
    });

    it.each([NotificationType.USER_UPDATED,
        NotificationType.USER_DISABLED,
        NotificationType.ATTACHMENT_PROCESSING,
        NotificationType.ATTACHMENT_UPLOADED,
        NotificationType.ATTACHMENT_DELETED
    ])("%s always returns non empty subject and messages", (type)=>{
        const result = factory.build(type,{email:"adrian@novaoms.com", fileName:"f.pdf"});

        expect(result.subject).toBeTruthy();
        expect(result.message).toBeTruthy();

    });
});