import express from 'express';
const router = express.Router();

import { loginUser, registerUser, requestResetPassword, userExist } from '../controllers/auth.controller.js';

router.route('/login').post(loginUser);
router.route('/register').post(registerUser);
router.route('/userExist').post(userExist);
router.route('/requestResetPassword').post(requestResetPassword);

export default router;
