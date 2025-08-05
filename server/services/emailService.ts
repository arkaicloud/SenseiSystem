
import nodemailer from 'nodemailer';
import { storage } from '../storage';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuração básica do nodemailer - pode ser personalizada pela escola
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
    try {
      // Buscar configurações da escola para personalização
      const schoolConfig = await storage.getSchoolConfig();
      const schoolName = schoolConfig?.schoolName || 'SenseiSystem';
      
      // URL base do sistema
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"${schoolName}" <noreply@senseisystem.com.br>`,
        to: userEmail,
        subject: `${schoolName} - Redefinição de Senha`,
        html: this.getPasswordResetEmailTemplate(userName, schoolName, resetUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
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
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Configuração de e-mail inválida:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
