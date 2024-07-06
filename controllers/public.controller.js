
import ActiveInterviewService from '../services/activeInterview.service.js';

const getLiveInterviewCount = async () => {
  const liveInterviewCount = await ActiveInterviewService.countActiveInterviews()
  return liveInterviewCount
}

export { getLiveInterviewCount };
