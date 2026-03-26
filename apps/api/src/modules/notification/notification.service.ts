import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * NotificationService — envio de emails transacionais via Resend.
 * Fonte: docs/backend/13-integrations.md (ResendClient)
 *        docs/blueprint/17-communication.md (Templates de Email)
 *
 * Graceful degradation: se RESEND_API_KEY não estiver definida ou o envio falhar,
 * o erro é logado mas não propagado — não bloqueia o fluxo principal.
 */

export interface InviteEmailParams {
  to: string;
  name: string;
  inviterName: string;
  clusterName: string;
  inviteToken: string;
}

export interface WelcomeEmailParams {
  to: string;
  name: string;
  clusterName: string;
  role: string;
}

export interface NodeLostAlertParams {
  to: string;
  adminName: string;
  nodeName: string;
  nodeType: string;
  chunksAffected: number;
  clusterName: string;
}

export interface FileErrorEmailParams {
  to: string;
  name: string;
  fileName: string;
  fileId: string;
  errorReason: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.RESEND_FROM_EMAIL ?? 'Alexandria <noreply@alexandria.app>';
    this.baseUrl = process.env.APP_BASE_URL ?? 'https://app.alexandria.app';
    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!apiKey) {
      this.logger.warn('[NotificationService] RESEND_API_KEY not set — emails disabled');
    }
  }

  /**
   * Envia email de convite para o cluster.
   * Fonte: docs/blueprint/17-communication.md — "Email: Convite para o Cluster"
   */
  async sendInviteEmail(params: InviteEmailParams): Promise<void> {
    const ctaUrl = `${this.baseUrl}/invites/${params.inviteToken}/accept`;
    const subject = `Você foi convidado para o cluster ${params.clusterName}`;
    const html = `
      <h2>Olá, ${params.name}!</h2>
      <p>${params.inviterName} convidou você para participar do cluster familiar <strong>${params.clusterName}</strong> no Alexandria.</p>
      <p>Clique no botão abaixo para aceitar o convite. O link expira em 7 dias.</p>
      <p><a href="${ctaUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Aceitar convite</a></p>
      <p style="color:#888;font-size:12px;">Ou acesse: ${ctaUrl}</p>
    `;
    const text = `Olá ${params.name}, aceite o convite para o cluster "${params.clusterName}" em: ${ctaUrl} — Expira em 7 dias.`;
    await this.send({ to: params.to, subject, html, text });
  }

  /**
   * Envia email de boas-vindas após aceite de convite.
   * Fonte: docs/blueprint/17-communication.md — "Email: Boas-vindas ao Cluster"
   */
  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
    const ctaUrl = `${this.baseUrl}/dashboard`;
    const subject = `Bem-vindo ao cluster ${params.clusterName}!`;
    const html = `
      <h2>Olá, ${params.name}!</h2>
      <p>Você agora faz parte do cluster <strong>${params.clusterName}</strong> no Alexandria.</p>
      <p>Seu acesso está configurado como <strong>${params.role}</strong>.</p>
      <p><a href="${ctaUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Acessar galeria</a></p>
    `;
    const text = `Olá ${params.name}, você entrou no cluster "${params.clusterName}" como ${params.role}. Acesse: ${ctaUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  /**
   * Envia alerta crítico quando nó é marcado como perdido.
   * Fonte: docs/blueprint/17-communication.md — "Email: Alerta Critico — No Perdido"
   */
  async sendNodeLostAlert(params: NodeLostAlertParams): Promise<void> {
    const ctaUrl = `${this.baseUrl}/dashboard/nodes`;
    const chunksFormatted = params.chunksAffected.toLocaleString('pt-BR');
    const subject = `Alerta crítico: nó "${params.nodeName}" perdido`;
    const html = `
      <h2>Alerta crítico — Nó perdido</h2>
      <p>Olá ${params.adminName}, o nó <strong>${params.nodeName}</strong> (${params.nodeType}) está sem heartbeat há mais de 1 hora e foi marcado como perdido.</p>
      <p>O auto-healing foi iniciado para re-replicar <strong>${chunksFormatted}</strong> chunks afetados.</p>
      <p><a href="${ctaUrl}" style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Ver status do cluster</a></p>
    `;
    const text = `Alerta crítico: nó "${params.nodeName}" perdido. ${chunksFormatted} chunks em re-replicação. Acesse: ${ctaUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  /**
   * Envia email de erro no upload para o uploader.
   * Fonte: docs/blueprint/17-communication.md — "Email: Erro no Upload"
   */
  async sendFileErrorEmail(params: FileErrorEmailParams): Promise<void> {
    const ctaUrl = `${this.baseUrl}/dashboard?retry=${params.fileId}`;
    const subject = `Falha no upload de "${params.fileName}"`;
    const html = `
      <h2>Falha no processamento</h2>
      <p>Olá ${params.name}, o processamento do arquivo <strong>${params.fileName}</strong> falhou.</p>
      <p>Motivo: ${params.errorReason}</p>
      <p><a href="${ctaUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Tentar novamente</a></p>
      <p style="color:#888;font-size:12px;">Se o erro persistir, o arquivo pode estar corrompido ou em formato não suportado.</p>
    `;
    const text = `Falha no upload de "${params.fileName}": ${params.errorReason}. Tente novamente em: ${ctaUrl}`;
    await this.send({ to: params.to, subject, html, text });
  }

  /** Envia email via Resend com graceful degradation. */
  private async send(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (!this.resend) return;
    try {
      await this.resend.emails.send({
        from: this.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
    } catch (err) {
      this.logger.error(
        `[NotificationService] Failed to send email to ${params.to}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
