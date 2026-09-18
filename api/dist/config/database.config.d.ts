export declare const databaseConfig: (() => {
    uri: string;
    options: {
        autoIndex: boolean;
        maxPoolSize: number;
        minPoolSize: number;
        serverSelectionTimeoutMS: number;
        socketTimeoutMS: number;
        connectTimeoutMS: number;
        heartbeatFrequencyMS: number;
        retryWrites: boolean;
        w: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    uri: string;
    options: {
        autoIndex: boolean;
        maxPoolSize: number;
        minPoolSize: number;
        serverSelectionTimeoutMS: number;
        socketTimeoutMS: number;
        connectTimeoutMS: number;
        heartbeatFrequencyMS: number;
        retryWrites: boolean;
        w: string;
    };
}>;
