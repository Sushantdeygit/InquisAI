// activeInterview.service.js

import BadRequestError from '../errors/BadRequestError.js';
import ActiveInterview from '../models/activeInterview.model.js';

// Service to handle CRUD operations for active interviews
const ActiveInterviewService = {
    // Get All active interviews
    countActiveInterviews: async () => {
        const count = await ActiveInterview.countDocuments({});
        return count;
    },
    getAllActiveInterviews: async () => {
        const activeInterviews = await ActiveInterview.find({})
        return activeInterviews
    },
    // Add a new active interview
    addActiveInterview: async (interviewId, socketId, userId, category, subCategory) => {
        try {
            const activeInterview = await ActiveInterview.create({
                interviewId,
                socketId,
                userId,
                category,
                subCategory,
            });
            return activeInterview;
        } catch (error) {
            throw new BadRequestError(`Failed to add active interview: ${error.message}`);
        }
    },

    // Remove an active interview by interviewId
    removeActiveInterviewByInterviewId: async (interviewId) => {
        try {
            const deletedInterview = await ActiveInterview.deleteMany({ interviewId });
            return deletedInterview;
        } catch (error) {
            throw new BadRequestError(`Failed to remove active interview: ${error.message}`);
        }
    },

    // Find active interviews by interviewId
    findActiveInterviewsByInterviewId: async (interviewId) => {
        try {
            const activeInterviews = await ActiveInterview.findOne({ interviewId });
            return activeInterviews;
        } catch (error) {
            throw new BadRequestError(`Failed to find active interviews: ${error.message}`);
        }
    },

    // Find active interviews by socketId
    findActiveInterviewsBysocketId: async (socketId) => {
        try {
            const activeInterviews = await ActiveInterview.findOne({ socketId });
            return activeInterviews;
        } catch (error) {
            throw new BadRequestError(`Failed to find active interviews: ${error.message}`);
        }
    },

    resetActiveInterviews: async () => {
        try {
            await ActiveInterview.deleteMany({})
        } catch (error) {
            throw new BadRequestError(`Failed to find reset interviews: ${error.message}`);
        }
    }
};

export default ActiveInterviewService;
