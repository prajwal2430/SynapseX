import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CustodyService } from './custody.service';
import {
  ChainOfCustodyResponseDto,
  VerifyChainResponseDto,
} from './dto/chain-of-custody-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Tamper-Evident Custody Logging')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ version: '1' })
export class CustodyController {
  constructor(private readonly custodyService: CustodyService) {}

  @Get('evidence/:id/custody')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @ApiOperation({
    summary: 'Retrieve tamper-evident chain of custody ledger for an evidence item',
    description:
      'Returns the chronological, append-only chain of custody records with cryptographic SHA-256 hashes linking each record to the previous one.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Chain of custody ledger retrieved successfully',
    type: [ChainOfCustodyResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authorized for this case' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async getCustodyChain(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<ChainOfCustodyResponseDto[]> {
    return this.custodyService.getChainByEvidenceId(id, currentUser);
  }

  @Get('evidence/:id/custody/verify')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.ANALYST, Role.REVIEWER, Role.VIEWER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cryptographically verify the tamper-evident chain of custody',
    description:
      'Walks the custody ledger from genesis to head, verifying each previousRecordHash pointer, sequence number continuity (detecting missing records), and re-computing SHA-256 digests. Does not claim legal/court certification.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the evidence artifact' })
  @ApiResponse({
    status: 200,
    description: 'Chain verification report',
    type: VerifyChainResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async verifyCustodyChain(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<VerifyChainResponseDto> {
    return this.custodyService.verifyChain(id, currentUser);
  }
}
