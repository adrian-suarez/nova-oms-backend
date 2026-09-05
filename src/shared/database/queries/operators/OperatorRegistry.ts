import { FilterOperator } from "@shared/domain/entities/Query.js";
import { ComparisonOperator } from "./ComparisonOperator.js";
import { LikeOperator } from "./LikeOperator.js";
import { InOperator } from "./InOperator.js";


export class OperatorRegistry{

    private static readonly registry = new Map([
        [FilterOperator.EQ,ComparisonOperator],
        [FilterOperator.NE,ComparisonOperator],
        [FilterOperator.GT,ComparisonOperator],
        [FilterOperator.GTE,ComparisonOperator],
        [FilterOperator.LT,ComparisonOperator],
        [FilterOperator.LTE,ComparisonOperator],
        [FilterOperator.LIKE,LikeOperator],
        [FilterOperator.IN,InOperator],
    ]);

    static resolve(filterOperator: FilterOperator){
        return this.registry.get(filterOperator);
    }
}