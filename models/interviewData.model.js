import mongoose from 'mongoose';

const InterviewDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide userId'],
    },
    totalInterviews: {
      type: Number,
      default: 0,
    },
    onGoingInterview: {
      type: Boolean,
      default: false
    },
    onGoingInterviewDetails: {
      type: [],
      default: []
    },
    interviewsCompleted: {
      type: Number,
      default: 0
    },
    interviewsCancelled: {
      type: Number,
      default: 0
    },
    interviewCredits: {
      type: Number,
      default: 5
    },
    answeredQuestionIds: {
      type: Array,
      default: []
    }
  },
  { timestamps: true }
);

const InterviewData = mongoose.model('InterviewData', InterviewDataSchema);
export default InterviewData;
