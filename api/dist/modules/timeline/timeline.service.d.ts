import { Model } from 'mongoose';
import { TimelineEventDocument } from './schemas/timeline-event.schema';
import { CaseDocument } from '../cases/schemas/case.schema';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { TimelineEventResponseDto } from './dto/timeline-event-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class TimelineService {
    private readonly timelineEventModel;
    private readonly caseModel;
    private readonly logger;
    constructor(timelineEventModel: Model<TimelineEventDocument>, caseModel: Model<CaseDocument>);
    findByCaseId(caseId: string, query: TimelineQueryDto, currentUser: UserProfileDto): Promise<PaginatedResult<TimelineEventResponseDto>>;
    findById(id: string, currentUser: UserProfileDto): Promise<TimelineEventResponseDto>;
    createTimelineEvent(dto: CreateTimelineEventDto): Promise<TimelineEventDocument>;
    ingestTimelineEvents(caseId: string, evidenceId: string, defaultSource: string, events: Array<{
        timestamp: string;
        timezone?: string;
        eventType: string;
        title: string;
        description?: string;
        source?: string;
        entities?: Array<any>;
        metadata?: Record<string, any>;
    }>): Promise<TimelineEventDocument[]>;
    assertCanViewCase(caseDoc: CaseDocument, currentUser: UserProfileDto): void;
    private mapToResponse;
    private escapeRegex;
}
