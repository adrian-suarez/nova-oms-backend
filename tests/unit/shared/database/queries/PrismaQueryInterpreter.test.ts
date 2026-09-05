import { OperatorRegistry } from "@shared/database/queries/operators/OperatorRegistry.js";
import { PrismaQueryConfiguration, PrismaQueryInterpreter } from "@shared/database/queries/PrismaQueryInterpreter.js";
import { Filter, FilterOperator, Pagination, QueryOptions, Sort, SortDirection } from "@shared/domain/entities/Query.js";


const config: PrismaQueryConfiguration = {
    searchableFields: ["email", "firstName","lastName"],
    sortableFields: ["email","createdAt"],
    fieldMap:{name:"firstName"},
    defaultSortField: "createdAt"
}


describe("OperatorRegistry",()=>{

    it.each([
        FilterOperator.EQ, FilterOperator.NE,FilterOperator.GT,
        FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE,
        FilterOperator.LIKE, FilterOperator.IN
    ])("Resolve a operator to %s",(operator)=>{
        expect(OperatorRegistry.resolve(operator)).toBeDefined();
    });
});

describe("ComparisonOperator (through OperatorRegistry)",()=>{

    it("EQ build {field:value}",()=>{
        const filter = new Filter("status",FilterOperator.EQ,"ACTIVE");
        expect(OperatorRegistry.resolve(FilterOperator.EQ)!.interpret(filter,config)).toEqual({status:"ACTIVE"});
    });

    it("respect fieldMap when the field has alias",()=>{
        const filter = new Filter("name",FilterOperator.EQ,"Ana");
        expect(OperatorRegistry.resolve(FilterOperator.EQ)!.interpret(filter,config)).toEqual({firstName:"Ana"});
    });
});

describe("InOperator (through OperatorRegistry)",()=>{

    it("InOperator builds {field:{ in: [...]}}",()=>{
        const filter = new Filter("status",FilterOperator.IN,["ACTIVE","PENDING"]);
        expect(OperatorRegistry
            .resolve(FilterOperator.IN)!
            .interpret(filter,config))
            .toEqual({status:{ in :["ACTIVE","PENDING"]}});
      });
});

describe("LikeOperator (through OperatorRegistry)",()=>{

    it("with field='search', it builds an OR on searchableFields",()=>{
        const filter = new Filter("search",FilterOperator.LIKE,"Adrian");
        const result = OperatorRegistry.resolve(FilterOperator.LIKE)!.interpret(filter,config) as {OR: unknown[]};
        expect(result.OR).toHaveLength(config.searchableFields.length);
        expect(result.OR).toContainEqual({email: {contains: "Adrian", mode:"insensitive"}});
    });

    it("with a normal field, it builds a insensitive simple contains to capital letters",()=>{
        const filter = new Filter("email",FilterOperator.LIKE,"novaoms.com");
        expect(OperatorRegistry
            .resolve(FilterOperator.LIKE)!
            .interpret(filter,config))
            .toEqual({email: {contains: "novaoms.com", mode:"insensitive"}});
    });
});


describe("PrismaQueryInterpreter",()=>{

    const query = new QueryOptions(
        new Pagination(2,10),
        new Sort("email",SortDirection.DESC),
        [new Filter("status",FilterOperator.EQ,"ACTIVE")]
    );

    it("toWhere combine all filters with AND",()=>{
        expect(PrismaQueryInterpreter.toWhere(query,config)).toEqual({AND: [{status:"ACTIVE"}]});
    });

    it("toOrderBy uses the requested field if it is sortable",()=>{
        expect(PrismaQueryInterpreter.toOrderBy(query,config)).toEqual({email:"desc"});
    });

    it("toOrderBy fall into defaultSortField if the field is not sortable",()=>{
        const invalidSortQuery = new QueryOptions(
            new Pagination(1,10),
            new Sort("password", SortDirection.ASC),
            []
        );
        expect(PrismaQueryInterpreter.toOrderBy(invalidSortQuery,config)).toEqual({createdAt:"asc"});
    });

    it("toFindManyArgs math the offset since the page/pageSize",()=>{
        const args = PrismaQueryInterpreter.toFindManyArgs(query,config);
        expect(args.skip).toBe(10);
        expect(args.take).toBe(10);
    });
});