

export interface UseCase<Source,Target> {

    execute (request:Source):Promise<Target>|Target
}