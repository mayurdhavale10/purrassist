import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: String,
  image: String,
  gender: { 
    type: String, 
    enum: ["male", "female", "other", null],
    default: null 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models?.User || mongoose.model("User", UserSchema);