export interface FileValidationOptions {
    maxSizeBytes?: number;
    minSizeBytes?: number;
}
export declare const DEFAULT_MAX_FILE_SIZE: number;
export declare const DEFAULT_MIN_FILE_SIZE = 1;
export declare const ALLOWED_EVIDENCE_EXTENSIONS: Set<string>;
export declare const BLOCKED_EXECUTABLE_EXTENSIONS: Set<string>;
export declare function validateEvidenceFile(file: Express.Multer.File, options?: FileValidationOptions): void;
