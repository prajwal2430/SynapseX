export declare const appConfig: (() => {
    name: string;
    version: string;
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigins: string[];
    logLevel: string;
    jwt: {
        accessSecret: string;
        accessExpiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    name: string;
    version: string;
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigins: string[];
    logLevel: string;
    jwt: {
        accessSecret: string;
        accessExpiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
}>;
