import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post(':businessId')
  @ApiOperation({ summary: 'Create catalog item' })
  async create(@Param('businessId') businessId: string, @Body() dto: any) {
    return this.catalogService.create(businessId, dto);
  }

  @Put(':businessId/:itemId')
  @ApiOperation({ summary: 'Update catalog item' })
  async update(
    @Param('businessId') businessId: string,
    @Param('itemId') itemId: string,
    @Body() dto: any,
  ) {
    return this.catalogService.update(businessId, itemId, dto);
  }

  @Get(':businessId')
  @ApiOperation({ summary: 'List catalog items' })
  async findAll(
    @Param('businessId') businessId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('favoritesOnly') favoritesOnly?: string,
  ) {
    return this.catalogService.findAll(businessId, {
      category,
      search,
      favoritesOnly: favoritesOnly === 'true',
    });
  }

  @Get(':businessId/top')
  @ApiOperation({ summary: 'Get top items by usage' })
  async getTop(@Param('businessId') businessId: string, @Query('limit') limit?: number) {
    return this.catalogService.getTopItems(businessId, limit || 10);
  }

  @Get(':businessId/recent')
  @ApiOperation({ summary: 'Get recently used items' })
  async getRecent(@Param('businessId') businessId: string, @Query('limit') limit?: number) {
    return this.catalogService.getRecentItems(businessId, limit || 10);
  }

  @Get(':businessId/suggestions')
  @ApiOperation({ summary: 'Get item suggestions by amount' })
  async getSuggestions(@Param('businessId') businessId: string, @Query('amount') amount: number) {
    return this.catalogService.getSuggestions(businessId, amount);
  }

  @Get(':businessId/categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories(@Param('businessId') businessId: string) {
    return this.catalogService.getCategories(businessId);
  }

  @Put(':businessId/:itemId/favorite')
  @ApiOperation({ summary: 'Toggle favorite' })
  async toggleFavorite(@Param('businessId') businessId: string, @Param('itemId') itemId: string) {
    return this.catalogService.toggleFavorite(businessId, itemId);
  }

  @Delete(':businessId/:itemId')
  @ApiOperation({ summary: 'Soft delete catalog item' })
  async delete(@Param('businessId') businessId: string, @Param('itemId') itemId: string) {
    return this.catalogService.delete(businessId, itemId);
  }
}
