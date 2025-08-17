// /models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface PaymentDetails {
  transactionId?: string;
  amount?: number;
  paymentDate?: Date;
  paymentMethod?: any; // full raw JSON allowed
}

export interface IUser extends Document {
  email: string;
  emailDomain?: string | null;
  name?: string;
  image?: string;
  gender?: "male" | "female" | "other" | null;
  preferredGender?: "male" | "female" | "other" | null;
  planType: "free" | "intercollege" | "gender";
  planExpiry?: Date | null;
  paymentDetails?: PaymentDetails; // last successful payment snapshot (optional)
  createdAt: Date;
  updatedAt: Date;
}

const PaymentDetailsSchema = new Schema<PaymentDetails>(
  {
    transactionId: { type: String },
    amount: { type: Number },
    paymentDate: { type: Date },
    paymentMethod: { type: Schema.Types.Mixed }, // allow any JSON
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true, index: true },
  emailDomain: { type: String, default: null, index: true },
  name: String,
  image: String,
  gender: { type: String, enum: ["male", "female", "other", null], default: null },
  preferredGender: { type: String, enum: ["male", "female", "other", null], default: null },
  planType: { type: String, enum: ["free", "intercollege", "gender"], default: "free" },
  planExpiry: { type: Date, default: null },
  paymentDetails: { type: PaymentDetailsSchema, default: undefined },
}, { timestamps: true });

UserSchema.pre("save", function (next) {
  if (this.email) {
    this.emailDomain = this.email.split("@")[1] || null;
  }

  const now = new Date();
  if (this.planType === "intercollege" || this.planType === "gender") {
    if (!this.planExpiry || this.planExpiry < now) {
      this.planExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  } else {
    this.planExpiry = null;
  }

  next();
});

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
