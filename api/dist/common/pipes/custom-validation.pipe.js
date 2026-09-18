"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomValidationPipe = createCustomValidationPipe;
const common_1 = require("@nestjs/common");
function formatValidationErrors(errors) {
    const result = [];
    function extractErrors(error, parentField = '') {
        const fieldName = parentField
            ? `${parentField}.${error.property}`
            : error.property;
        if (error.constraints) {
            result.push({
                field: fieldName,
                constraints: Object.values(error.constraints),
            });
        }
        if (error.children && error.children.length > 0) {
            for (const child of error.children) {
                extractErrors(child, fieldName);
            }
        }
    }
    for (const err of errors) {
        extractErrors(err);
    }
    return result;
}
function createCustomValidationPipe() {
    return new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (validationErrors = []) => {
            const formattedErrors = formatValidationErrors(validationErrors);
            const fieldCount = formattedErrors.length;
            return new common_1.BadRequestException({
                message: `Validation failed on ${fieldCount} field${fieldCount === 1 ? '' : 's'}`,
                errors: formattedErrors,
            });
        },
    });
}
//# sourceMappingURL=custom-validation.pipe.js.map