import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
  {
    // The text of the question
    text: {
      type: String,
      required: [true, 'Please provide question text '],
    },
    // Expected Answer given by AI Model
    expectedAnswer: {
      type: String,
    },
    // Difficulty level of the question
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: [true, 'Please provide question level '],
    },
    // Main category of the question
    category: {
      type: String,
      required: [true, 'Please provide question category '],
    },
    // Additional categories the question belongs to
    subCategory: [{ type: String }],
    // Tags for additional classification
    tags: [{ type: String }],
    // S3 URL for lipsync data
    lipsyncFileKey: {
      type: String,
      maxlength: 1024
    },
    // S3 Key for audio file
    audioFileKey: {
      type: String,
      maxlength: 1024
    },
    // How many number of times a question has been asked
    asked: {
      type: Number,
      default: 0,
    },
    // Average score of all attempt
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model('Question', QuestionSchema);
export default Question;

// Fetching for later stage

// const questionId = mongoose.Types.ObjectId('your_question_id_here');
// SingleInterview.aggregate([
//   { $unwind: "$answers" }, // Unwind the answers array
//   { $match: { "answers.questionId": questionId } }, // Match responses for the specific question
//   {
//     $group: {
//       _id: "$answers.evaluation", // Group by evaluation
//       count: { $sum: 1 }, // Count the number of responses for each evaluation
//       averageScore: { $avg: "$answers.score" } // Calculate the average score for each evaluation
//     }
//   },
//   { $sort: { _id: 1 } } // Sort the results if needed
// ])
// .then(result => {
//   console.log(result);
// })
// .catch(error => {
//   console.error(error);
// });
