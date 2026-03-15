import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit.service';
import { AuditBaseService } from '../services/audit-base.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import { createAuditStub } from 'src/common/__tests__/test-factories';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditBaseService: jest.Mocked<Partial<AuditBaseService>>;

  beforeEach(async () => {
    mockAuditBaseService = {
      queueAuditLog: jest.fn(),
      createAuditLog: jest.fn(),
      findByEntity: jest.fn(),
      findByUser: jest.fn(),
      findByAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditBaseService, useValue: mockAuditBaseService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('logAction', () => {
    it('delegates to auditBaseService.queueAuditLog with correct payload', async () => {
      mockAuditBaseService.queueAuditLog!.mockResolvedValue(undefined);

      await service.logAction(
        AuditAction.CREATE,
        AuditEntity.ORDER,
        'order-uuid',
        'user-uuid',
        { detail: 'test' },
      );

      expect(mockAuditBaseService.queueAuditLog).toHaveBeenCalledWith({
        action: AuditAction.CREATE,
        entity: AuditEntity.ORDER,
        entityId: 'order-uuid',
        userId: 'user-uuid',
        metadata: { detail: 'test' },
      });
    });

    it('works without optional params', async () => {
      mockAuditBaseService.queueAuditLog!.mockResolvedValue(undefined);

      await service.logAction(AuditAction.READ, AuditEntity.CUSTOMER);

      expect(mockAuditBaseService.queueAuditLog).toHaveBeenCalledWith({
        action: AuditAction.READ,
        entity: AuditEntity.CUSTOMER,
        entityId: undefined,
        userId: undefined,
        metadata: undefined,
      });
    });
  });

  describe('createLog', () => {
    it('delegates to auditBaseService.createAuditLog', async () => {
      const audit = createAuditStub();
      mockAuditBaseService.createAuditLog!.mockResolvedValue(audit as any);

      const result = await service.createLog(
        AuditAction.UPDATE,
        AuditEntity.INVOICE,
        'invoice-uuid',
        'user-uuid',
      );

      expect(mockAuditBaseService.createAuditLog).toHaveBeenCalledWith(
        AuditAction.UPDATE,
        AuditEntity.INVOICE,
        'invoice-uuid',
        'user-uuid',
        undefined,
      );
      expect(result).toEqual(audit);
    });
  });

  describe('getEntityLogs', () => {
    it('delegates to auditBaseService.findByEntity', async () => {
      const audits = [createAuditStub()];
      mockAuditBaseService.findByEntity!.mockResolvedValue(audits as any);

      const result = await service.getEntityLogs(
        AuditEntity.ORDER,
        'order-uuid',
      );

      expect(mockAuditBaseService.findByEntity).toHaveBeenCalledWith(
        AuditEntity.ORDER,
        'order-uuid',
      );
      expect(result).toEqual(audits);
    });
  });

  describe('getUserLogs', () => {
    it('delegates to auditBaseService.findByUser', async () => {
      const audits = [createAuditStub()];
      mockAuditBaseService.findByUser!.mockResolvedValue(audits as any);

      const result = await service.getUserLogs('user-uuid');

      expect(mockAuditBaseService.findByUser).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(audits);
    });
  });

  describe('getActionLogs', () => {
    it('delegates to auditBaseService.findByAction', async () => {
      const audits = [createAuditStub()];
      mockAuditBaseService.findByAction!.mockResolvedValue(audits as any);

      const result = await service.getActionLogs(AuditAction.DELETE);

      expect(mockAuditBaseService.findByAction).toHaveBeenCalledWith(
        AuditAction.DELETE,
      );
      expect(result).toEqual(audits);
    });
  });
});
