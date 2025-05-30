import sgMail from "@sendgrid/mail";

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
}
