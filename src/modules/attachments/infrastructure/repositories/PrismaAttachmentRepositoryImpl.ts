import { Attachment } from "@modules/attachments/domain/entities/Attachment.js";
import { AttachmentRepository } from "@modules/attachments/domain/repositories/AttachmentRepository.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { PrismaQueryConfiguration, PrismaQueryInterpreter } from "@shared/database/queries/PrismaQueryInterpreter.js";
import { Page } from "@shared/domain/entities/Page.js";
import { QueryOptions } from "@shared/domain/entities/Query.js";
import { toAttachmentEntity } from "./PrismaAttachmentMapper.js";
import { Prisma } from "@prisma/client";

const attachmentQueryConfiguration : PrismaQueryConfiguration = {
  searchableFields:["fileName", "key"],
  sortableFields: ["createdAt"],
  fieldMap: {},
  defaultSortField:"createdAt"
}

export class PrismaAttachmentRepositoryImpl implements AttachmentRepository{

    constructor(private readonly provider: PrismaProvider){}

    async create(attachment: Attachment): Promise<void> {
        await this.provider.getClient().attachment.create({data:{
            id: attachment.id,
            fileName: attachment.file.fileName,
            extension: attachment.file.extension,
            contentType: attachment.file.contentType,
            size: attachment.file.size,
            bucket: attachment.bucket,
            key: attachment.key,
            status: attachment.status,
            visibility: attachment.visibility,
            resourceType: attachment.resourceType,
            resourceId: attachment.resourceId,
            enabled: attachment.enabled,
            ownerUserId: attachment.ownerUserId,
            ownerUserEmail: attachment.ownerUserEmail
        }});
    }
    async update(attachment: Attachment): Promise<void> {
        await this.provider.getClient().attachment.update({where:{id: attachment.id},
            data:{
                status: attachment.status,
                visibility: attachment.visibility,
                enabled: attachment.enabled,
                deletedAt: attachment.deletedAt
            }
        });
    }
    async findAll(query: QueryOptions): Promise<Page<Attachment>> {
        
        const args = PrismaQueryInterpreter.toFindManyArgs(query,attachmentQueryConfiguration);
    
        const [data, total] = await Promise.all([
            this.provider.getClient().attachment.findMany(args),
            this.provider.getClient().attachment.count({where: args.where})
        ]);
    
        return new Page<Attachment>(
            data.map(attachment=>toAttachmentEntity(attachment)),
            query.pagination.page,
            query.pagination.pageSize,
            total
        );
    }
    async findBy(where:Prisma.AttachmentWhereInput): Promise<Attachment | null> {
        const entity = await this.provider.getClient().attachment.findFirst({where});

        if(!entity){
            return null;
        }

        return toAttachmentEntity(entity);
    }
    async findById(id: string): Promise<Attachment | null> {
        return this.findBy({id});
    }

    async findByKey(key: string): Promise<Attachment | null> {
        return this.findBy({key});
    }
    async delete(id: string): Promise<void> {
        await this.provider.getClient().attachment.update({data:{deletedAt: new Date(), enabled:false}, where:{id}})
    }

}