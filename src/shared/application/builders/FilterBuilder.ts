import { Filter, FilterOperator } from "@shared/domain/entities/Query.js";


export class FilterBuilder {
    private readonly filters: Filter[]= [];

    static create(){
        return new FilterBuilder();
    }

    add(field: string, operator:FilterOperator, value:unknown){
        if(value != undefined && value !=null){
            this.filters.push(new Filter(field,operator,value));
        }
        return this;
    }

    eq(field: string, value:unknown){
        return this.add(field,FilterOperator.EQ,value);
    }

    like(field: string, value:unknown){
        return this.add(field,FilterOperator.LIKE,value);
    }

    in(field: string, value:unknown){
        return this.add(field,FilterOperator.IN,value);
    }

    build(): Filter[]{
        return this.filters;
    }
}