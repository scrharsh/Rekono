import { Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaDocumentsService } from './ca-documents.service';

@ApiTags('CA Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ca/documents')
export class CaDocumentsController {
  constructor(private readonly caDocumentsService: CaDocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('clientId') clientId: string,
    @Body('documentType') documentType: string,
    @Body('notes') notes?: string,
  ) {
    return this.caDocumentsService.upload(req.user.userId, clientId, file, documentType, notes);
  }

  @Get()
  @ApiOperation({ summary: 'List documents' })
  async findAll(@Request() req: any, @Query('clientId') clientId?: string) {
    return this.caDocumentsService.findAll(req.user.userId, clientId);
  }

  @Get('completeness/:clientId')
  @ApiOperation({ summary: 'Get document completeness for a client' })
  async getCompleteness(@Request() req: any, @Param('clientId') clientId: string) {
    return this.caDocumentsService.getCompleteness(req.user.userId, clientId);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify a document' })
  async verify(@Request() req: any, @Param('id') id: string) {
    return this.caDocumentsService.verify(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.caDocumentsService.delete(req.user.userId, id);
  }
}
