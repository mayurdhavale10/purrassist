import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  emailDomain?: string | null;
  name?: string;
  image?: string;
  gender?: "male" | "female" | "other" | null;
  preferredGender?: "male" | "female" | "other" | null;
  planType: "free" | "intercollege" | "gender";
  planExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  emailDomain: { type: String, default: null },
  name: String,
  image: String,
  gender: { 
    type: String, 
    enum: ["male", "female", "other", null],
    default: null 
  },
  preferredGender: { 
    type: String,
    enum: ["male", "female", "other", null],
    default: null
  },
  planType: {
    type: String,
    enum: ["free", "intercollege", "gender"],
    default: "free"
  },
  planExpiry: { type: Date, default: null }, // Now nullable
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre("save", function (next) {
  if (this.email) {
    this.emailDomain = this.email.split("@")[1] || null;
  }

  if (this.planType === "intercollege" || this.planType === "gender") {
    const now = new Date();
    if (!this.planExpiry || this.planExpiry < now) {
      this.planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  } else {
    this.planExpiry = null;
  }

  this.updatedAt = new Date();
  next();
});

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
