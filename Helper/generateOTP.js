import Users from "../models/User.js";

export const generateOTP = async () => {
  let otpLength = 6; 
  let otp = generateRandomOTP(otpLength);

  const users = await Users.find({});

  let existingOtpCodes = [];
  users.forEach(user => {
    user.otp.forEach(otpEntry => {
      existingOtpCodes.push(otpEntry.code);
    });
  });

  while (existingOtpCodes.includes(otp.toString())) {
    if (existingOtpCodes.length >= Math.pow(10, otpLength) - 1) {
      otpLength++; 
    }
    otp = generateRandomOTP(otpLength); 
  }

  return otp.toString();
};

// generate a random OTP of a given length
const generateRandomOTP = (length) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};

  