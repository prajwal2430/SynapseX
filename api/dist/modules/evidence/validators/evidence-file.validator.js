"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_EXECUTABLE_EXTENSIONS = exports.ALLOWED_EVIDENCE_EXTENSIONS = exports.DEFAULT_MIN_FILE_SIZE = exports.DEFAULT_MAX_FILE_SIZE = void 0;
exports.validateEvidenceFile = validateEvidenceFile;
const common_1 = require("@nestjs/common");
exports.DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024;
exports.DEFAULT_MIN_FILE_SIZE = 1;
exports.ALLOWED_EVIDENCE_EXTENSIONS = new Set([
    'raw', 'dd', 'img', 'iso', 'dmg', 'vmdk', 'e01', 'aff', 'vhd', 'vhdx',
    'pcap', 'pcapng', 'cap', 'dmp', 'mem', 'crash',
    'log', 'evtx', 'audit', 'syslog', 'txt', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml',
    'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'rtf', 'odt',
    'png', 'jpg', 'jpeg', 'tiff', 'tif', 'bmp', 'gif', 'webp', 'wav', 'mp3', 'mp4', 'avi', 'mkv',
    'zip', 'tar', 'gz', 'tgz', '7z', 'bz2', 'xz',
    'bin', 'dat', 'hex', 'out',
]);
exports.BLOCKED_EXECUTABLE_EXTENSIONS = new Set([
    'exe', 'bat', 'cmd', 'sh', 'bash', 'zsh', 'ps1', 'psm1', 'vbs', 'vbe',
    'js', 'mjs', 'cjs', 'jar', 'scr', 'msi', 'com', 'hta', 'cpl', 'wsf', 'reg',
]);
function validateEvidenceFile(file, options) {
    if (!file) {
        throw new common_1.BadRequestException('No evidence file was provided in the request');
    }
    if (!file.buffer || file.buffer.length === 0) {
        throw new common_1.BadRequestException('Evidence file cannot be empty (0 bytes received)');
    }
    const minSize = options?.minSizeBytes ?? exports.DEFAULT_MIN_FILE_SIZE;
    const maxSize = options?.maxSizeBytes ?? exports.DEFAULT_MAX_FILE_SIZE;
    if (file.size < minSize || file.buffer.length < minSize) {
        throw new common_1.BadRequestException(`File size must be at least ${minSize} byte(s)`);
    }
    if (file.size > maxSize || file.buffer.length > maxSize) {
        const maxSizeMb = Math.round(maxSize / (1024 * 1024));
        throw new common_1.BadRequestException(`File size exceeds the maximum permitted upload limit of ${maxSizeMb} MB`);
    }
    const originalName = file.originalname || '';
    const lastDotIndex = originalName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === originalName.length - 1) {
        throw new common_1.BadRequestException('Evidence file must contain a valid file extension indicating format (e.g. .raw, .pcap, .log, .pdf, .zip)');
    }
    const extension = originalName.slice(lastDotIndex + 1).toLowerCase();
    if (exports.BLOCKED_EXECUTABLE_EXTENSIONS.has(extension)) {
        throw new common_1.BadRequestException(`Executable script or binary format '.${extension}' is prohibited for direct upload to ensure safety. Please package the evidence inside a secure forensic container or archive (e.g., .zip, .tar, .7z, .dd, .e01).`);
    }
    if (!exports.ALLOWED_EVIDENCE_EXTENSIONS.has(extension)) {
        throw new common_1.BadRequestException(`Unsupported evidence file type '.${extension}'. Allowed types include disk images (.raw, .dd, .e01), packet captures (.pcap), logs (.log, .evtx, .csv, .json), documents (.pdf), and containers (.zip, .7z).`);
    }
    if (!file.mimetype || !file.mimetype.includes('/')) {
        throw new common_1.BadRequestException('Invalid or missing MIME type in multipart upload headers');
    }
}
//# sourceMappingURL=evidence-file.validator.js.map