"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitiesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const entity_schema_1 = require("./schemas/entity.schema");
const case_schema_1 = require("../cases/schemas/case.schema");
const entities_controller_1 = require("./entities.controller");
const entities_service_1 = require("./entities.service");
const auth_module_1 = require("../auth/auth.module");
let EntitiesModule = class EntitiesModule {
};
exports.EntitiesModule = EntitiesModule;
exports.EntitiesModule = EntitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: entity_schema_1.Entity.name, schema: entity_schema_1.EntitySchema },
                { name: case_schema_1.Case.name, schema: case_schema_1.CaseSchema },
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [entities_controller_1.EntitiesController],
        providers: [entities_service_1.EntitiesService],
        exports: [entities_service_1.EntitiesService, mongoose_1.MongooseModule],
    })
], EntitiesModule);
//# sourceMappingURL=entities.module.js.map