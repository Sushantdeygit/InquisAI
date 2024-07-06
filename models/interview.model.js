import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide userId'],
    },
    level: {
      type: String,
      required: [true, 'Please provide level.'],
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    techImage: {
      type: String,
      required: [true, 'Please provide techImage.'],
      maxlength: 500,
    },
    // Main category of the interview
    category: {
      type: String,
      required: [true, 'Please provide interview category '],
    },
    // Additional categories the interview belongs to
    subCategory: {
      type: [{ type: String }],
      required: [true, 'Please provide interview category '],
    },
    numberOfQuestions: {
      type: Number,
      required: [true, 'Please provide number of Questions.'],
    },
    currentQuestion: {
      type: Number,
      default: 0,
    },
    intervieweeName: {
      type: String,
      required: [true, 'Please provide Interviewee Name.'],
      minlength: 2,
      maxlength: 100,
    },
    interviewerName: {
      type: String,
      // required: [true, 'Please provide Interviewer Name.'],
      minlength: 2,
      maxlength: 100,
    },
    interruptionCount: {
      type: Number,
      default: 0,
    },
    profanityCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Completed', 'Cancelled'],
      default: 'Pending', // Default to 'Pending'
    },
    cancelReason: {
      type: String,
    },
    evaluationPercentage: {
      type: Number,
      default: 0,
    },
    advice: {
      type: String,
      maxlength: 1000,
    },
    health: {
      type: String,
      required: [true, 'Please provide interview health.'],
      enum: ['Healthy', 'Fair', 'Poor', 'Critical', 'Cancelled'],
      default: 'Healthy',
    },
    feedbackByUser: {
      type: Boolean,
      default: false
    },
    interviewDetails: [
      {
        _id: false,
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        answer: {
          type: String,
          minlength: 2,
          maxlength: 2000,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        feedback: {
          type: String,
        },
        question: {
          type: String,
        },
        asked: {
          type: Number,
          default: 0,
        },
        averageScore: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        lipsyncFileKey: {
          type: String,
          maxlength: 1024
        },
        audioFileKey: {
          type: String,
          maxlength: 1024
        },
        clarity: {
          score: {
            type: Number,
            min: 0,
            max: 10
          },
        },
        accuracy: {
          score: {
            type: Number,
            min: 0,
            max: 10
          },

        },
        completeness: {
          score: {
            type: Number,
            min: 0,
            max: 10
          },

        },
        relevance: {
          score: {
            type: Number,
            min: 0,
            max: 10
          },

        },
        communication: {
          score: {
            type: Number,
            min: 0,
            max: 10
          },
        },
      },
    ],
  },
  { timestamps: true }
);

const Interview = mongoose.model('Interview', InterviewSchema);
export default Interview;
