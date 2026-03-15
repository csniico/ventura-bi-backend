import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from '../audit.controller';
import { AuditService } from '../audit.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import { createAuditStub } from 'src/common/__tests__/test-factories';

describe('AuditController', () => {
  let controller: AuditController;
  let mockService: jest.Mocked<Partial<AuditService>>;

  beforeEach(async () => {
    mockService = {
      getEntityLogs: jest.fn(),
      getUserLogs: jest.fn(),
      getActionLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditController>(AuditController);
  });

  describe('getEntityLogs', () => {
    it('calls auditService.getEntityLogs with entity and entityId params', async () => {
      const audits = [createAuditStub()];
      mockService.getEntityLogs!.mockResolvedValue(audits as any);

      const result = await controller.getEntityLogs(
        AuditEntity.ORDER,
        'order-uuid',
      );

      expect(mockService.getEntityLogs).toHaveBeenCalledWith(
        AuditEntity.ORDER,
        'order-uuid',
      );
      expect(result).toEqual(audits);
    });
  });

  describe('getUserLogs', () => {
    it('calls auditService.getUserLogs with userId param', async () => {
      const audits = [createAuditStub()];
      mockService.getUserLogs!.mockResolvedValue(audits as any);

      const result = await controller.getUserLogs('user-uuid');

      expect(mockService.getUserLogs).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(audits);
    });
  });

  describe('getActionLogs', () => {
    it('calls auditService.getActionLogs with action query param', async () => {
      const audits = [createAuditStub()];
      mockService.getActionLogs!.mockResolvedValue(audits as any);

      const result = await controller.getActionLogs(AuditAction.CREATE);

      expect(mockService.getActionLogs).toHaveBeenCalledWith(
        AuditAction.CREATE,
      );
      expect(result).toEqual(audits);
    });
  });
});
