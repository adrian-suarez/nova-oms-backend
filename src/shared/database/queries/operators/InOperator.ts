import { Filter } from "@shared/domain/entities/Query.js";
import { PrismaQueryConfiguration } from "../PrismaQueryInterpreter.js";


export class InOperator{
    static interpret(filter:Filter, config:PrismaQueryConfiguration){
        const field = config.fieldMap?.[filter.field] ?? filter.field;

        return {
            [field]: {
                in: filter.value,
            }
        };
    }
}