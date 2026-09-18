export interface ValidationErrorDetail {
    field: string;
    constraints: string[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    errors?: ValidationErrorDetail[];
    timestamp: string;
    path: string;
    requestId?: string;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
