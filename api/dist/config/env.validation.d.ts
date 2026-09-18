export declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test"
}
export declare class EnvironmentVariables {
    NODE_ENV: Environment;
    PORT: number;
    API_PREFIX: string;
    CORS_ORIGINS: string;
    LOG_LEVEL: string;
    MONGODB_URI: string;
    MONGODB_MAX_POOL_SIZE?: string;
    MONGODB_MIN_POOL_SIZE?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: number;
    REDIS_PASSWORD?: string;
    MINIO_ENDPOINT?: string;
    MINIO_PORT?: number;
    MINIO_ACCESS_KEY?: string;
    MINIO_SECRET_KEY?: string;
    AI_SERVICE_URL?: string;
    AI_SERVICE_API_KEY?: string;
    NEO4J_URI?: string;
    NEO4J_USER?: string;
    NEO4J_PASSWORD?: string;
    NEO4J_DATABASE?: string;
}
export declare function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables;
