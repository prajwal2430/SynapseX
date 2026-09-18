export declare class ServiceStatusDto {
    name: string;
    status: string;
    uptime: number;
}
export declare class DatabaseStatusDto {
    status: string;
    type: string;
}
export declare class HealthResponseDto {
    status: string;
    service: ServiceStatusDto;
    database: DatabaseStatusDto;
    timestamp: string;
    version: string;
}
