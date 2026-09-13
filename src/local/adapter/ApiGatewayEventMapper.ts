import { APIGatewayEventRequestContextV2, APIGatewayProxyEventV2 } from "aws-lambda";
import { Request } from "express";

export class ExpressToApiGatewayEvent {
  static map(req: Request): APIGatewayProxyEventV2 {
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : (v ?? "")]),
    );
    const query = Object.keys(req.query).length
      ? Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)]))
      : undefined;
    const pathParameters =
    Object.keys(req.params).length
        ? Object.fromEntries(
              Object.entries(req.params).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v[0] : v
              ])
          )
        : undefined;
    return {
      version: "2.0",
      routeKey: "",
      rawPath: req.path,
      rawQueryString: "",
      headers: headers,
      requestContext: getRequestContext(req),
      isBase64Encoded: false,
      body: JSON.stringify(req.body),
      pathParameters: pathParameters,
      queryStringParameters: query,
      stageVariables: undefined,
    };
  }
}

function getRequestContext(req: Request): APIGatewayEventRequestContextV2 {
  return {
    accountId: "local",

    apiId: "local",

    domainName: "localhost",

    domainPrefix: "localhost",

    http: {
      method: req.method,

      path: req.path,

      protocol: "HTTP/1.1",

      sourceIp: req.ip ?? "",

      userAgent: req.headers["user-agent"] ?? "",
    },

    requestId: crypto.randomUUID(),

    routeKey: "",

    stage: "$default",

    time: new Date().toUTCString(),

    timeEpoch: Date.now(),
  };
}
