import Feedback from "../models/feedback.model.js";

const createUserFeedback = async (data) => {
    const userFeedback = await Feedback.create(data);
    return userFeedback;
};

export { createUserFeedback }