import { Filter, FilterOperator, Pagination, QueryOptions, Sort, SortDirection } from "@shared/domain/entities/Query.js";
import { PageRequest } from "../dto/PageRequest.js";


export class QueryOptionsMapper {
    static map(request:PageRequest, filters:Filter[]){
        if(request.search){
            filters.push(
                new Filter("search",FilterOperator.LIKE,request.search)
            );
        }

        return new QueryOptions(
            new Pagination(request.page ?? 1, request.pageSize ?? 20),
            new Sort(request.sortBy??"createdAt",
                request.sortDirection ==="asc" 
                ? SortDirection.ASC
                : SortDirection.DESC),
            filters
        );
    }
}