"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const case_schema_1 = require("../cases/schemas/case.schema");
const evidence_schema_1 = require("../evidence/schemas/evidence.schema");
const entity_schema_1 = require("../entities/schemas/entity.schema");
const neo4j_service_1 = require("./neo4j.service");
const graph_service_1 = require("./graph.service");
const graph_controller_1 = require("./graph.controller");
let GraphModule = class GraphModule {
};
exports.GraphModule = GraphModule;
exports.GraphModule = GraphModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: case_schema_1.Case.name, schema: case_schema_1.CaseSchema },
                { name: evidence_schema_1.Evidence.name, schema: evidence_schema_1.EvidenceSchema },
                { name: entity_schema_1.Entity.name, schema: entity_schema_1.EntitySchema },
            ]),
        ],
        controllers: [graph_controller_1.GraphController],
        providers: [neo4j_service_1.Neo4jService, graph_service_1.GraphService],
        exports: [graph_service_1.GraphService, neo4j_service_1.Neo4jService],
    })
], GraphModule);
//# sourceMappingURL=graph.module.js.map