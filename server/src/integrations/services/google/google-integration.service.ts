import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

type IntegrationConfig = {
  name: string;
  description: string;
  icon: string;
  category: string;
};

@Injectable()
export class GoogleIntegrationService {
  private readonly logger = new Logger(GoogleIntegrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateIntegration(
    config: IntegrationConfig,
  ): Promise<{ id: string }> {
    let integration = await this.prisma.integration.findFirst({
      where: { name: config.name },
    });

    if (!integration) {
      integration = await this.prisma.integration.create({
        data: {
          name: config.name,
          description: config.description,
          icon: config.icon,
          category: config.category,
          isActive: true,
        },
      });
      this.logger.log(`Created integration: ${config.name}`);
    }

    return { id: integration.id };
  }

  async getConnectionStatus(
    userId: string,
    integrationName: string,
  ): Promise<{
    isConnected: boolean;
    email?: string;
    connectedAt?: Date;
    scopes?: string[];
    timezone?: string;
  }> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: integrationName },
    });

    if (!integration) {
      return { isConnected: false };
    }

    const userIntegration = await this.prisma.userIntegration.findUnique({
      where: {
        userId_integrationId: {
          userId,
          integrationId: integration.id,
        },
      },
    });

    if (!userIntegration || !userIntegration.isConnected) {
      return { isConnected: false };
    }

    const metadata =
      (userIntegration.metadata as {
        email?: string;
        timezone?: string;
      }) || {};

    return {
      isConnected: true,
      email: metadata.email,
      connectedAt: userIntegration.createdAt,
      scopes: userIntegration.scopes,
      timezone: metadata.timezone,
    };
  }
}
