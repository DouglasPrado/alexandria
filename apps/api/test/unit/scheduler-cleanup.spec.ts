import { SchedulerService } from '../../src/modules/health/scheduler.service';

/**
 * Testes dos cron jobs de cleanup.
 * Fonte: docs/backend/12-events.md (CleanExpiredInvites diario 05:00, AlertCleanup semanal 06:00)
 */

const mockPrisma = {
  invite: {
    deleteMany: jest.fn(),
  },
  alert: {
    deleteMany: jest.fn(),
  },
};

const mockHealthService = {} as any;
const mockStorageService = {} as any;

describe('SchedulerService — cleanup jobs', () => {
  let scheduler: SchedulerService;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new SchedulerService(
      mockHealthService,
      mockStorageService,
      mockPrisma as any,
    );
  });

  describe('handleCleanExpiredInvites()', () => {
    it('should delete invites where expiresAt < now AND acceptedAt is null', async () => {
      mockPrisma.invite.deleteMany.mockResolvedValue({ count: 3 });

      await scheduler.handleCleanExpiredInvites();

      expect(mockPrisma.invite.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
          acceptedAt: null,
        },
      });
    });

    it('should not throw if no expired invites found', async () => {
      mockPrisma.invite.deleteMany.mockResolvedValue({ count: 0 });

      await expect(scheduler.handleCleanExpiredInvites()).resolves.not.toThrow();
    });
  });

  describe('handleAlertCleanup()', () => {
    it('should delete alerts resolved more than 90 days ago', async () => {
      mockPrisma.alert.deleteMany.mockResolvedValue({ count: 5 });

      await scheduler.handleAlertCleanup();

      expect(mockPrisma.alert.deleteMany).toHaveBeenCalledWith({
        where: {
          resolved: true,
          resolvedAt: { lt: expect.any(Date) },
        },
      });

      // Verify the date is approximately 90 days ago
      const call = mockPrisma.alert.deleteMany.mock.calls[0][0];
      const cutoff = call.where.resolvedAt.lt as Date;
      const daysAgo = (Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysAgo).toBeCloseTo(90, 0);
    });

    it('should not throw if no old alerts found', async () => {
      mockPrisma.alert.deleteMany.mockResolvedValue({ count: 0 });

      await expect(scheduler.handleAlertCleanup()).resolves.not.toThrow();
    });
  });
});
