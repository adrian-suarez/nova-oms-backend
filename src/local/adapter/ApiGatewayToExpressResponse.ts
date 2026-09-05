import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Response } from "express";


export class ApiGatewayToExpressResponse{

    static send(response: APIGatewayProxyStructuredResultV2, res:Response){
        
        const body = response.body && response.body.length>0 ? JSON.parse(response.body):undefined;

        res.status(response.statusCode??200).json(body);
    }
}