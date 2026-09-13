import { LambdaHandlerFn } from "@shared/types/LambdaHandlerFn.js";
import { NextFunction , Request, Response} from "express";
import { ExpressToApiGatewayEvent } from "./ApiGatewayEventMapper.js";
import { LocalContext } from "./LocalContext.js";
import { ApiGatewayToExpressResponse } from "./ApiGatewayToExpressResponse.js";


export function invoke(handler:LambdaHandlerFn){
    return async(req:Request, res:Response, next:NextFunction)=>{
        try{
            const event = ExpressToApiGatewayEvent.map(req);
            const response = await handler(event, LocalContext.create());

            ApiGatewayToExpressResponse.send(response,res);


        }catch(error){
            next(error)
        }
    }
}