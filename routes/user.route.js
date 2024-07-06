import express from 'express';
const router = express.Router();

import { getUser, deleteUser, updateUser, resetUserPassword, checkLatestUser } from '../controllers/user.controller.js';

router.route('/').get(getUser).patch(updateUser).delete(deleteUser);
router.route('/checkLatestUser').get(checkLatestUser)
router.route('/resetPassword').post(resetUserPassword);

export default router;
