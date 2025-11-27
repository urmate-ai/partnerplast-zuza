import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getIntegrations(@Query('search') search?: string) {
    if (search && search.trim()) {
      return this.integrationsService.searchIntegrations(search.trim());
    }
    return this.integrationsService.getAllIntegrations();
  }
}

