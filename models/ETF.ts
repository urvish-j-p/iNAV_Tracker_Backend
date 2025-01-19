import mongoose from "mongoose";

interface IETF extends mongoose.Document {
  name: string;
  link: string;
  userId: mongoose.Types.ObjectId;
}

const etfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    link: {
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
