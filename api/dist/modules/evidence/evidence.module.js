"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const evidence_schema_1 = require("./schemas/evidence.schema");
const custody_log_schema_1 = require("./schemas/custody-log.schema");
const analysis_result_schema_1 = require("./schemas/analysis-result.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const evidence_controller_1 = require("./evidence.controller");
const evidence_service_1 = require("./evidence.service");
const storage_service_1 = require("./services/storage.service");
const minio_storage_service_1 = require("./storage/minio-storage.service");
const evidence_storage_interface_1 = require("./storage/evidence-storage.interface");
const auth_module_1 = require("../auth/auth.module");
const ai_client_module_1 = require("../ai-client/ai-client.module");
let EvidenceModule = class EvidenceModule {
};
exports.EvidenceModule = EvidenceModule;
exports.EvidenceModule = EvidenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: evidence_schema_1.Evidence.name, schema: evidence_schema_1.EvidenceSchema },
                { name: custody_log_schema_1.CustodyLog.name, schema: custody_log_schema_1.CustodyLogSchema },
                { name: analysis_result_schema_1.AnalysisResult.name, schema: analysis_result_schema_1.AnalysisResultSchema },
                { name: case_schema_1.Case.name, schema: case_schema_1.CaseSchema },
            ]),
            bullmq_1.BullModule.registerQueue({
                name: evidence_service_1.EVIDENCE_QUEUE_NAME,
            }),
            auth_module_1.AuthModule,
            ai_client_module_1.AiClientModule,
        ],
        controllers: [evidence_controller_1.EvidenceController],
        providers: [
            evidence_service_1.EvidenceService,
            minio_storage_service_1.MinioStorageService,
            storage_service_1.StorageService,
            {
                provide: evidence_storage_interface_1.EVIDENCE_STORAGE_SERVICE,
                useExisting: minio_storage_service_1.MinioStorageService,
            },
        ],
        exports: [
            evidence_service_1.EvidenceService,
            minio_storage_service_1.MinioStorageService,
            storage_service_1.StorageService,
            evidence_storage_interface_1.EVIDENCE_STORAGE_SERVICE,
        ],
    })
], EvidenceModule);
//# sourceMappingURL=evidence.module.js.map