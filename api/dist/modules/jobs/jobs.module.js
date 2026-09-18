"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const mongoose_1 = require("@nestjs/mongoose");
const job_queues_constant_1 = require("./constants/job-queues.constant");
const jobs_service_1 = require("./jobs.service");
const jobs_controller_1 = require("./jobs.controller");
const evidence_processing_dev_worker_1 = require("./workers/evidence-processing.dev-worker");
const evidence_schema_1 = require("../evidence/schemas/evidence.schema");
const analysis_result_schema_1 = require("../evidence/schemas/analysis-result.schema");
const auth_module_1 = require("../auth/auth.module");
const ai_client_module_1 = require("../ai-client/ai-client.module");
const entities_module_1 = require("../entities/entities.module");
const graph_module_1 = require("../graph/graph.module");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: evidence_schema_1.Evidence.name, schema: evidence_schema_1.EvidenceSchema },
                { name: analysis_result_schema_1.AnalysisResult.name, schema: analysis_result_schema_1.AnalysisResultSchema },
            ]),
            bullmq_1.BullModule.registerQueue({ name: job_queues_constant_1.QUEUE_EVIDENCE_PROCESSING }, { name: job_queues_constant_1.QUEUE_AI_ANALYSIS }, { name: job_queues_constant_1.QUEUE_REPORT_GENERATION }),
            auth_module_1.AuthModule,
            ai_client_module_1.AiClientModule,
            entities_module_1.EntitiesModule,
            graph_module_1.GraphModule,
        ],
        controllers: [jobs_controller_1.JobsController],
        providers: [jobs_service_1.JobsService, evidence_processing_dev_worker_1.EvidenceProcessingDevWorker],
        exports: [jobs_service_1.JobsService, bullmq_1.BullModule],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map