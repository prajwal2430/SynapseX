export declare class TimelineQueryDto {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    eventType?: string;
    evidenceId?: string;
    source?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
