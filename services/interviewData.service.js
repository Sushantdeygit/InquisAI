import InterviewData from '../models/interviewData.model.js';

const userInterviewDataExistsService = async (userId) => {
  const interviewData = await InterviewData.findOne({ userId });
  return interviewData ? interviewData : false;
};

const createAndReturnNewInterviewDataDocument = async (userId) => {
  const interviewData = await InterviewData.create({ userId });
  return interviewData;
};

const updateInterviewDataByIdService = async ({ interviewDataId, data }) => {
  const interviewData = await InterviewData.findByIdAndUpdate({ _id: interviewDataId }, data, { runValidators: true, new: true });
  return interviewData;
};


const incrementTotalInterviewDataService = async (userId) => {
  const interviewData = await InterviewData.findOneAndUpdate({ userId }, { $inc: { totalInterviews: 1 } });
  return interviewData;
};

export { createAndReturnNewInterviewDataDocument, updateInterviewDataByIdService, userInterviewDataExistsService, incrementTotalInterviewDataService };
