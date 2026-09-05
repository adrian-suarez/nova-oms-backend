import { Filter } from "@shared/domain/entities/Query.js";
import { PrismaQueryConfiguration } from "../PrismaQueryInterpreter.js";


export class LikeOperator{
    static interpret(filter:Filter, config:PrismaQueryConfiguration){

        if(filter.field=="search"){
            return {
                OR: config.searchableFields.map(
                    field=>({
                        [field]: {
                            contains: filter.value,
                            mode: "insensitive"
                        }
                    })
                )
            };
        }
        const field = config.fieldMap?.[filter.field] ?? filter.field;

        return {
            [field]: {
                contains: filter.value,
                mode:"insensitive"
            }
        };
    }
}