import { OutboxPublisher } from "@shared/application/events/OutboxPublisher.js";
import { OutboxPublisherWorker } from "@shared/application/workers/OutboxPublisherWorker.js";
import { OutboxEvent, OutboxEventStatus } from "@shared/domain/entities/OutboxEvent.js";
import { OutboxRepository } from "@shared/domain/repositories/OutboxRepository.js";
import { mock } from "vitest-mock-extended";




describe("OutboxPublisherWorker",()=>{

    it("claims up to 100 pending events and publishes them",async()=>{
        const repository = mock<OutboxRepository>();
        const publisher = mock<OutboxPublisher>();
        const pendingEvents = [ 
            new OutboxEvent("event1",
                "user",
                "user1",
                "user.created",
                {email:"user@novaoms.com"},
                OutboxEventStatus.PENDING,
                0,
                null,
                "corr-1",
                new Date(),
                null
            )
        ];

        repository.claimPending.mockResolvedValue(pendingEvents);

        const worker = new OutboxPublisherWorker(repository, publisher);
        await worker.execute();

        expect(repository.claimPending).toHaveBeenCalledWith(100);
        expect(publisher.publish).toHaveBeenCalledWith(pendingEvents);
        
    });

    it("if there are no pending events, it still calls publish with an empty array",async()=>{
        const repository = mock<OutboxRepository>();
        const publisher = mock<OutboxPublisher>();
        const pendingEvents: OutboxEvent[] = [];

        repository.claimPending.mockResolvedValue(pendingEvents);

        const worker = new OutboxPublisherWorker(repository, publisher);
        await worker.execute();

        expect(repository.claimPending).toHaveBeenCalledWith(100);
        expect(publisher.publish).toHaveBeenCalledWith(pendingEvents);
        

    });
});