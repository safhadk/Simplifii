import Users from "../models/User.js";
import { generateOTP } from "../Helper/generateOTP.js";
import { sendOTPEmail } from "../Helper/sendOTPEmail.js";
import { generateToken } from "../middleware/jwt.js";

// generate OTP API

export const OTP = async (req, res) => {
    try {
        const { email } = req.body;
        // Check if user exists
        const user = await Users.findOne({ email });

        // Return a message if no user found
        if (!user) return res.status(404).json({ message: 'Invalid Email' });

        const currentDateTime = new Date();
        const oneMinuteAgo = new Date(currentDateTime.getTime() - 1 * 60 * 1000);

        // Check time gap between OTP requests
        const { otp } = user
        const lastOtp = otp?.[otp.length - 1];
        if (lastOtp?.created_at > oneMinuteAgo) {
            return res.status(429).json({ message: 'Please wait for 1 minute before requesting a new OTP' });
        }

        // Check if the user is blocked
        const { attempts, blockedUntil } = user
        if (attempts >= 5 && blockedUntil > currentDateTime) {
            const remainingTime = Math.ceil((blockedUntil - currentDateTime) / (60 * 1000));
            return res.status(401).json({ message: `Account blocked. Please try again after ${remainingTime} minutes` });
        }

        // Generate OTP
        const OTP = await generateOTP();
        console.log(OTP,"yes")
        const expiration = new Date(currentDateTime.getTime() + 5 * 60 * 1000);
        const otpData = { code: OTP, created_at: currentDateTime, expires_at: expiration };

        // Add OTP to db
        user.otp?.push(otpData);
        await user.save();

        // Send OTP to user via mail
       
        await sendOTPEmail(email, OTP)
        return res.status(200).json({ message: 'OTP generated successfully' });
    } catch (err) {
        console.error(`Error in generateOTP: ${err.message}`);
        return res.status(err.status || 500).send('Internal Server Error');
    }
}

//Login API

export const login = async (req, res) => {
    try {
        const { email, otp } = req.body;
        // Check if user exists
        const user = await Users.findOne({ email });
        // Return a message if no user found
        if (!user) return res.status(404).json({ message: 'Invalid Email' });
        const currentDateTime = new Date();

        // Check if OTP is valid
        const { code, expires_at } = user?.otp?.[user.otp.length - 1] ?? {};
        const validOtp = code === otp && expires_at > currentDateTime;
        if (user.blockedUntil && user.blockedUntil > currentDateTime) {
            // User is still blocked
            const remainingMinutes = Math.ceil((user.blockedUntil.getTime() - currentDateTime.getTime()) / (60 * 1000));
            return res.status(401).json({ message: `Account Blocked Due to Too many invalid attempts. Please try again after ${remainingMinutes} minutes.` });
        } else if (user.blockedUntil && user.blockedUntil <= currentDateTime) {
            // Unblock the user
            user.attempts = 0;
            user.blockedUntil = null;
            await user.save();
        } else if (user.attempts === 5) {
            const blockTimeInHours = 1; // block time hours (1 hour)
            const blockedUntil = new Date(currentDateTime.getTime() + blockTimeInHours * 60 * 60 * 1000);
            // Block the user for 1 hour
            user.blockedUntil = blockedUntil;
            await user.save();
            return res.status(401).json({ message: `Account Blocked Due to Too many invalid attempts. Please try again after 1 hour` });
        }

        if (validOtp) {
            // Reset the attempts count and expire the used otp
            user.attempts = 0;
            user.otp[user.otp.length - 1].expires_at = new Date();
            await user.save();
            //Generate JWT token
            const token = generateToken(email);
            //send JWT token to user
            return res.status(200).json({ message: 'Login Successfull', token: token });
        } else {
            // Check if OTP is expired
            const expiredOtp = user.otp.some(otpObj => otpObj.code === otp && otpObj.expires_at < currentDateTime);
            if (expiredOtp) {
                if (user.attempts === 5) {
                    user.blockedUntil = new Date(currentDateTime.getTime() + 60 * 60 * 1000);
                    await user.save();
                } else {
                    // Expired OTP
                    user.attempts += 1;
                    await user.save();
                    return res.status(401).json({ message: 'OTP Expired' });
                }
            } else {
                //Invalid OTP
                user.attempts += 1;
                await user.save();
                return res.status(400).json({ message: 'Invalid OTP' });
            }
        }
    } catch (err) {
        console.error(`Error in login: ${err.message}`);
        return res.status(err.status || 500).send('Internal Server Error');
    }
};
