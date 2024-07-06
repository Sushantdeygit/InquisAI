import { BadRequestError } from "../errors/index.js";
import { updateInterviewByIdService } from "../services/interview.service.js";
import { createUserFeedback } from "../services/feedback.service.js";

const getFeedback = async (req, res) => {
  const { overallRating, relevancyRating, interviewId } = req.body;
  if (!overallRating || !relevancyRating) {
    throw new BadRequestError(
      "Missing required fields: overallRating, relevancyRating"
    );
  }

  // Create user feedback
  const userFeedback = await createUserFeedback(req.body)

  // Update interviewData
  const interviewData = {
    feedbackByUser: true
  }
  const updatedInterview = await updateInterviewByIdService({ interviewId, data: interviewData })

  res.status(201).json({
    msg: "Feedback saved successfully",
    data: userFeedback,
    success: true,
    interview: updatedInterview
  });

};

export { getFeedback };
