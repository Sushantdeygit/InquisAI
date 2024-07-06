import { JWT_SECRET } from '../config/globals.config.js';
import { UnauthenticatedError } from '../errors/index.js';
import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new UnauthenticatedError("No auth/Doesn't start with Bearer");
  }
  const token = authorization.split(' ')[1];

  try {
    const isAuth = jwt.verify(token, JWT_SECRET);
    req.body.userId = isAuth.id;
    next();
  } catch (error) {
    throw new UnauthenticatedError('Token verification error');
  }
};

export default authMiddleware;
