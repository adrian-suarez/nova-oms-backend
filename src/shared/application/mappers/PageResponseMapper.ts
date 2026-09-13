import { Page } from "@shared/domain/entities/Page.js";
import { PaginatedResponse } from "../dto/ApiResponseBody.js";


export class PageResponseMapper {

    static map<Source,Target>(page: Page<Source>, mapper:(T:Source)=>Target): PaginatedResponse<Target> {
        return {
            items: page.items.map(user=>mapper(user)),
            pagination:{
                page: page.page,
                pageSize:page.pageSize,
                totalItems: page.totalItems,
                totalPages:page.totalPages,
            }
        };
    }
}