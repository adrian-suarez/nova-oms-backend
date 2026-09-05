export interface HealthResponse {
  status: "UP";
  application: string;
  version: string;
  environment: string;
  node: string;
  uptime: number;
  timestamp: string;
  services: {
    api:"UP";
    lambda:"UP";
    db:string;
  };
}
