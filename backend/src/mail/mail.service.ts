import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendCredentials(
    email: string,
    fullName: string,
    password: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"CRM System" <${this.config.get('SMTP_FROM')}>`,
      to: email,
      subject: 'Your CRM Account Credentials',
      html: `
        <h2>Salom, ${fullName}!</h2>
        <p>CRM tizimiga xush kelibsiz. Quyidagi ma'lumotlar bilan tizimga kirishingiz mumkin:</p>
        <table style="border-collapse:collapse;">
          <tr>
            <td style="padding:8px;font-weight:bold;">Login (Email):</td>
            <td style="padding:8px;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px;font-weight:bold;">Parol:</td>
            <td style="padding:8px;font-family:monospace;font-size:16px;">${password}</td>
          </tr>
        </table>
        <p style="color:red;">Iltimos, parolingizni hech kimga bermang va tizimga kirgandan so'ng o'zgartiring.</p>
      `,
    });
  }

  async sendResetPasswordEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"CRM System" <${this.config.get('SMTP_FROM')}>`,
      to: email,
      subject: 'Parolni tiklash',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;">
          <h2 style="color:#1e1b4b;margin-bottom:8px;">Salom, ${fullName}!</h2>
          <p style="color:#475569;margin-bottom:24px;">Parolni tiklash so'rovingiz qabul qilindi. Quyidagi tugmani bosib yangi parol o'rnating:</p>

          <a href="${resetLink}"
            style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
            Parolni tiklash
          </a>

          <p style="color:#64748b;font-size:13px;margin-top:24px;">
            Yoki quyidagi havolani brauzeringizga ko'chirib yapish:
          </p>
          <div style="background:#f1f5f9;padding:12px;border-radius:6px;word-break:break-all;font-size:12px;color:#4f46e5;">
            ${resetLink}
          </div>

          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            Havola <strong>15 daqiqa</strong> davomida amal qiladi.
          </p>
          <p style="color:red;font-size:12px;">
            Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.
          </p>
        </div>
      `,
    });
  }
}
