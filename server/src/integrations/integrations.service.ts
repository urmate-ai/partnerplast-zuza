import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IntegrationResponse } from './types/integrations.types';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllIntegrations(): Promise<IntegrationResponse[]> {
    try {
      const integrations = await this.prisma.integration.findMany({
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Retrieved ${integrations.length} integrations`);
      return integrations;
    } catch (error) {
      this.logger.error('Error fetching integrations:', error);
      throw error;
    }
  }

  async searchIntegrations(query: string): Promise<IntegrationResponse[]> {
    try {
      const integrations = await this.prisma.integration.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Found ${integrations.length} integrations matching query: ${query}`);
      return integrations;
    } catch (error) {
      this.logger.error('Error searching integrations:', error);
      throw error;
    }
  }
}

