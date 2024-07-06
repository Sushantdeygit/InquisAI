
import mongoose from 'mongoose';


const ActiveInterviewSchema = new mongoose.Schema({
    interviewId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Interview', // Reference to the Interview model
        required: true,
    },
    socketId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    subCategory: {
        type: Array,
        required: true,
    },
    status: {
        type: String,
        default: 'Active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create model for active interviews
const ActiveInterview = mongoose.model('ActiveInterview', ActiveInterviewSchema);

export default ActiveInterview;
