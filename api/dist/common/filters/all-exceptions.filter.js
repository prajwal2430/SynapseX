"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger('ExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request.headers['x-request-id'] || undefined;
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected internal error occurred';
        let errors = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'object' && res !== null) {
                const resObj = res;
                message = resObj.message || exception.message;
                if (Array.isArray(resObj.errors)) {
                    errors = resObj.errors;
                }
            }
            else {
                message = exception.message;
            }
        }
        else if (exception?.code === 11000) {
            status = common_1.HttpStatus.CONFLICT;
            const duplicatedField = Object.keys(exception.keyPattern || {})[0] || 'field';
            message = `A resource with the specified '${duplicatedField}' already exists.`;
        }
        else if (exception?.name === 'CastError') {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = `Invalid format for identifier '${exception.path}': received '${exception.value}'`;
        }
        else if (exception?.name === 'ValidationError' && exception?.errors) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = 'Database validation constraint failed';
            errors = Object.keys(exception.errors).map((key) => ({
                field: key,
                constraints: [exception.errors[key]?.message || 'Invalid value'],
            }));
        }
        else if (exception instanceof Error) {
            message =
                process.env.NODE_ENV === 'production'
                    ? 'Internal server error occurred'
                    : exception.message;
        }
        this.logger.error(`[${request.method}] ${request.url} - Status: ${status} - Message: ${typeof message === 'object' ? JSON.stringify(message) : message}`, exception instanceof Error ? exception.stack : undefined);
        const errorResponse = {
            success: false,
            statusCode: status,
            message: Array.isArray(message) ? message.join(', ') : message,
            errors,
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId,
        };
        response.status(status).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map