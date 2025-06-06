import sgMail from "@sendgrid/mail";
import { QuizLevel } from "../constants/quiz";

export class EmailService {
  static {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
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
}
