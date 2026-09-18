import { TimelineService } from './timeline.service';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { TimelineEventResponseDto } from './dto/timeline-event-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
export declare class TimelineController {
    private readonly timelineService;
    constructor(timelineService: TimelineService);
    findByCase(caseId: string, query: TimelineQueryDto, currentUser: UserProfileDto): Promise<PaginatedResult<TimelineEventResponseDto>>;
    findById(id: string, currentUser: UserProfileDto): Promise<TimelineEventResponseDto>;
}
