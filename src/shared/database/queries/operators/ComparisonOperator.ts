import { Filter, FilterOperator } from "@shared/domain/entities/Query.js";
import { PrismaQueryConfiguration } from "../PrismaQueryInterpreter.js";


export class ComparisonOperator{
    static interpret(filter:Filter, config:PrismaQueryConfiguration){
        const field = config.fieldMap?.[filter.field] ?? filter.field;

        switch(filter.operator){
            case FilterOperator.EQ:
                return {
                    [field]: filter.value
                };
            case FilterOperator.NE:
                return {
                    [field]: {not: filter.value}
                };
            case FilterOperator.GT:
                return {
                    [field]: {gt:filter.value}
                };
            case FilterOperator.GTE:
                return {
                    [field]: {gte: filter.value}
                };
            case FilterOperator.LT:
                return {
                    [field]: {lt: filter.value}
                };
            case FilterOperator.LTE:
                return {
                    [field]: {lte:filter.value}
                };
            default:
                break;
        }
    }
}