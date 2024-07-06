import express from 'express';
const router = express.Router();

import { getAllInterviews, checkLatestInterviewData, startInterview, postAnswerFile, endInterview } from '../controllers/interview.controller.js';

router.route('/').get(getAllInterviews);
router.route('/checkLatestInterviewData').get(checkLatestInterviewData);
router.route('/startInterview').post(startInterview);
router.route('/endInterview').post(endInterview);
router.route('/postAnswerFile').post(postAnswerFile);

export default router;
