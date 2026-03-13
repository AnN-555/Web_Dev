import mongoose from "mongoose";

const paymentItemSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    priceAtPurchase: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["vnpay"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    items: {
      type: [paymentItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number, // VND
      required: true,
      min: 0,
    },
    providerTxnRef: {
      type: String,
    },
    providerTransactionNo: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;

