"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiClientModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ai_service_client_interface_1 = require("./interfaces/ai-service-client.interface");
const fastapi_ai_service_client_1 = require("./services/fastapi-ai-service.client");
let AiClientModule = class AiClientModule {
};
exports.AiClientModule = AiClientModule;
exports.AiClientModule = AiClientModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            fastapi_ai_service_client_1.FastApiAiServiceClient,
            {
                provide: ai_service_client_interface_1.AI_SERVICE_CLIENT,
                useExisting: fastapi_ai_service_client_1.FastApiAiServiceClient,
            },
        ],
        exports: [ai_service_client_interface_1.AI_SERVICE_CLIENT, fastapi_ai_service_client_1.FastApiAiServiceClient],
    })
], AiClientModule);
//# sourceMappingURL=ai-client.module.js.map