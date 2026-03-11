
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
        return nodemailer.createTransport(transportConfig);
      } else {
        // Fallback para variáveis de ambiente (Gmail ou outros)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          console.log('🔧 Using fallback SMTP from environment variables');
          this.smtpConfigured = true;
          return nodemailer.createTransport({
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
      const baseUrl = (process.env.BASE_URL || 'https://huiosbjj.arkaicloud.com.br').replace(/\/$/, '');
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
        subject: `🎉 Matrícula Confirmada — Bem-vindo(a) ao ${schoolName}!`,
        html: this.getWelcomeEmailTemplate(userName, userEmail, schoolName, tempPassword)
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

  private getWelcomeEmailTemplate(userName: string, userEmail: string, schoolName: string, tempPassword?: string): string {
    const credentialsSection = tempPassword ? `
      <div style="background-color: #FFFBEB; padding: 24px; border-radius: 12px; border: 1px solid #FDE68A; margin: 28px 0;">
        <h3 style="color: #92400E; margin: 0 0 14px 0; font-size: 17px; display: flex; align-items: center; gap: 8px;">
          🔐 Suas Credenciais de Acesso
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #78350F; font-size: 14px; font-weight: bold; width: 140px;">E-mail:</td>
            <td style="padding: 6px 0; color: #92400E; font-size: 14px;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78350F; font-size: 14px; font-weight: bold;">Senha temporária:</td>
            <td style="padding: 6px 0;">
              <code style="background: #FDE68A; color: #78350F; padding: 4px 10px; border-radius: 6px; font-size: 15px; font-weight: bold; letter-spacing: 1px;">${tempPassword}</code>
            </td>
          </tr>
        </table>
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #FDE68A;">
          <p style="color: #92400E; margin: 0; font-size: 13px;">
            ⚠️ <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha no primeiro acesso.
          </p>
        </div>
      </div>` : '';

    const baseUrl = (process.env.BASE_URL || 'https://huiosbjj.arkaicloud.com.br').replace(/\/$/, '');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matrícula Confirmada — ${schoolName}</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; margin: 0; padding: 0; background-color: #F1F5F9;">

  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 36px 32px; text-align: center;">
      <p style="color: #93C5FD; margin: 0 0 6px 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">Academia de Jiu-Jitsu</p>
      <h1 style="color: #FFFFFF; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.5px;">${schoolName}</h1>
      <div style="width: 48px; height: 3px; background: #60A5FA; margin: 14px auto 0; border-radius: 2px;"></div>
    </div>

    <!-- Body -->
    <div style="padding: 36px 32px;">

      <!-- Saudação -->
      <h2 style="color: #1E293B; font-size: 24px; font-weight: 700; margin: 0 0 6px 0;">🎉 Olá, ${userName}!</h2>
      <p style="color: #64748B; font-size: 15px; margin: 0 0 24px 0;">Temos uma ótima notícia para você.</p>

      <!-- Confirmação -->
      <div style="background: #F0FDF4; border-left: 4px solid #22C55E; padding: 18px 20px; border-radius: 8px; margin-bottom: 28px;">
        <p style="color: #166534; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">✅ Matrícula confirmada com sucesso!</p>
        <p style="color: #15803D; font-size: 14px; margin: 0;">
          Sua matrícula na <strong>${schoolName}</strong> foi aprovada. Você agora faz parte da nossa comunidade e pode começar sua jornada de evolução no tatame.
        </p>
      </div>

      <!-- Benefícios do sistema -->
      <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0; font-weight: 600;">
        Com acesso ao nosso sistema, você poderá:
      </p>

      <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px; margin-bottom: 8px;">
        <tr>
          <td style="background: #F8FAFC; border-radius: 8px; padding: 12px 16px; border: 1px solid #E2E8F0;">
            <span style="font-size: 18px; margin-right: 10px;">📅</span>
            <span style="color: #334155; font-size: 14px; font-weight: 500;">Visualizar os horários das aulas</span>
          </td>
        </tr>
        <tr>
          <td style="background: #F8FAFC; border-radius: 8px; padding: 12px 16px; border: 1px solid #E2E8F0;">
            <span style="font-size: 18px; margin-right: 10px;">✅</span>
            <span style="color: #334155; font-size: 14px; font-weight: 500;">Confirmar presença nas aulas</span>
          </td>
        </tr>
        <tr>
          <td style="background: #F8FAFC; border-radius: 8px; padding: 12px 16px; border: 1px solid #E2E8F0;">
            <span style="font-size: 18px; margin-right: 10px;">📊</span>
            <span style="color: #334155; font-size: 14px; font-weight: 500;">Acompanhar seu progresso e estatísticas</span>
          </td>
        </tr>
        <tr>
          <td style="background: #F8FAFC; border-radius: 8px; padding: 12px 16px; border: 1px solid #E2E8F0;">
            <span style="font-size: 18px; margin-right: 10px;">📢</span>
            <span style="color: #334155; font-size: 14px; font-weight: 500;">Receber comunicados importantes da academia</span>
          </td>
        </tr>
        <tr>
          <td style="background: #F8FAFC; border-radius: 8px; padding: 12px 16px; border: 1px solid #E2E8F0;">
            <span style="font-size: 18px; margin-right: 10px;">💳</span>
            <span style="color: #334155; font-size: 14px; font-weight: 500;">Gerenciar seus pagamentos com facilidade</span>
          </td>
        </tr>
      </table>

      <!-- Credenciais -->
      ${credentialsSection}

      <!-- Botão de acesso -->
      <div style="text-align: center; margin: 32px 0 24px;">
        <a href="${baseUrl}/login"
           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
          Acessar o Sistema →
        </a>
      </div>

      <!-- Mensagem final -->
      <div style="text-align: center; padding: 20px 0 8px;">
        <p style="color: #475569; font-size: 15px; margin: 0 0 6px 0;">
          Estamos muito felizes em ter você conosco nessa jornada.<br>
          Dedicação, disciplina e evolução constante — esses são os valores que nos unem.
        </p>
        <p style="color: #1E3A8A; font-size: 18px; font-weight: 700; margin: 16px 0 0 0;">
          🥋 Nos vemos no tatame!
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center;">
      <p style="color: #64748B; font-size: 13px; font-weight: 600; margin: 0 0 4px 0;">
        Equipe ${schoolName}
      </p>
      <p style="color: #94A3B8; font-size: 11px; margin: 0;">
        Este e-mail foi enviado automaticamente. Por favor, não responda a esta mensagem.<br>
        © ${new Date().getFullYear()} ${schoolName} · Powered by SenseiSystem
      </p>
    </div>

  </div>
</body>
</html>`;
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
