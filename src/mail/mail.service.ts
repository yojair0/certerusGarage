import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

import { required } from '../common/config/env.config.js';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger('MailService');
  private readonly useResend = !!process.env.RESEND_API_KEY;
  private readonly resend = this.useResend ? new Resend(process.env.RESEND_API_KEY!) : null;
  
  private readonly transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    requireTLS: true,
    auth: {
      user: required('EMAIL_USER'),
      pass: required('EMAIL_PASS'),
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
  } as any);

  async onModuleInit(): Promise<void> {
    try {
      if (this.useResend) {
        this.logger.debug('🔍 Usando proveedor Resend (API) para emails');
        // Resend no requiere verificación de conexión, probamos un ping básico
        this.logger.log('✅ Resend inicializado');
      } else {
        this.logger.debug('🔍 Verificando conexión SMTP con Gmail...');
        await this.transporter.verify();
        this.logger.log('✅ Conexión SMTP verificada');
      }
    } catch (error: any) {
      this.logger.error('❌ Falló la verificación SMTP');
      this.logger.error(`   Error: ${error?.message || String(error)}`);
      this.logger.error(`   Code: ${error?.code || 'N/A'}`);
    }
  }
  private readonly baseUrl = process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

  private async loadTemplate(name: string, token: string): Promise<string> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Try dist/ first (production), fallback to src/ (development)
    const compiledPath = path.join(__dirname, 'templates', name);
    let templatePath = compiledPath;

    try {
      await fs.access(compiledPath);
    } catch {
      templatePath = path.resolve(process.cwd(), 'src', 'mail', 'templates', name);
    }

    let html = await fs.readFile(templatePath, 'utf8');
    const url = `${this.baseUrl}/auth/${token}`;
    html = html.replace(/{{LINK}}/g, url);
    return html;
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      this.logger.debug(`📤 Attempting to send email to: ${to}`);
      this.logger.debug(`   Subject: ${subject}`);

      if (this.useResend && this.resend) {
        const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
        const result = await this.resend.emails.send({
          from: fromEmail,
          to,
          subject,
          html,
        });
        if ((result as any)?.error) {
          const err = (result as any).error;
          throw new Error(`Resend error: ${err?.message || JSON.stringify(err)}`);
        }
        this.logger.log(`✅ Email sent via Resend to ${to}`);
        this.logger.debug(`   Resend ID: ${(result as any)?.id || 'N/A'}`);
      } else {
        const info = await this.transporter.sendMail({
          from: `"No Reply" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`✅ Email sent successfully to ${to}`);
        this.logger.debug(`   Message ID: ${info.messageId}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${to}`);
      this.logger.error(`   Error: ${error?.message || String(error)}`);
      this.logger.error(`   Code: ${error?.code || 'N/A'}`);
      throw error;
    }
  }

  public async sendConfirmationEmail(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'confirm-email.html',
      `confirm-email?token=${token}`,
    );
    await this.sendEmail(to, '✅ Confirm your account', html);
  }

  public async sendConfirmationUpdatedEmail(
    to: string,
    token: string,
  ): Promise<void> {
    const html = await this.loadTemplate(
      'confirm-email-update.html',
      `confirm-email-update?token=${token}`,
    );
    await this.sendEmail(to, '📩 Confirm your new email', html);
  }

  public async sendRevertEmailChange(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'revert-email.html',
      `revert-email?token=${token}`,
    );
    await this.sendEmail(to, '🔄 Revert email change', html);
  }

  public async sendPasswordReset(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'reset-password.html',
      `reset-password?token=${token}`,
    );
    await this.sendEmail(to, '🔐 Reset your password', html);
  }

  public async sendUnlockAccount(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'unlock-account.html',
      `unlock-account?token=${token}`,
    );
    await this.sendEmail(to, '🔓 Unlock your account', html);
  }
}
