"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustodyModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const chain_of_custody_schema_1 = require("./schemas/chain-of-custody.schema");
const evidence_schema_1 = require("../evidence/schemas/evidence.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const custody_controller_1 = require("./custody.controller");
const custody_service_1 = require("./custody.service");
const auth_module_1 = require("../auth/auth.module");
let CustodyModule = class CustodyModule {
};
exports.CustodyModule = CustodyModule;
exports.CustodyModule = CustodyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: chain_of_custody_schema_1.ChainOfCustody.name, schema: chain_of_custody_schema_1.ChainOfCustodySchema },
                { name: evidence_schema_1.Evidence.name, schema: evidence_schema_1.EvidenceSchema },
                { name: case_schema_1.Case.name, schema: case_schema_1.CaseSchema },
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [custody_controller_1.CustodyController],
        providers: [custody_service_1.CustodyService],
        exports: [custody_service_1.CustodyService],
    })
], CustodyModule);
//# sourceMappingURL=custody.module.js.map