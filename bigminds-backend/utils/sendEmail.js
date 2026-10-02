const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // Check if email configuration exists
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("Email configuration missing. Email will not be sent.");
      return {
        success: false,
        error: "Email configuration not set",
        message: "Email service is not configured. Please contact administrator.",
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    await transporter.verify();

    // Define email options
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send email. Please try again later or contact support.",
    };
  }
};

module.exports = sendEmail; 