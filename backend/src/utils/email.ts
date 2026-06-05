import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const FROM = process.env.EMAIL_FROM || 'BridgeChat <noreply@bridgechat.app>';

export const sendVerificationEmail = async (to: string, code: string) => {
  try {
    await transporter.sendMail({
      from: FROM, to,
      subject: 'Verify your BridgeChat account',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;background:#0A0A0F;color:#fff;padding:40px;border-radius:16px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#6C63FF;font-size:28px;margin:0">Bridge<span style="color:#FF6584">Chat</span></h1>
          </div>
          <h2 style="font-size:22px;margin-bottom:8px">Verify your email</h2>
          <p style="color:#9CA3AF;margin-bottom:32px">Enter this code in the app to verify your account:</p>
          <div style="background:#1A1A2E;border:2px solid #6C63FF;border-radius:12px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:8px;color:#6C63FF">${code}</div>
          <p style="color:#6B7280;font-size:13px;margin-top:24px;text-align:center">This code expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>`,
    });
  } catch (err) { logger.error('Email send error:', err); }
};

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
  try {
    await transporter.sendMail({
      from: FROM, to,
      subject: 'Reset your BridgeChat password',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;background:#0A0A0F;color:#fff;padding:40px;border-radius:16px">
          <h1 style="color:#6C63FF">Bridge<span style="color:#FF6584">Chat</span></h1>
          <h2>Reset your password</h2>
          <p style="color:#9CA3AF">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6C63FF,#FF6584);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;margin:24px 0">Reset Password</a>
          <p style="color:#6B7280;font-size:13px">If you didn't request a password reset, please ignore this email.</p>
        </div>`,
    });
  } catch (err) { logger.error('Email send error:', err); }
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  try {
    await transporter.sendMail({
      from: FROM, to,
      subject: `Welcome to BridgeChat, ${name}!`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;background:#0A0A0F;color:#fff;padding:40px;border-radius:16px">
          <h1 style="color:#6C63FF">Bridge<span style="color:#FF6584">Chat</span></h1>
          <h2>Welcome, ${name}! 🎉</h2>
          <p style="color:#9CA3AF">You're now part of BridgeChat — connect with people around you, discover nearby users, and chat securely.</p>
          <div style="background:#1A1A2E;border-radius:12px;padding:20px;margin:24px 0">
            <p style="margin:8px 0;color:#9CA3AF">✅ Set up your profile</p>
            <p style="margin:8px 0;color:#9CA3AF">🔍 Discover nearby users</p>
            <p style="margin:8px 0;color:#9CA3AF">💬 Start chatting securely</p>
            <p style="margin:8px 0;color:#9CA3AF">📞 Make HD voice & video calls</p>
          </div>
        </div>`,
    });
  } catch (err) { logger.error('Email send error:', err); }
};
