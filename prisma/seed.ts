import { PrismaClientFactory } from "@shared/database/PrismaClientFactory.js";
import { Config } from "@shared/config/Config.js";
import { SeedRunner } from "./seeds/SeedRunner.js";
import { CognitoIdentityManagementProviderImpl } from "@modules/auth/infrastructure/providers/CognitoIdentityManagementProviderImpl.js";
import { AliasExistsException, CognitoIdentityProviderClient, NotAuthorizedException, UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider";
import { Metrics } from "@aws-lambda-powertools/metrics";
import { ResiliencePolicyFactory } from "@shared/infrastructure/resilience/ResiliencePolicyFactory.js";

const config = new Config();
const prisma = PrismaClientFactory.getClient(config);
const metrics = new Metrics({namespace:"NovaOMS", serviceName:config.serviceName});
const policy = ResiliencePolicyFactory.create({
        metricName:"cognito",
        isTransientError: (error)=> !(error instanceof NotAuthorizedException || error instanceof UserNotFoundException || error instanceof AliasExistsException)
    },
    metrics
);
const identityManagementProvider = config.authProvider === "cognito"
    ? new CognitoIdentityManagementProviderImpl(
        new CognitoIdentityProviderClient({ region: config.awsRegion }),
        config,
        policy
      )
    : undefined;

async function main() {

  const runner = new SeedRunner(prisma, identityManagementProvider);
  await runner.run();
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
