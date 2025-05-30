import { EmailService } from "../services/email.service";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  try {
    await EmailService.sendEmail(
      "your-email@gmail.com", // Replace with your email
      "Test Email from Syllabus Buddy",
      `
        <h1>🎉 Test Email Success!</h1>
        <p>If you're reading this, your email service is working correctly.</p>
        <p>SendGrid API Key: ${
          process.env.SENDGRID_API_KEY ? "Set" : "Not Set"
        }</p>
        <p>From Email: ${process.env.FROM_EMAIL}</p>
      `
    );
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Email failed:", error);
  }
}

testEmail();
