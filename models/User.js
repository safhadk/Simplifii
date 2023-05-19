import mongoose from "mongoose";
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: { type: String, unique: true, trim: true },
    otp: [{
        code: { type: String, required: true },
        created_at: { type: Date, required: true, default: Date.now },
        expires_at: { type: Date, required: true },
    }],
    blockedUntil: { type: Date },
    attempts: { type: Number, default: 0 },
})

const Users = mongoose.model("Users", UserSchema);
export default Users;