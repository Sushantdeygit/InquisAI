import { generateS3PreSignedUrl } from "../AWS/S3.AWS.js";
import { AWS_REGION, AWS_S3_BUCKET_NAME } from "../config/globals.config.js";
import ActiveInterviewService from "../services/activeInterview.service.js";
import { fetchInterviewByIdService, getInterviewStatusByIdService, updateInterviewByIdService } from "../services/interview.service.js";
import { updateInterviewDataByIdService, userInterviewDataExistsService } from "../services/interviewData.service.js";

export default function handleInterviews(io) {
    const socketToInterviewMap = new Map();

    // Handle interview-related socket events
    io.on('connection', (socket) => {

        console.log('User connected for interview');

        // User asks for interview status
        socket.on('interview:status', async (interviewId) => {
            // Get interview status
            // socketToInterviewMap.set(socket.id, interviewId);

            const interviewStatus = await getInterviewStatusByIdService(interviewId)
            console.log(`Interview status checked for interview ${interviewId}: ${interviewStatus}`);
            // Emit the status
            io.to(socket.id).emit('interview:status', interviewStatus);

        })

        // User asks to start interview
        socket.on('interview:start', async (interviewId) => {
            console.log(`User requested to start interview: ${interviewId}`);

            const interview = await fetchInterviewByIdService(interviewId);
            const { interruptionCount, userId, category, subCategory, createdAt } = interview

            // Perform health checks
            console.log(`Performing health checks for interview ${interviewId}, status: ${interview.status}`);
            const interviewDuration = (new Date() - new Date(createdAt)) / (1000 * 60 * 60); // Calculate duration in hours
            if (interviewDuration > 1) {
                // Cancel Interview if duration exceeds 1.5 hours
                const interviewData = await userInterviewDataExistsService(userId);
                const { onGoingInterviewDetails } = interviewData;
                // update interviewData
                const interviewsData = {
                    $pull: { onGoingInterviewDetails: { category, subCategory: { $in: subCategory } }, },
                    onGoingInterview: onGoingInterviewDetails.length === 1 ? false : true,
                    $inc: { interviewsCancelled: 1, },
                };
                // update interview
                const cancelData = {
                    status: "Cancelled",
                    cancelReason: "Cancellation initiated by user due to exceeding max duration."
                };

                // Update user and interview data
                const updatedInterviewData = await updateInterviewDataByIdService({ interviewDataId: interviewData._id, data: interviewsData });
                const updatedInterview = await updateInterviewByIdService({ interviewId, data: cancelData });

                // Handle this event in frontend
                console.log("Cancelling interview reason: Exceeding 1 hour duration");
                io.to(socket.id).emit('interview:cancelled', { interview: updatedInterview, interviewData: updatedInterviewData });
                return;
            }

            if (Number(interruptionCount) >= 4) {
                // Cancel Interview if interruption count is 4
                const interviewData = await userInterviewDataExistsService(userId);
                const { onGoingInterviewDetails } = interviewData
                // update interviewData
                const interviewsData = {
                    $pull: { onGoingInterviewDetails: { category, subCategory: { $in: subCategory } }, },
                    onGoingInterview: onGoingInterviewDetails.length === 1 ? false : true,
                    $inc: { interviewsCancelled: 1, },
                }
                // update interview
                const cancelData = {
                    status: "Cancelled",
                    cancelReason: "Cancellation initiated by user due to multiple instances of leaving the interview."
                };

                // Update user and interview data 
                const updatedInterviewData = await updateInterviewDataByIdService({ interviewDataId: interviewData._id, data: interviewsData })
                const updatedInterview = await updateInterviewByIdService({ interviewId, data: cancelData });

                // Handle this event in frontend
                console.log("Cancelling interview reason : Interruptions by user")
                io.to(socket.id).emit('interview:cancelled', { interview: updatedInterview, interviewData: updatedInterviewData });
                return;
            }


            // Update interview status to 'Active'
            await ActiveInterviewService.addActiveInterview(interviewId, socket.id, userId, category, subCategory);
            interview.status = "Active"
            interview.save()

            console.log(`Starting interview: ${interviewId}; ${interview.status}`);

            const s3ObjectUrl = (key) => `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
            // Fetch interview details and create S3 URLs

            const interviewDetailsWithUrls = await Promise.all(interview.interviewDetails.map(async (item) => ({
                ...item._doc,
                audioFileUrl: s3ObjectUrl(item.audioFileKey),
                lipsyncFileUrl: await generateS3PreSignedUrl(item.lipsyncFileKey)
            })))

            // Emit 'interview:started' event  updated interview details
            io.to(socket.id).emit('interview:started', { ...interview._doc, interviewDetails: [...interviewDetailsWithUrls] });
        });

        // Fetch latest interview incase it is not updated in client side
        socket.on('interview:fetchLatest', async (interviewId) => {
            console.log(`Fetching latest interview ${interviewId}`);
            if (interviewId) {
                const interview = await fetchInterviewByIdService(interviewId)
                io.to(socket.id).emit('interview:latest', { interview });
            }
            socket.disconnect(true);
            return
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            // Retrieve interview ID associated with disconnected socket
            const activeInterview = await ActiveInterviewService.findActiveInterviewsBysocketId(socket.id)
            // Perform database update using interview ID
            if (activeInterview) {
                const { interviewId } = activeInterview
                await ActiveInterviewService.removeActiveInterviewByInterviewId(interviewId)
                const interview = await fetchInterviewByIdService(interviewId)
                if (interview.status !== 'Completed' && interview.status !== 'Cancelled') {
                    const data = { status: 'Pending', $inc: { interruptionCount: 1 } }
                    // const data = { status: 'Pending' }
                    const updatedInterview = await updateInterviewByIdService({ interviewId, data })
                    console.log(`User interrupted disconnected from interview ${interviewId}, status: ${updatedInterview.status}`);
                } else {
                    console.log(`User interview completed ${interviewId}, status: ${interview.status}`);
                }
            } else {
                console.log('User disconnected from interview, interview ID not found');
            }
        });
    });
};
