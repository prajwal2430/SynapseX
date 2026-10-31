import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseQueryDto } from './dto/case-query.dto';
import {
  CaseResponseDto,
  DeleteCaseResponseDto,
} from './dto/case-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { Role } from '../../common/enums/role.enum';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';

@ApiTags('Cases')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'cases', version: '1' })
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new forensic case',
    description: 'Generates auto-incremented caseNumber (e.g. CASE-2026-0001) and assigns the creator to the case.',
  })
  @ApiResponse({
    status: 201,
    description: 'Case successfully created',
    type: CaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - VIEWER role cannot create cases',
  })
  async create(
    @Body() createCaseDto: CreateCaseDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<CaseResponseDto> {
    return this.casesService.create(createCaseDto, currentUser);
  }

  @Get()
  @Roles(
    Role.ADMIN,
    Role.INVESTIGATOR,
    Role.ANALYST,
    Role.REVIEWER,
    Role.VIEWER,
  )
  @ApiOperation({
    summary: 'List cases with pagination, search, filters, and sorting',
    description: 'Retrieves non-deleted cases. Supports regex search on title/description/caseNumber, plus status and priority filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cases returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async findAll(
    @Query() query: CaseQueryDto,
  ): Promise<PaginatedResult<CaseResponseDto>> {
    return this.casesService.findAll(query);
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.INVESTIGATOR,
    Role.ANALYST,
    Role.REVIEWER,
    Role.VIEWER,
  )
  @ApiOperation({
    summary: 'Retrieve case details by ID',
    description: 'Retrieves full case details with populated creator and assigned investigators.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the case' })
  @ApiResponse({
    status: 200,
    description: 'Case details retrieved successfully',
    type: CaseResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Case not found or deleted',
  })
  async findById(@Param('id') id: string): Promise<CaseResponseDto> {
    return this.casesService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update case information, lifecycle status, or assignees',
    description: 'ADMIN can update any case. INVESTIGATOR can only update cases assigned to them.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the case' })
  @ApiResponse({
    status: 200,
    description: 'Case successfully updated',
    type: CaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Investigator not assigned to this case or VIEWER attempting update',
  })
  @ApiResponse({
    status: 404,
    description: 'Case not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCaseDto: UpdateCaseDto,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<CaseResponseDto> {
    return this.casesService.update(id, updateCaseDto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a case',
    description: 'Marks case as deleted and sets deletedAt timestamp. ADMIN can delete any case; INVESTIGATOR can only delete assigned cases.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the case to soft-delete' })
  @ApiResponse({
    status: 200,
    description: 'Case successfully soft-deleted',
    type: DeleteCaseResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - cannot delete case not assigned to you',
  })
  @ApiResponse({
    status: 404,
    description: 'Case not found',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileDto,
  ): Promise<DeleteCaseResponseDto> {
    return this.casesService.delete(id, currentUser);
  }
}
