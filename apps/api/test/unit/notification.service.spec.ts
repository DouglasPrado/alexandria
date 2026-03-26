import { Test } from '@nestjs/testing';
import { NotificationService } from '../../src/modules/notification/notification.service';

/**
 * Testes do NotificationService — envio de emails transacionais via Resend.
 * Fonte: docs/blueprint/17-communication.md (Templates de Email)
 *        docs/backend/13-integrations.md (ResendClient)
 */

// Mock do SDK Resend
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('NotificationService', () => {
  let svc: NotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ id: 'email-id-123' });

    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'noreply@alexandria.app';
    process.env.APP_BASE_URL = 'https://app.alexandria.app';

    const module = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    svc = module.get<NotificationService>(NotificationService);
  });

  describe('sendInviteEmail()', () => {
    /**
     * EMAIL-1: Convite para o cluster.
     * Fonte: docs/blueprint/17-communication.md — "Email: Convite para o Cluster"
     * Trigger: Admin convida membro via POST /clusters/:id/invite
     */
    it('should send invite email with correct subject and CTA link (EMAIL-1)', async () => {
      await svc.sendInviteEmail({
        to: 'maria@email.com',
        name: 'Maria',
        inviterName: 'Douglas',
        clusterName: 'Familia Prado',
        inviteToken: 'tok_abc123',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['maria@email.com'],
          subject: expect.stringContaining('Familia Prado'),
          html: expect.stringContaining('tok_abc123'),
          text: expect.stringContaining('tok_abc123'),
        }),
      );
    });
  });

  describe('sendWelcomeEmail()', () => {
    /**
     * EMAIL-2: Boas-vindas ao cluster.
     * Fonte: docs/blueprint/17-communication.md — "Email: Boas-vindas ao Cluster"
     * Trigger: Membro aceita convite (MemberJoined)
     */
    it('should send welcome email with cluster name and role (EMAIL-2)', async () => {
      await svc.sendWelcomeEmail({
        to: 'maria@email.com',
        name: 'Maria',
        clusterName: 'Familia Prado',
        role: 'member',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['maria@email.com'],
          subject: expect.stringContaining('Familia Prado'),
          html: expect.stringContaining('Familia Prado'),
        }),
      );
    });
  });

  describe('sendNodeLostAlert()', () => {
    /**
     * EMAIL-3: Alerta crítico — nó perdido.
     * Fonte: docs/blueprint/17-communication.md — "Email: Alerta Critico — No Perdido"
     * Trigger: Nó marcado como "lost" após 1h sem heartbeat
     */
    it('should send node-lost alert to admin with node name and chunks affected (EMAIL-3)', async () => {
      await svc.sendNodeLostAlert({
        to: 'admin@email.com',
        adminName: 'Douglas',
        nodeName: 'MacBook do Douglas',
        nodeType: 's3',
        chunksAffected: 1247,
        clusterName: 'Familia Prado',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['admin@email.com'],
          subject: expect.stringContaining('MacBook do Douglas'),
          html: expect.stringContaining('1.247'),
        }),
      );
    });
  });

  describe('sendFileErrorEmail()', () => {
    /**
     * EMAIL-4: Erro no upload.
     * Fonte: docs/blueprint/17-communication.md — "Email: Erro no Upload"
     * Trigger: Pipeline de mídia falha (File status = error)
     */
    it('should send file-error email with file name and retry URL (EMAIL-4)', async () => {
      await svc.sendFileErrorEmail({
        to: 'maria@email.com',
        name: 'Maria',
        fileName: 'ferias-2025.jpg',
        fileId: 'file-uuid-123',
        errorReason: 'Codec nao suportado',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['maria@email.com'],
          subject: expect.stringContaining('ferias-2025.jpg'),
          html: expect.stringContaining('file-uuid-123'),
        }),
      );
    });
  });

  describe('graceful degradation', () => {
    /**
     * EMAIL-5: Sem API key → não lança exceção (não bloqueia fluxo principal).
     * Fonte: docs/backend/13-integrations.md — ResendClient fallback
     */
    it('should not throw if RESEND_API_KEY is missing (EMAIL-5)', async () => {
      delete process.env.RESEND_API_KEY;

      const module = await Test.createTestingModule({
        providers: [NotificationService],
      }).compile();
      const svcNoKey = module.get<NotificationService>(NotificationService);

      await expect(
        svcNoKey.sendInviteEmail({
          to: 'test@email.com',
          name: 'Test',
          inviterName: 'Admin',
          clusterName: 'Test Cluster',
          inviteToken: 'token',
        }),
      ).resolves.not.toThrow();
    });

    /**
     * EMAIL-6: Erro do Resend → não propaga (silencia, não bloqueia fluxo).
     * Fonte: docs/backend/13-integrations.md — Circuit Breaker fallback
     */
    it('should not throw if Resend.send() throws (EMAIL-6)', async () => {
      mockSend.mockRejectedValueOnce(new Error('Resend API error'));

      await expect(
        svc.sendInviteEmail({
          to: 'test@email.com',
          name: 'Test',
          inviterName: 'Admin',
          clusterName: 'Test',
          inviteToken: 'tok',
        }),
      ).resolves.not.toThrow();
    });
  });
});
