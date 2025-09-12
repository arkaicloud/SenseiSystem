
import nodemailer from 'nodemailer';
import { storage } from '../storage';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private smtpConfigured: boolean = false;

  constructor() {
    // Transporter será criado dinamicamente com base nas configurações da escola
  }

  private async createTransporter(): Promise<nodemailer.Transporter> {
    try {
      // Buscar configurações SMTP da escola
      const schoolConfig = await storage.getSchoolConfig();
      
      if (schoolConfig?.smtpEnabled && schoolConfig.smtpHost) {
        // Usar configurações SMTP personalizadas da escola
        const transportConfig: any = {
          host: schoolConfig.smtpHost,
          port: schoolConfig.smtpPort || 587,
          secure: schoolConfig.smtpSecure || false, // true para 465, false para outras portas
          auth: {
            user: schoolConfig.smtpUser,
            pass: schoolConfig.smtpPassword
          }
        };

        console.log(`🔧 Using custom SMTP: ${schoolConfig.smtpHost}:${schoolConfig.smtpPort}`);
        this.smtpConfigured = true;
        return nodemailer.createTransporter(transportConfig);
      } else {
        // Fallback para variáveis de ambiente (Gmail ou outros)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          console.log('🔧 Using fallback SMTP from environment variables');
          this.smtpConfigured = true;
          return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
        } else {
          console.warn('⚠️ No SMTP configuration found. Email sending disabled.');
          this.smtpConfigured = false;
          throw new Error('SMTP not configured');
        }
      }
    } catch (error) {
      console.error('❌ Error creating email transporter:', error);
      this.smtpConfigured = false;
      throw error;
    }
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter || !this.smtpConfigured) {
      this.transporter = await this.createTransporter();
    }
    return this.transporter;
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
    try {
      if (!this.smtpConfigured) {
        await this.createTransporter();
      }

      if (!this.smtpConfigured) {
        console.warn('⚠️ SMTP not configured. Cannot send password reset email.');
        return null;
      }

      // Buscar configurações da escola para personalização
      const schoolConfig = await storage.getSchoolConfig();
      const schoolName = schoolConfig?.schoolName || 'SenseiSystem';
      
      // URL base do sistema
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
      
      const fromEmail = schoolConfig?.smtpFromEmail || process.env.EMAIL_FROM || `noreply@senseisystem.com.br`;
      const fromName = schoolConfig?.smtpFromName || schoolName;
      
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: userEmail,
        subject: `${schoolName} - Redefinição de Senha`,
        html: this.getPasswordResetEmailTemplate(userName, schoolName, resetUrl)
      };

      const transporter = await this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ E-mail de reset de senha enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de reset:', error);
      throw error;
    }
  }

  private getPasswordResetEmailTemplate(userName: string, schoolName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha - ${schoolName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2563EB;">
            <h1 style="color: #2563EB; margin: 0; font-size: 28px;">${schoolName}</h1>
            <p style="color: #64748B; margin: 5px 0 0 0;">Sistema de Gestão de Academia</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 0;">
            <h2 style="color: #1E293B; font-size: 22px;">Olá, ${userName}!</h2>
            
            <p style="color: #475569; font-size: 16px; margin: 20px 0;">
              Recebemos uma solicitação para redefinir a senha da sua conta no <strong>${schoolName}</strong>.
            </p>
            
            <p style="color: #475569; font-size: 16px; margin: 20px 0;">
              Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:
            </p>
            
            <!-- Reset Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Redefinir Minha Senha
              </a>
            </div>
            
            <p style="color: #64748B; font-size: 14px; margin: 20px 0;">
              Ou copie e cole este link no seu navegador:
            </p>
            <p style="color: #2563EB; font-size: 14px; word-break: break-all; background-color: #F1F5F9; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="color: #92400E; margin: 0; font-size: 14px;">
                <strong>⚠️ Importante:</strong> Este link é válido por apenas <strong>1 hora</strong> e pode ser usado apenas uma vez.
              </p>
            </div>
            
            <p style="color: #64748B; font-size: 14px; margin: 20px 0;">
              Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança. Sua senha atual permanece inalterada.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #E2E8F0; padding: 20px 0; text-align: center;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
              Este e-mail foi enviado automaticamente pelo sistema ${schoolName}.<br>
              Por favor, não responda a este e-mail.
            </p>
            <p style="color: #94A3B8; font-size: 12px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} ${schoolName} - Powered by SenseiSystem
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }

  // Método para testar configuração de e-mail
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      console.log('✅ SMTP configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ SMTP configuration is invalid:', error);
      return false;
    }
  }

  // Método para enviar email de boas-vindas na matrícula
  async sendWelcomeEmail(userEmail: string, userName: string, studentName: string, tempPassword?: string) {
    try {
      if (!this.smtpConfigured) {
        await this.createTransporter();
      }

      if (!this.smtpConfigured) {
        console.warn('⚠️ SMTP not configured. Cannot send welcome email.');
        return null;
      }

      const schoolConfig = await storage.getSchoolConfig();
      const schoolName = schoolConfig?.schoolName || 'SenseiSystem';
      
      const fromEmail = schoolConfig?.smtpFromEmail || process.env.EMAIL_FROM || `noreply@senseisystem.com.br`;
      const fromName = schoolConfig?.smtpFromName || schoolName;
      
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: userEmail,
        subject: `Bem-vindo(a) ao ${schoolName}! - Matrícula Confirmada`,
        html: this.getWelcomeEmailTemplate(userName, studentName, schoolName, tempPassword)
      };

      const transporter = await this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ E-mail de boas-vindas enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de boas-vindas:', error);
      throw error;
    }
  }

  // Método para enviar comunicados da escola
  async sendSchoolNoticeEmail(userEmail: string, userName: string, noticeTitle: string, noticeContent: string) {
    try {
      if (!this.smtpConfigured) {
        await this.createTransporter();
      }

      if (!this.smtpConfigured) {
        console.warn('⚠️ SMTP not configured. Cannot send notice email.');
        return null;
      }

      const schoolConfig = await storage.getSchoolConfig();
      const schoolName = schoolConfig?.schoolName || 'SenseiSystem';
      
      const fromEmail = schoolConfig?.smtpFromEmail || process.env.EMAIL_FROM || `noreply@senseisystem.com.br`;
      const fromName = schoolConfig?.smtpFromName || schoolName;
      
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: userEmail,
        subject: `${schoolName} - ${noticeTitle}`,
        html: this.getSchoolNoticeEmailTemplate(userName, noticeTitle, noticeContent, schoolName)
      };

      const transporter = await this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ E-mail de comunicado enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de comunicado:', error);
      throw error;
    }
  }

  private getWelcomeEmailTemplate(userName: string, studentName: string, schoolName: string, tempPassword?: string): string {
    const passwordSection = tempPassword ? `
      <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 25px 0;">
        <h3 style="color: #92400E; margin: 0 0 10px 0; font-size: 16px;">🔑 Suas Credenciais de Acesso</h3>
        <p style="color: #92400E; margin: 0; font-size: 14px;">
          <strong>E-mail:</strong> ${userName}<br>
          <strong>Senha temporária:</strong> <code style="background: #FDE68A; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code>
        </p>
        <p style="color: #92400E; margin: 10px 0 0 0; font-size: 12px;">
          ⚠️ Altere sua senha no primeiro acesso para manter sua conta segura.
        </p>
      </div>` : '';

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo(a) ao ${schoolName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3B82F6;">
            <h1 style="color: #3B82F6; margin: 0; font-size: 28px;">${schoolName}</h1>
            <p style="color: #64748B; margin: 5px 0 0 0;">Bem-vindo(a) à nossa academia!</p>
          </div>
          
          <div style="padding: 30px 0;">
            <h2 style="color: #1E293B; font-size: 22px;">🎉 Olá, ${userName}!</h2>
            
            <p style="color: #475569; font-size: 16px; margin: 20px 0;">
              É com grande prazer que confirmamos a matrícula de <strong>${studentName}</strong> em nossa academia!
            </p>
            
            <p style="color: #475569; font-size: 16px; margin: 20px 0;">
              Agora você faz parte da nossa família e poderá acessar o nosso sistema para:
            </p>
            
            <ul style="color: #475569; font-size: 16px; margin: 20px 0; padding-left: 20px;">
              <li>📅 Visualizar horários das aulas</li>
              <li>✅ Confirmar presença</li>
              <li>📊 Acompanhar progresso e estatísticas</li>
              <li>📢 Receber comunicados importantes</li>
              <li>💳 Gerenciar pagamentos</li>
            </ul>
            
            ${passwordSection}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.BASE_URL || 'http://localhost:5000'}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Acessar Sistema
              </a>
            </div>
            
            <p style="color: #64748B; font-size: 14px; margin: 20px 0;">
              Estamos ansiosos para acompanhá-lo(a) em sua jornada no Jiu-Jitsu. Qualquer dúvida, estamos à disposição!
            </p>
          </div>
          
          <div style="border-top: 1px solid #E2E8F0; padding: 20px 0; text-align: center;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ${schoolName} - Powered by SenseiSystem
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }

  private getSchoolNoticeEmailTemplate(userName: string, noticeTitle: string, noticeContent: string, schoolName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${noticeTitle} - ${schoolName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3B82F6;">
            <h1 style="color: #3B82F6; margin: 0; font-size: 28px;">${schoolName}</h1>
            <p style="color: #64748B; margin: 5px 0 0 0;">Comunicado Oficial</p>
          </div>
          
          <div style="padding: 30px 0;">
            <h2 style="color: #1E293B; font-size: 22px;">Olá, ${userName}!</h2>
            
            <h3 style="color: #3B82F6; font-size: 20px; margin: 25px 0 15px 0;">${noticeTitle}</h3>
            
            <div style="color: #475569; font-size: 16px; margin: 20px 0; line-height: 1.8;">
              ${noticeContent.replace(/\n/g, '<br>')}
            </div>
            
            <div style="background-color: #F1F5F9; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 25px 0;">
              <p style="color: #475569; margin: 0; font-size: 14px;">
                💬 Para dúvidas ou mais informações, entre em contato conosco através do sistema ou diretamente na academia.
              </p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #E2E8F0; padding: 20px 0; text-align: center;">
            <p style="color: #94A3B8; font-size: 12px; margin: 0;">
              Este comunicado foi enviado pelo ${schoolName}.<br>
              © ${new Date().getFullYear()} ${schoolName} - Powered by SenseiSystem
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }
}


  // Método para obter configurações SMTP atuais
  async getCurrentSMTPConfig() {
    try {
      const schoolConfig = await storage.getSchoolConfig();
      return {
        enabled: schoolConfig?.smtpEnabled || false,
        host: schoolConfig?.smtpHost || '',
        port: schoolConfig?.smtpPort || 587,
        secure: schoolConfig?.smtpSecure || false,
        user: schoolConfig?.smtpUser || '',
        fromEmail: schoolConfig?.smtpFromEmail || '',
        fromName: schoolConfig?.smtpFromName || ''
      };
    } catch (error) {
      console.error('❌ Error getting SMTP config:', error);
      return null;
    }
  }

  // Método para recarregar transporter após mudanças de configuração
  async reloadConfiguration() {
    this.transporter = null;
    this.smtpConfigured = false;
    console.log('🔄 SMTP configuration reloaded');
  }
}

export const emailService = new EmailService();
