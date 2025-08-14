import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  name: String,
  image: String
});

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
