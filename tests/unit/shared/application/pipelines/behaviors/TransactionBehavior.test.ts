import { TransactionBehavior } from "@shared/application/pipelines/behaviors/TransactionBehavior.js";
import { UnitOfWork } from "@shared/database/UnitOfWork.js";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { mock } from "vitest-mock-extended";


describe("TransactionBehavior",()=>{

    it("execute the following behavior inner of unitOfWork", async()=>{
        const uow = mock<UnitOfWork>();
        uow.execute.mockImplementation(async(action) =>action());
        const behavior= new TransactionBehavior(uow);
        const next = vi.fn().mockResolvedValue({statusCode: 200, body :"{}"});

        const result = await behavior.handle({},
            {} as APIGatewayProxyEventV2,
            {} as Context,
            next
        );

        expect(uow.execute).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledOnce();
        expect(result).toEqual({statusCode: 200, body :"{}"});
    });

    it("if the handler throws, the exception propagate (the real uow would do rollback)",async()=>{
        const uow = mock<UnitOfWork>();
        uow.execute.mockImplementation(async (action) => action());
        const behavior = new TransactionBehavior(uow);

        const failure = new Error("db write failed");
        const next = vi.fn().mockRejectedValue(failure);

        await expect(behavior.handle({},{} as APIGatewayProxyEventV2,
            {} as Context,
            next
        )).rejects.toBe(failure);
    });
});