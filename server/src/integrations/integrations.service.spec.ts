import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '../prisma/prisma.service';
import type { IntegrationResponse } from './types/integrations.types';
import type { Integration } from '@prisma/client';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockIntegrations: IntegrationResponse[] = [
    {
      id: 'integration-1',
      name: 'Google Calendar',
      description: 'Integracja z Google Calendar',
      icon: 'calendar-icon',
      category: 'calendar',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'integration-2',
      name: 'Slack',
      description: 'Integracja z Slack',
      icon: 'slack-icon',
      category: 'communication',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: PrismaService,
          useValue: {
            integration: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllIntegrations', () => {
    it('powinien zwrócić wszystkie integracje posortowane alfabetycznie', async () => {
      (prismaService.integration.findMany as jest.Mock).mockResolvedValue(
        mockIntegrations as Integration[],
      );

      const result = await service.getAllIntegrations();

      expect(
        prismaService.integration.findMany as jest.Mock,
      ).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
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
      expect(result).toEqual(mockIntegrations);
      expect(result).toHaveLength(2);
    });

    it('powinien rzucić błąd gdy wystąpi problem z bazą danych', async () => {
      (prismaService.integration.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getAllIntegrations()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('searchIntegrations', () => {
    it('powinien wyszukać integracje po zapytaniu', async () => {
      const query = 'calendar';
      const filteredIntegrations = [mockIntegrations[0]];

      (prismaService.integration.findMany as jest.Mock).mockResolvedValue(
        filteredIntegrations as Integration[],
      );

      const result = await service.searchIntegrations(query);

      expect(
        prismaService.integration.findMany as jest.Mock,
      ).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
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
      expect(result).toEqual(filteredIntegrations);
      expect(result).toHaveLength(1);
    });

    it('powinien zwrócić pustą tablicę gdy nie znaleziono wyników', async () => {
      (prismaService.integration.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.searchIntegrations('nonexistent');

      expect(result).toEqual([]);
    });

    it('powinien rzucić błąd gdy wystąpi problem z bazą danych', async () => {
      (prismaService.integration.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.searchIntegrations('test')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
