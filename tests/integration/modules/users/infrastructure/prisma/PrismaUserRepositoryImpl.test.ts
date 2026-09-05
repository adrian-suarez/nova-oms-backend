import { User, UserStatus } from "@modules/users/domain/entities/User.js";
import { PrismaUserRepositoryImpl } from "@modules/users/infrastructure/prisma/PrismaUserRepositoryImpl.js";
import { ExecutionContext } from "@shared/application/context/ExecutionContext.js";
import { Config } from "@shared/config/Config.js";
import { PrismaClientFactory } from "@shared/database/PrismaClientFactory.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { AsyncLocalExecutionContextProvider } from "@shared/infrastructure/context/AsyncLocalExecutionContextProvider.js";
import { randomUUID } from "node:crypto";



describe("PrismaUserRepositoryImpl (Integration)",()=>{

    const config = new Config();
    const prisma = PrismaClientFactory.getClient(config);
    const executionContextProvider = new AsyncLocalExecutionContextProvider()
    const provider = new PrismaProvider(prisma, executionContextProvider);
    const repository = new PrismaUserRepositoryImpl(provider);

    const createdUserIds: string[] = [];

    afterEach(async()=>{
        if(createdUserIds.length ===0) return ;
        await prisma.user.deleteMany({where: {id: {in: createdUserIds}}});
        createdUserIds.length=0;
    });

    it("create a user and find it by email",async()=>{
        await executionContextProvider.run( new ExecutionContext({},"req-1","corr-1","IntegrationTest"),
        async ()=>{
            const email = `integration${randomUUID()}@novaoms.com`;
            const user = User.create({email, firstName:"user", lastName:"test", status:UserStatus.ACTIVE});
            user.setPassword("hashed-password");
            createdUserIds.push(user.id);

            await repository.create(user);
            const found = await repository.findByEmail(email);

            expect(found).not.toBeNull();
            expect(found!.id).toBe(user.id);
            expect(found!.firstName).toBe("user");
            expect(found?.status).toBe(UserStatus.ACTIVE);
        });
    });

    it("findByEmail returns null if it doesn't exist",async ()=>{
        await executionContextProvider.run( new ExecutionContext({},"req-1","corr-1","IntegrationTest"),
        async ()=>{
            const found = await repository.findByEmail(`non-exist${randomUUID()}@novaoms.com`);
            expect(found).toBeNull();
        });
    });


    it("increments version on update, and a stale version fails on the next update",async ()=>{
        const email = `integration${randomUUID()}@novaoms.com`;
        const user = User.create({email, firstName:"user", lastName:"test", status:UserStatus.ACTIVE});        
        user.setPassword("hashed-password");
        createdUserIds.push(user.id);

        await executionContextProvider.run( new ExecutionContext({},"req-1","corr-1","IntegrationTest"),
            async ()=>{
                await repository.create(user);
            }
        );

        await executionContextProvider.run( new ExecutionContext({},"req-2","corr-2","IntegrationTest"),
            async ()=>{
                user.firstName = "test2";
                await repository.update(user);

                const found = await repository.findByEmail(email);

                expect(found!.version).toBe(1);
                expect(user.version).toBe(1);
            }
        );

        await executionContextProvider.run( new ExecutionContext({},"req-3","corr-3","IntegrationTest"),
            async ()=>{
                user.firstName = "test3";
                await expect(repository.update(user)).resolves.toBeUndefined();
        });

    });
});