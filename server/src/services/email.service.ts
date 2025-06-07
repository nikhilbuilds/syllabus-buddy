import sgMail from "@sendgrid/mail";
import { QuizLevel } from "../constants/quiz";
import nodemailer from "nodemailer";

export class EmailService {
  static {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
  }

  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  private static getEmailTemplate(
    subject: string,
    content: string,
    buttonText?: string,
    buttonUrl?: string
  ) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007AFF;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            <div class="content">
              ${content}
              ${
                buttonText && buttonUrl
                  ? `<div style="text-align: center;">
                      <a href="${buttonUrl}" class="button">${buttonText}</a>
                    </div>

                    <p>Alternative link: <a href="${buttonUrl}">${buttonUrl}</a></p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>

                    <p>Best regards,</p>
                    <p>The Syllabus Buddy Team</p>
                    `
                  : ""
              }
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

      const msg = {
        to,
        from: "explorewithastrobot@gmail.com",
        subject,
        html,
      };

      console.log("Sending email:", msg);
      await sgMail.send(msg);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.log("Error sending email:", JSON.stringify(error));
      console.error("Error sending email:", error);
      throw error;
    }
  }

  static async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string
  ): Promise<void> {
    const subject = "Verify Your Email - Welcome to StudyApp!";

    // Create the verification link that goes to web first, then redirects to app
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to StudyApp, ${name}!</h2>
        
        <p>Thank you for signing up. To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>

        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>

        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Best regards,<br>
          The StudyApp Team
        </p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  static async sendQuizReadyEmail(
    email: string,
    name: string,
    syllabusId: string,
    level?: QuizLevel
  ): Promise<void> {
    const subject = "Your Quiz is Ready! ";
    const levelText = level ? `for the ${level.toLowerCase()} level` : "";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to StudyApp, ${name}!</h2>
        <p>Your quiz ${levelText} is ready to be taken. Click the button below to start:</p>
        <a href="${process.env.APP_URL}/quiz/${syllabusId}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Start Quiz
        </a>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  static async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.APP_URL}reset-password?token=${resetToken}`;
    const subject = "Reset Your Password";
    const content = `
      <p>Hello ${name},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    const html = this.getEmailTemplate(
      subject,
      content,
      "Reset Password",
      resetUrl
    );

    // const text = `Hello ${name},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nThis link will expire in 1 hour.`;

    await this.sendEmail(to, subject, html);
  }
}
