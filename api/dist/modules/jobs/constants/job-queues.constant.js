"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_JOB_OPTIONS = exports.DEFAULT_BACKOFF_DELAY_MS = exports.DEFAULT_JOB_RETRY_LIMIT = exports.QUEUE_REPORT_GENERATION = exports.QUEUE_AI_ANALYSIS = exports.QUEUE_EVIDENCE_PROCESSING = void 0;
exports.QUEUE_EVIDENCE_PROCESSING = 'evidence-processing';
exports.QUEUE_AI_ANALYSIS = 'ai-analysis';
exports.QUEUE_REPORT_GENERATION = 'report-generation';
exports.DEFAULT_JOB_RETRY_LIMIT = 3;
exports.DEFAULT_BACKOFF_DELAY_MS = 2000;
exports.DEFAULT_JOB_OPTIONS = {
    attempts: exports.DEFAULT_JOB_RETRY_LIMIT,
    backoff: {
        type: 'exponential',
        delay: exports.DEFAULT_BACKOFF_DELAY_MS,
    },
    removeOnComplete: {
        age: 24 * 3600,
        count: 500,
    },
    removeOnFail: {
        age: 7 * 24 * 3600,
        count: 1000,
    },
};
//# sourceMappingURL=job-queues.constant.js.map