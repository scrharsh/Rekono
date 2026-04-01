import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KnowledgeService } from './knowledge.service';

@ApiTags('Knowledge Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  @ApiOperation({ summary: 'Search knowledge guides' })
  async findAll(@Query('search') search?: string, @Query('category') category?: string) {
    return this.knowledgeService.findAll(search, category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    return this.knowledgeService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get guide by ID' })
  async findById(@Param('id') id: string) {
    return this.knowledgeService.findById(id);
  }
}
