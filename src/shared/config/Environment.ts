export enum Environment {
  LOCAL = "local",
  DEVELOPMENT = "development",
  QA = "qa",
  PRODUCTION = "production",
}

export namespace Environment {
  export function from(value: string | undefined): Environment {
    switch (value) {
      case "production":
        return Environment.PRODUCTION;
      case "qa":
        return Environment.QA;
      case "development":
        return Environment.DEVELOPMENT;
      default:
        return Environment.LOCAL;
    }
  }
}
