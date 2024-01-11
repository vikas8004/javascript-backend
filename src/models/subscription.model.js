import mongoose, { Schema, Schmea, model } from "mongoose";

const subscriptionSchema = new Schmea(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Subscription = model("Subscription", subscriptionSchema);
export default Subscription;
