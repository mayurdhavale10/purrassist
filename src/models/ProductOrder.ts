// /models/ProductOrder.ts
import mongoose, { Schema, type InferSchemaType, Model } from "mongoose";

const paymentHistorySchema = new Schema(
  {
    transactionId: { type: String, index: true },
    amount: Number,
    paymentTime: Date,
    paymentMethod: String, // card/upi/netbanking, etc.
    status: String,        // SUCCESS | FAILED | USER_DROPPED | ...
  },
  { _id: false }
);

const productOrderSchema = new Schema(
  {
    orderId: { type: String, unique: true, index: true }, // your order_id
    cfOrderId: { type: String, index: true },             // Cashfree cf_order_id (numeric / string)
    userId: { type: String, index: true },

    customerEmail: { type: String, index: true },
    customerPhone: String,

    amount: Number,
    currency: { type: String, default: "INR" },

    status: { type: String, default: "INIT", index: true },           // INIT | ACTIVE | PAID | FAILED | CANCELLED
    paymentStatus: { type: String, default: "PENDING", index: true }, // PENDING | SUCCESS | FAILED

    // Optional plan purchase metadata
    items: [
      {
        productId: String,
        name: String,
        qty: Number,
        price: Number,
      },
    ],

    paymentHistory: [paymentHistorySchema],

    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

productOrderSchema.index({ orderId: 1, "paymentHistory.transactionId": 1 });

export type ProductOrderDoc = InferSchemaType<typeof productOrderSchema>;

export default (mongoose.models.ProductOrder as Model<ProductOrderDoc>) ||
  mongoose.model<ProductOrderDoc>("ProductOrder", productOrderSchema);