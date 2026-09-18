"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindingsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const finding_schema_1 = require("./schemas/finding.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const findings_controller_1 = require("./findings.controller");
const findings_service_1 = require("./findings.service");
const auth_module_1 = require("../auth/auth.module");
let FindingsModule = class FindingsModule {
};
exports.FindingsModule = FindingsModule;
exports.FindingsModule = FindingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: finding_schema_1.Finding.name, schema: finding_schema_1.FindingSchema },
                { name: case_schema_1.Case.name, schema: case_schema_1.CaseSchema },
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [findings_controller_1.FindingsController],
        providers: [findings_service_1.FindingsService],
        exports: [findings_service_1.FindingsService, mongoose_1.MongooseModule],
    })
], FindingsModule);
//# sourceMappingURL=findings.module.js.map