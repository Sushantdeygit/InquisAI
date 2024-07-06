// Import dependencies
import 'express-async-errors';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import morgan from 'morgan';
import rateLimiter from 'express-rate-limit';
import compression from 'compression';
import http from 'http';

// Import middleware
import errorHandlerMiddleware from "./middleware/error-handler.middleware.js";
import notFoundMiddleware from "./middleware/not-found.middleware.js";
import authMiddleware from "./middleware/auth.middleware.js";
import totalRequests from "./middleware/totalRequests.middleware.js";
import calculateResponseSize from "./middleware/calculateResponseSize.middleware.js";

// Import routes
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import publicRoute from "./routes/public.route.js";
import interviewRoute from "./routes/interview.route.js";
import feedbackRoute from "./routes/feedback.route.js";

// Other imports
import { MONGO_URI, PORT, ENV } from './config/globals.config.js';
import { globalCorsOptions } from './config/server.config.js';
import { getBaseDirname } from './utils/system/index.js';
import { imageFilter } from './utils/multer/multerImageFilter.js'; // Filter function for multer
import initializeSocket from './sockets/index.js';
import connect from "./config/db.config.js";
import ActiveInterview from './models/activeInterview.model.js';
import { clearActiveInterviewsService } from './services/interview.service.js';

// Create Express app
const app = express();
const server = http.createServer(app);


// Middleware setup
app.use(compression());
app.use(express.json());
app.use(bodyParser.json({ limit: '5mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(helmet());
app.use(cors(globalCorsOptions));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('tiny'));
app.use(rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 4000,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(calculateResponseSize);
app.use(totalRequests);

// Initialize socket server
initializeSocket(server);

// Static assets
const baseDir = getBaseDirname();
app.use('/api/v1/assets', express.static(path.join(baseDir, 'public/assets')));

// Multer config
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/assets"); // Destination directory for disk storage
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9); // Generate unique filename
    cb(null, uniqueSuffix + file.originalname); // Set filename
  },
});
// Disk storage for answers
const diskUpload = multer({ storage: diskStorage }); // Multer middleware for disk storage
// Memory storage for images
const memoryUpload = multer({ // Multer middleware for memory storage
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB in bytes
  fileFilter: imageFilter, // Filter function for file types
});

// Route definitions
app.get("/", (req, res) => {
  res.send("<h1>Server Working</h1>");
});
app.use("/api/v1/public", publicRoute);
app.use("/api/v1/auth", memoryUpload.single("picture"), authRoute);
app.use("/api/v1/user", memoryUpload.single("picture"), authMiddleware, userRoute);
app.use("/api/v1", authMiddleware, feedbackRoute);
app.use("/api/v1/interview", diskUpload.single("audio"), authMiddleware, interviewRoute);

// Error handling middleware
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

// Start server
server.listen(PORT, async () => {
  try {
    await connect(MONGO_URI);
    clearActiveInterviewsService()
    console.log(`Server listening at http://localhost:${PORT} :: ${ENV}`);
  } catch (error) {
    console.log(error);
  }
});
