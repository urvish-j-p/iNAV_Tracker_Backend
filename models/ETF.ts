import mongoose from "mongoose";

interface IETF extends mongoose.Document {
  name: string;
  symbol: string;
  userId: mongoose.Types.ObjectId;
}

const etfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IETF>("ETF", etfSchema);
