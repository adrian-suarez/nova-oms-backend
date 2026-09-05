import { QueryOptions } from "@shared/domain/entities/Query.js";
import { OperatorRegistry } from "./operators/OperatorRegistry.js";


export interface PrismaQueryConfiguration{
    searchableFields: readonly string [];
    sortableFields: readonly string[];
    fieldMap: Record<string,string>;
    defaultSortField:string;
}

export class PrismaQueryInterpreter{
    static toFindManyArgs(query:QueryOptions, config:PrismaQueryConfiguration){
        return {
            where: this.toWhere(query, config),
            orderBy: this.toOrderBy(query,config),
            skip: query.pagination.offset,
            take: query.pagination.pageSize
        }
    }

    static toWhere(query:QueryOptions, config:PrismaQueryConfiguration){
       return {
            AND: query.filters.map(filter => OperatorRegistry.resolve(filter.operator)!.interpret(filter,config)!)
       }
    }

    static toOrderBy(query:QueryOptions, config:PrismaQueryConfiguration){
        const field = config.sortableFields.includes(query.sort.field)? query.sort.field : config.defaultSortField;

        return {
            [field]: query.sort.direction
        }
    }
}