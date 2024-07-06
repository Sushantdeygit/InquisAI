import { fetchAudioBufferFromS3, fetchObjectFromS3 } from '../AWS/S3.AWS.js';
import BadRequestError from '../errors/BadRequestError.js';
import Question from '../models/question.model.js';

const fetchQuestionByIDService = async (id) => {
  const question = await Question.findById(id);
  return question;
};

// Update question by id
const updateQuestionByIDService = async ({ questionId, data }) => {
  const question = await Question.findByIdAndUpdate({ _id: questionId }, data, { runValidators: true, new: true });
  console.log(question)
  return question;
};

const fetchManyQuestionByIDsService = async (questionIDArray) => {
  if (!Array.isArray(questionIDArray)) {
    throw new BadRequestError('Please provide an array of question Ids');
  }
  const questions = await Question.find({ _id: { $in: questionIDArray } });
  return questions;
};

// Random Questions
const fetchInterviewQuestionsFromDbService = async ({ level, category, subCategory, numberOfQuestions, excludedIds }) => {
  const questions = await Question.aggregate([
    {
      $match: {
        level,
        category,
        subCategory: { $in: subCategory },
        _id: { $nin: excludedIds }
      }
    },
    { $sample: { size: numberOfQuestions } }
  ]);
  return questions;
};

// For Serial questions 
// const fetchInterviewQuestionsFromDbService = async ({ level, category, subCategory, numberOfQuestions }) => {
//   const questions = await Question.find({
//     level,
//     category,
//     subCategory: { $in: subCategory },
//   }).limit(numberOfQuestions);
//   return questions;
// };



const filterQuestionDetails = (item) => {
  const { _id, text, asked, score, averageScore, lipsyncFileKey, audioFileKey } = item
  return {
    questionId: _id,
    question: text,
    asked,
    score,
    averageScore,
    lipsyncFileKey,
    audioFileKey
  };
};

const addQuestionToDBService = async ({
  text,
  expectedAnswer,
  level,
  category,
  subCategory,
  tags,
  lipsyncDataKey,
  audioFileKey,
}) => {
  try {
    const question = await Question.create({
      text,
      expectedAnswer,
      level,
      category,
      subCategory,
      tags,
      lipsyncDataKey,
      audioFileKey,
    });
    return question;
  } catch (error) {
    console.log(error);
  }
};



export {
  fetchQuestionByIDService,
  updateQuestionByIDService,
  fetchManyQuestionByIDsService,
  addQuestionToDBService,
  filterQuestionDetails,
  fetchInterviewQuestionsFromDbService,
};
