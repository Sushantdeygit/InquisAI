import Interview from '../models/interview.model.js';
import ActiveInterviewService from './activeInterview.service.js';

const createInterviewService = async ({ userId, level, category, subCategory, numberOfQuestions, intervieweeName, interviewDetails, techImage, }) => {
  const interview = await Interview.create({ userId, level, category, subCategory, numberOfQuestions, intervieweeName, interviewDetails, techImage, });
  return interview;
};

const fetchInterviewsByUserIdService = async (userId) => {
  const interviews = await Interview.find({ userId });
  return interviews ? interviews : null;
};

const fetchInterviewByIdService = async (interviewId) => {
  const interview = await Interview.findById({ _id: interviewId });
  return interview ? interview : null;
};
const getInterviewStatusByIdService = async (interviewId) => {
  const interviewStatus = await Interview.findById({ _id: interviewId }).select('status');
  return interviewStatus
};
const updateInterviewByIdService = async ({ interviewId, data }) => {
  const interview = await Interview.findByIdAndUpdate({ _id: interviewId }, data, { runValidators: true, new: true });
  return interview ? interview : null;
};

const formatInterviewDetailsPreEvaluationService = (interviewDetails) => {
  let interviewDetailsText = ''; // Initialize as an empty string

  interviewDetails.forEach((element, i) => {
    const { question, answer } = element;
    // Update interviewDetailsText by concatenating each question and answer
    interviewDetailsText += `\nQuestion ${i + 1}: ${question}\n`;
    interviewDetailsText += `Answer number ${i + 1} by candidate: ${answer}\n`;
  });

  return interviewDetailsText;
};


const clearActiveInterviewsService = async () => {
  const activeInterviews = await ActiveInterviewService.getAllActiveInterviews()
  if (activeInterviews.length > 0) {
    console.log(`Found ${activeInterviews.length} active interviews clearing.`)
    const activeInterviewIds = activeInterviews.map(item => item.interviewId)
    await Interview.updateMany({ _id: { $in: activeInterviewIds } }, { status: "Pending" });
    await ActiveInterviewService.resetActiveInterviews()
    console.log(`Cleared ${activeInterviews.length} active interview(s).`)
  } else {
    console.log("No active interviews found!")
  }
}

const reduceInterviewHealthService = (health) => {
  switch (health) {
    case 'Healthy':
      return 'Fair';
    case 'Fair':
      return 'Poor';
    case 'Poor':
      return 'Critical';
    case 'Critical':
      return 'Cancelled';
    default:
      return 'Healthy';
  }
};



export {
  createInterviewService,
  fetchInterviewByIdService,
  getInterviewStatusByIdService,
  fetchInterviewsByUserIdService,
  updateInterviewByIdService,
  reduceInterviewHealthService,
  formatInterviewDetailsPreEvaluationService,
  clearActiveInterviewsService
};
