// Add this function to your existing services/emailService.js file

// Send forgot password email
export const sendForgotPasswordEmail = async (email, otp, name) => {
  const mailOptions = {
    from: {
      name: "KinderKares Baby Blink",
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: "🔐 Reset Your Baby Blink Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff6b6b; margin: 0;">Password Reset Request 🔐</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0 0 20px 0;">Reset Your Password</h2>
          <p style="margin: 0; font-size: 16px;">Hi ${name}!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
            You requested to reset your password for your Baby Blink account. Use the verification code below to proceed:
          </p>
          
          <div style="background: white; padding: 25px; text-align: center; margin: 25px 0; border-radius: 10px; border: 3px solid #ff6b6b;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">PASSWORD RESET CODE</p>
            <h1 style="color: #ff6b6b; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⏰ <strong>This code will expire in 15 minutes.</strong>
            </p>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24; font-size: 14px;">
              🚨 <strong>If you didn't request this password reset, please ignore this email.</strong>
            </p>
          </div>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated email from KinderKares Baby Blink.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `
Password Reset Request

Hi ${name},

You requested to reset your password for your Baby Blink account.

Your password reset code is: ${otp}

This code will expire in 15 minutes.

If you didn't request this password reset, please ignore this email.

---
KinderKares Baby Blink System
    `
  };

  return await sendEmailWithRetry(mailOptions);
};