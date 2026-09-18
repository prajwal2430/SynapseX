import { CustodyService } from './custody.service';
import { ChainOfCustodyResponseDto, VerifyChainResponseDto } from './dto/chain-of-custody-response.dto';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
export declare class CustodyController {
    private readonly custodyService;
    constructor(custodyService: CustodyService);
    getCustodyChain(id: string, currentUser: UserProfileDto): Promise<ChainOfCustodyResponseDto[]>;
    verifyCustodyChain(id: string, currentUser: UserProfileDto): Promise<VerifyChainResponseDto>;
}
