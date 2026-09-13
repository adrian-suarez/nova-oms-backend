import { NotificationSender } from "@modules/notifications/application/providers/NotificationSender.js";
import { CreateNotificationUseCase } from "@modules/notifications/application/use-cases/CreateNotificationUseCase.js";
import { NotificationTemplateFactory } from "@modules/notifications/application/use-cases/NotificationTemplateFactory.js";
import { NotificationType } from "@modules/notifications/domain/entities/Notification.js";
import { NotificationRepository } from "@modules/notifications/domain/repositories/NotificationRepository.js";
import { mock } from "vitest-mock-extended";



describe("CreateNotificationUseCase",()=>{
    const request = {
        id: "not1",
        type: NotificationType.USER_WELCOME,
        recipientUserId:"user1",
        recipientUserEmail:"user@novaoms.com",
        templateData:{ email: "user@novaoms.com"}
    }

    function makeDeps(){
        const repository = mock<NotificationRepository>();
        repository.existsById.mockResolvedValue(false);
        return {
            repository,
            sender: mock<NotificationSender>(),
            templates: new NotificationTemplateFactory()
        };
    }

    it("it is idempotent: if notification with that id already exist, it does nothing", async ()=>{
        const deps = makeDeps();

        deps.repository.existsById.mockResolvedValue(true);
        const useCase = new CreateNotificationUseCase(deps.repository, deps.sender,deps.templates);

        await useCase.execute(request);

        expect(deps.repository.create).not.toHaveBeenCalled();
        expect(deps.sender.send).not.toHaveBeenCalled();
    });

    it("happy path: create the notification, send it and mark it as sent",async()=>{
        const deps = makeDeps();
        const useCase = new CreateNotificationUseCase(deps.repository, deps.sender,deps.templates);
        await useCase.execute(request);

        expect(deps.repository.create).toHaveBeenCalledOnce();
        expect(deps.sender.send).toHaveBeenCalledOnce();

        const createdNotification = deps.repository.create.mock.calls[0]![0];
      
        expect(createdNotification.status).toBe("SENT");
    });


    it("if the submission fails, mark the notification as failed instead of rethrowing the exception",async()=>{
        const deps = makeDeps();
        deps.sender.send.mockRejectedValue(new Error("SES throttled"))
        const useCase = new CreateNotificationUseCase(deps.repository, deps.sender,deps.templates);
        await expect(useCase.execute(request)).resolves.not.toThrow();

        const createdNotification = deps.repository.create.mock.calls[0]![0];
      
        expect(createdNotification.status).toBe("FAILED");
        expect(createdNotification.lastError).toBe("Error: SES throttled");
    });
});