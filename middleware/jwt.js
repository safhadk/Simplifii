import jwt from "jsonwebtoken";

export const generateToken = (email) => {
    const jwtSecretKey = process.env.JWT_SECRET;
    const token = jwt.sign({ email, role: 'user' }, jwtSecretKey, { expiresIn: '1h' });
    return token;
};

