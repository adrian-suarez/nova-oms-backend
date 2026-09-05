import { ExecutionContext } from "@shared/application/context/ExecutionContext.js";
import { Config } from "@shared/config/Config.js";
import { PrismaClientFactory } from "@shared/database/PrismaClientFactory.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { OutboxEvent, OutboxEventStatus } from "@shared/domain/entities/OutboxEvent.js";
import { AsyncLocalExecutionContextProvider } from "@shared/infrastructure/context/AsyncLocalExecutionContextProvider.js";
import { PrismaOutboxRepositoryImpl } from "@shared/infrastructure/repositories/PrismaOutboxRepositoryImpl.js";
import { randomUUID } from "node:crypto";



describe("PrismaOutboxRepositoryImpl(Integration)",()=>{
    const config = new Config();
    const executionContextProvider = new AsyncLocalExecutionContextProvider()
    const prisma = PrismaClientFactory.getClient(config);
    const provider = new PrismaProvider(prisma,executionContextProvider);
    const repository = new PrismaOutboxRepositoryImpl(provider);

    const createdEventIds: string [] = [];


    function makePendingEvent(correlationId:string): OutboxEvent{

        const event = new OutboxEvent(randomUUID(),
            "user",
            randomUUID(),
            "user.created",
            {email:"user@novaoms.com"},
            OutboxEventStatus.PENDING,
            0,
            null,
            correlationId,new Date(), null
        );

        createdEventIds.push(event.id);
        return event;
    }

    afterEach(async()=>{
        if(createdEventIds.length ===0)return;
        await prisma.outboxEvent.deleteMany({where:{id:{in: createdEventIds}}});
        createdEventIds.length=0;
    });

    it("claims pending events, marks them as PROCESSING in the db, and it doesn't claims them again", async ()=>{
        await executionContextProvider.run( new ExecutionContext({},"req-1","corr-1","IntegrationTest"),
        async ()=>{
            const correlationId = randomUUID();
            await repository.create([makePendingEvent(correlationId), makePendingEvent(correlationId)])
            
            const claimed = await repository.claimPending(100);
            const claimedIds = claimed.filter(e=>e.correlationId ===correlationId).map(e=>e.id);

            expect(claimedIds).toHaveLength(2);

            const rowAfterClaim = await prisma.outboxEvent.findMany({where:{id:{in:claimedIds}}});
            expect(rowAfterClaim.every(row => row.status === OutboxEventStatus.PROCESSING)).toBe(true);

            const secondClaim = await repository.claimPending(100);
            const reClaimedIds = secondClaim.map(e=>e.id);
            expect(claimedIds.some(id=> reClaimedIds.includes(id))).toBe(false);
        });
    });

});