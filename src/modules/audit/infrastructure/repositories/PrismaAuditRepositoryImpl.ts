import { AuditRepository } from "@modules/audit/domain/repositories/AuditRepository.js";
import { Page } from "@shared/domain/entities/Page.js";
import { QueryOptions } from "@shared/domain/entities/Query.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { Audit } from "@modules/audit/domain/entities/Audit.js";
import { PrismaQueryConfiguration, PrismaQueryInterpreter } from "@shared/database/queries/PrismaQueryInterpreter.js";
import { toAuditEntity } from "./PrismaAuditMapper.js";



const auditQueryConfiguration : PrismaQueryConfiguration = {
  searchableFields:["entityType", "entityId" , "action"],
  sortableFields: ["createdAt"],
  fieldMap: {},
  defaultSortField:"createdAt"
}


export class PrismaAuditRepositoryImpl implements AuditRepository{
    constructor(readonly provider: PrismaProvider) {}
    
    async create(audits: Audit[]): Promise<void> {
        await this.provider.getClient().audit.createMany({
            data: audits.map(audit => ({
                id:audit.id,
                entityType: audit.entityType,
                entityId: audit.entityId,
                action: audit.action,
                userId: audit.userId,
                payload:audit.payload as object,
                outcome:audit.outcome,
                errorMessage:audit.errorMessage,
                correlationId: audit.correlationId,
                createdAt: audit.createdAt
                })
            ),
        });
    }
    async findAll(query: QueryOptions): Promise<Page<Audit>> {
         const args = PrismaQueryInterpreter.toFindManyArgs(query,auditQueryConfiguration);
        
        const [data, total] = await Promise.all([
            this.provider.getClient().audit.findMany(args),
            this.provider.getClient().audit.count({where: args.where})
        ]);
    
        return new Page<Audit>(
            data.map(audit=>toAuditEntity(audit)),
            query.pagination.page,
            query.pagination.pageSize,
            total
        );
    }


}