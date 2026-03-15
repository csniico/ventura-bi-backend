import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AuditBaseService } from '../services/audit-base.service';
import { AUDIT_REPOSITORY } from 'src/constants';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditEntity } from '../enums/audit-entity.enum';
import {
  createMockRepository,
  MockRepository,
} from 'src/common/__tests__/mock-repository';
import { createAuditStub } from 'src/common/__tests__/test-factories';

describe('AuditBaseService', () => {
  let service: AuditBaseService;
  let auditRepo: MockRepository;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    auditRepo = createMockRepository();
    mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditBaseService,
        { provide: getQueueToken('audit'), useValue: mockQueue },
        { provide: AUDIT_REPOSITORY, useValue: auditRepo },
      ],
    }).compile();

    service = module.get<AuditBaseService>(AuditBaseService);
  });

  describe('queueAuditLog', () => {
    it('calls queue.add with audit-log job name and payload', async () => {
      const payload = {
        action: AuditAction.CREATE,
        entity: AuditEntity.ORDER,
        entityId: 'order-uuid',
        userId: 'user-uuid',
        metadata: { detail: 'test' },
      };

      await service.queueAuditLog(payload);

      expect(mockQueue.add).toHaveBeenCalledWith('audit-log', payload, {
        removeOnComplete: true,
        removeOnFail: false,
      });
    });

    it('swallows error when queue.add throws', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue connection failed'));

      await expect(
        service.queueAuditLog({
          action: AuditAction.CREATE,
          entity: AuditEntity.CUSTOMER,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('createAuditLog', () => {
    it('calls repo.create then repo.save and returns saved audit', async () => {
      const audit = createAuditStub();
      auditRepo.create.mockReturnValue(audit as any);
      auditRepo.save.mockResolvedValue(audit as any);

      const result = await service.createAuditLog(
        AuditAction.UPDATE,
        AuditEntity.INVOICE,
        'invoice-uuid',
        'user-uuid',
        { reason: 'test' },
      );

      expect(auditRepo.create).toHaveBeenCalledWith({
        action: AuditAction.UPDATE,
        entity: AuditEntity.INVOICE,
        entityId: 'invoice-uuid',
        userId: 'user-uuid',
        metadata: { reason: 'test' },
      });
      expect(auditRepo.save).toHaveBeenCalledWith(audit);
      expect(result).toEqual(audit);
    });
  });

  describe('findByEntity', () => {
    it('calls repo.find with entity, entityId and DESC order', async () => {
      const audits = [createAuditStub()];
      auditRepo.find.mockResolvedValue(audits as any);

      const result = await service.findByEntity(
        AuditEntity.ORDER,
        'order-uuid',
      );

      expect(auditRepo.find).toHaveBeenCalledWith({
        where: { entity: AuditEntity.ORDER, entityId: 'order-uuid' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(audits);
    });
  });

  describe('findByUser', () => {
    it('calls repo.find with userId and DESC order', async () => {
      const audits = [createAuditStub()];
      auditRepo.find.mockResolvedValue(audits as any);

      const result = await service.findByUser('user-uuid');

      expect(auditRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(audits);
    });
  });

  describe('findByAction', () => {
    it('calls repo.find with action and DESC order', async () => {
      const audits = [createAuditStub()];
      auditRepo.find.mockResolvedValue(audits as any);

      const result = await service.findByAction(AuditAction.DELETE);

      expect(auditRepo.find).toHaveBeenCalledWith({
        where: { action: AuditAction.DELETE },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(audits);
    });
  });
});
