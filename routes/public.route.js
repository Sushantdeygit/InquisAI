import express from 'express';
const router = express.Router();

import { getLiveInterviewCount } from '../controllers/public.controller.js';

router.route('/getLiveInterviewCount').get(getLiveInterviewCount);

export default router;
