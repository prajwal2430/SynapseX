"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RealtimeEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeEventsService = void 0;
const common_1 = require("@nestjs/common");
const events_gateway_1 = require("../gateways/events.gateway");
const realtime_constants_1 = require("../constants/realtime.constants");
let RealtimeEventsService = RealtimeEventsService_1 = class RealtimeEventsService {
    constructor(eventsGateway) {
        this.eventsGateway = eventsGateway;
        this.logger = new common_1.Logger(RealtimeEventsService_1.name);
    }
    emitToCase(caseId, event, payload) {
        if (!this.eventsGateway.server) {
            this.logger.debug(`[WS EVENT SKIPPED] WebSocket server not ready. Event: ${event} for case ${caseId}`);
            return;
        }
        const room = (0, realtime_constants_1.getCaseRoom)(caseId);
        const enrichedPayload = {
            caseId,
            timestamp: new Date().toISOString(),
            ...payload,
        };
        this.eventsGateway.server.to(room).emit(event, enrichedPayload);
        this.logger.debug(`[WS BROADCAST] Emitted '${event}' to room '${room}'`);
    }
    emitEvidenceProcessing(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.EVIDENCE_PROCESSING, payload);
    }
    emitEvidenceProgress(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.EVIDENCE_PROGRESS, payload);
    }
    emitEvidenceCompleted(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.EVIDENCE_COMPLETED, payload);
    }
    emitEvidenceFailed(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.EVIDENCE_FAILED, payload);
    }
    emitAnalysisStarted(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.ANALYSIS_STARTED, payload);
    }
    emitAnalysisCompleted(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.ANALYSIS_COMPLETED, payload);
    }
    emitAnalysisFailed(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.ANALYSIS_FAILED, payload);
    }
    emitFindingCreated(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.FINDING_CREATED, payload);
    }
    emitReportGenerated(caseId, payload) {
        this.emitToCase(caseId, realtime_constants_1.REALTIME_EVENTS.REPORT_GENERATED, payload);
    }
};
exports.RealtimeEventsService = RealtimeEventsService;
exports.RealtimeEventsService = RealtimeEventsService = RealtimeEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_gateway_1.EventsGateway])
], RealtimeEventsService);
//# sourceMappingURL=realtime-events.service.js.map