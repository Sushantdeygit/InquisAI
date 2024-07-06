import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      required: [true, "Please provide userId."],
      ref: "User"
    },
    interviewId: {
      type: mongoose.Schema.ObjectId,
      required: [true, "Please provide interviewId."],
      ref: "Interview"
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    relevancyRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    suggestions: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create a model from the schema
const Feedback = mongoose.model("Feedback", FeedbackSchema);

export default Feedback;
