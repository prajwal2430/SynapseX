"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const timeline_event_schema_1 = require("./schemas/timeline-event.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const timeline_controller_1 = require("./timeline.controller");
const timeline_service_1 = require("./timeline.service");
const auth_module_1 = require("../auth/auth.module");
let TimelineModule = class TimelineModule {
};
exports.TimelineModule = TimelineModule;
exports.TimelineModule = TimelineModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: timeline_event_schema_1.TimelineEvent.name, schema: timeline_event_schema_1.TimelineEventSchema },
                { name: case_schema_1.Case.name, schema: case_schema_1.CaseSchema },
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [timeline_controller_1.TimelineController],
        providers: [timeline_service_1.TimelineService],
        exports: [timeline_service_1.TimelineService, mongoose_1.MongooseModule],
    })
], TimelineModule);
//# sourceMappingURL=timeline.module.js.map