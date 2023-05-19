import nodemailer from 'nodemailer'

export const sendOTPEmail = async (email, otp) => {
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.email,
        pass: process.env.password,
      },
    });

    const mailOptions = {
      from: process.env.email,
      to: email,
      subject: 'Your OTP for logging in',
      text: `Your OTP is ${otp}. Please enter this code to proceed with logging in.`
    }
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(`Error sending OTP: ${err.message}`);
    return res.status(err.status || 500).send('Internal Server Error');
  }
}