import { ConfigService } from '@nestjs/config';
export declare class AppService {
    private readonly configService;
    constructor(configService: ConfigService);
    getInfo(): {
        service: string;
        version: string;
        environment: string;
        status: string;
        docs: string;
    };
}
