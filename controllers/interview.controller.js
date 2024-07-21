import BadRequestError from '../errors/BadRequestError.js'
import {
  createAndReturnNewInterviewDataDocument,
  updateInterviewDataByIdService,
  userInterviewDataExistsService,
} from '../services/interviewData.service.js'
import { fetchUserByIdService } from '../services/user.service.js'
import { deleteFilesIfExists, convertBlobToMp3 } from '../utils/system/index.js'
import {
  AWSPollySynthesizeSpeechmarks,
  AWSPollyTextToSpeechBuffer,
} from '../AWS/Polly.AWS.js'
import { v4 as uuidv4 } from 'uuid'
import {
  fetchInterviewQuestionsFromDbService,
  filterQuestionDetails,
  updateQuestionByIDService,
} from '../services/question.service.js'
import { uploadAudioBufferToS3, uploadSpeechMarksToS3 } from '../AWS/S3.AWS.js'
import {
  createInterviewService,
  fetchInterviewByIdService,
  fetchInterviewsByUserIdService,
  formatInterviewDetailsPreEvaluationService,
  reduceInterviewHealthService,
  updateInterviewByIdService,
} from '../services/interview.service.js'
import { fetchUserDataByUserIdService } from '../services/userData.service.js'
import UnauthenticatedError from '../errors/UnauthenticatedError.js'
import { OpenAIWhisperSpeechToText } from '../OpenAI/whisperSpeechToText.OpenAI.js'
import { deepgramSpeechToText } from '../OpenAI/deepgramTextToSpeech.js'
import CustomAPIError from '../errors/CustomAPIError.js'
import { getInterviewEvalutaionNew } from '../OpenAI/evaluateQuestions.OpenAINew.js'

import { recommendationSystemResponse } from '../OpenAI/YoutubeTopicsExtraction.js'
import { fetchYouTubeVideos } from '../services/youtube.service.js'

import { visemeToMouthCues, checkProfanity } from '../utils/interview/index.js'
import { getPercentage } from '../utils/interview/result/getPercentage.js'
import NotFoundError from '../errors/NotFoundError.js'

const getAllInterviews = async (req, res) => {
  const { userId } = req.body
  const interviews = await fetchInterviewsByUserIdService(userId)
  const interviewData = await userInterviewDataExistsService(userId)
  return res.status(200).send({ interviews, interviewData })
}

const checkLatestInterviewData = async (req, res) => {
  const { userId } = req.body
  const interviewData = await userInterviewDataExistsService(userId)
  if (!interviewData) {
    throw new NotFoundError('User not found')
  }
  return res.status(200).send({ latestInterview: interviewData.updatedAt })
}

const startInterview = async (req, res) => {
  const {
    userId,
    level,
    category,
    subCategory,
    numberOfQuestions,
    intervieweeName,
    techImage,
  } = req.body
  if (
    !userId ||
    !level ||
    !category ||
    !subCategory ||
    !numberOfQuestions ||
    !intervieweeName ||
    !techImage
  ) {
    throw new BadRequestError('Please provide all fields.')
  }
  const user = await fetchUserByIdService(userId)
  const userData = await fetchUserDataByUserIdService(userId)
  if (!user || !userData) throw new UnauthenticatedError('No user found.')

  let interviewData = await userInterviewDataExistsService(userId)

  // If the user is new, Create the interview and fetch.
  if (!interviewData) {
    interviewData = await createAndReturnNewInterviewDataDocument(userId)
  }
  const {
    _id: interviewDataId,
    interviewCredits,
    answeredQuestionIds,
    onGoingInterview,
    onGoingInterviewDetails,
  } = interviewData
  // Interview is ongoing

  if (onGoingInterview) {
    const isSameCategory =
      onGoingInterviewDetails.filter(
        (item) =>
          item.category === category && item.subCategory[0] === subCategory[0],
      ).length > 0
    if (isSameCategory)
      throw new BadRequestError(
        `Another interview for ${subCategory[0]} is in progress, please complete it first.`,
      )
  }

  // Max limit reached
  if (interviewCredits <= 0) {
    throw new BadRequestError('No interview credits, please recharge.')
  }
  // Fetch questions from DB
  const interviewQuestions = await fetchInterviewQuestionsFromDbService({
    level,
    category,
    subCategory,
    numberOfQuestions,
    excludedIds: answeredQuestionIds,
  })

  // Prmoises array for creating and uploading questions and speechmarks to AWS.
  const promises = interviewQuestions.map(async (item) => {
    try {
      const { _id, text: question, lipsyncFileKey, audioFileKey } = item
      // If no audio file or speech marks exists
      if (!lipsyncFileKey || !audioFileKey) {
        console.log('No lipsyncFileKey or audioFileKey found.')
        const uid = uuidv4()
        // Create audio and speech Cues using AWS Polly
        const audioBuffer = await AWSPollyTextToSpeechBuffer(question)
        const pollySpeechRemarks = await AWSPollySynthesizeSpeechmarks(question)
        // Convert AWS Speech Cues to Rhubarb
        const speechMarks = visemeToMouthCues(pollySpeechRemarks)
        // Create File names
        const audioFileKey =
          `questions/v1_${level}_${category}_${subCategory}_${uid}`
            .split(' ')
            .join('_') + '.mp3'
        const lipsyncFileKey =
          `speechMarks/v1_${level}_${category}_${subCategory}_${uid}`
            .split(' ')
            .join('_') + '.json'
        // Upload to S3
        await uploadAudioBufferToS3({ name: audioFileKey, audioBuffer })
        await uploadSpeechMarksToS3({
          name: lipsyncFileKey,
          speechMarks: JSON.stringify(speechMarks),
        })
        // Update question in db
        const data = { audioFileKey, lipsyncFileKey }
        const updateQuestion = await updateQuestionByIDService({
          questionId: _id,
          data,
        })
        return { question: updateQuestion }
      }
      return { question: item }
    } catch (error) {
      console.log(error)
      return error
    }
  })

  const interviewDetails = []
  const questionIdArray = []
  // Update questions
  await Promise.all(promises)
    .then((results) => {
      results.forEach((item) => {
        const { question } = item
        // Data to be put into interviewData DB
        questionIdArray.push(question._id)
        // Data to be put into interview details
        interviewDetails.push(filterQuestionDetails(question))
      })
    })
    .catch((error) => {
      console.error('Error processing questions:', error)
      throw new CustomAPIError('Error processing questions.')
    })

  // Create the interview document
  const interview = await createInterviewService({
    userId,
    level,
    category,
    subCategory,
    numberOfQuestions,
    intervieweeName,
    interviewDetails,
    techImage,
  })

  // Update interviewData; Increment the total Interviews; Decrement credits

  const interviewDataUpdate = {
    onGoingInterview: true,
    $addToSet: {
      answeredQuestionIds: { $each: questionIdArray },
      onGoingInterviewDetails: {
        interviewId: interview._id,
        userId,
        category,
        subCategory,
      },
    },
    $inc: {
      totalInterviews: 1,
      interviewCredits: -1,
    },
  }

  const updatedInterviewData = await updateInterviewDataByIdService({
    interviewDataId,
    data: interviewDataUpdate,
  })
  return res
    .status(200)
    .send({ interview, interviewData: updatedInterviewData })
}

// Post answer to question
const postAnswerFile = async (req, res) => {
  const { answerNumber, userId, interviewId } = req.body
  if (!req.file) {
    throw new BadRequestError('No files were uploaded.')
  }
  const blobFilename = req.file.filename
  // Create filename and convert blob file to mp3
  const answerFileName = `${userId}_answer${answerNumber}.mp3`
  await convertBlobToMp3(blobFilename, answerFileName)

  // Delete Blob File
  await deleteFilesIfExists([blobFilename])

  // Transcribe text using whisper
  // Remarks Whisper has a open source version as well try to use that
  // const text = await OpenAIWhisperSpeechToText(answerFileName);

  // Using DeepGram speech to text
  const text = await deepgramSpeechToText(answerFileName)

  if (text.length < 1) {
    return res.status(400).send({ msg: 'No audio detected.' })
  }

  // Get interview
  const interview = await fetchInterviewByIdService(interviewId)

  // Get interview details
  const {
    interviewDetails,
    health,
    numberOfQuestions,
    status,
    profanityCount,
    category,
    subCategory,
  } = interview

  // Check for bad words
  // Give warnings or cancel the interview
  const { profane, profaneText } = checkProfanity(text)
  if (profane) {
    const updatedHealth = reduceInterviewHealthService(health)
    const data = {
      $inc: {
        profanityCount: 1,
      },
      $set: {
        health: updatedHealth,
        cancelReason:
          profanityCount === 3 ? 'Use of profane language.' : undefined,
        status: profanityCount === 3 ? 'Cancelled' : status,
      },
    }
    let updatedInterviewData
    // Update interviewData if interview is cancelled
    if (profanityCount === 3) {
      const interviewData = await userInterviewDataExistsService(userId)
      const { onGoingInterviewDetails } = interviewData
      const interviewsData = {
        $pull: {
          onGoingInterviewDetails: {
            category,
            subCategory: { $in: subCategory },
          },
        },
        onGoingInterview: onGoingInterviewDetails.length === 1 ? false : true,
        $inc: { interviewsCancelled: 1 },
      }
      updatedInterviewData = await updateInterviewDataByIdService({
        interviewDataId: interviewData._id,
        data: interviewsData,
      })
    }

    const updatedInterview = await updateInterviewByIdService({
      interviewId,
      data,
    })
    // Return with updated health
    return res.status(405).send({
      msg: profaneText,
      updatedInterview,
      interviewData: updatedInterviewData,
    })
  }

  // Get current question
  const currentInterviewQuestion = interviewDetails[answerNumber]
  // Set answer in the document
  currentInterviewQuestion.answer = text
  // Check if interview is Complete or not

  // Set the data to be updated in DB
  const data = {
    $set: {
      currentQuestion:
        Number(answerNumber) + 1 < numberOfQuestions
          ? Number(answerNumber) + 1
          : answerNumber,
      interviewDetails,
    },
  }

  // Update the interview in DB
  const updatedInterview = await updateInterviewByIdService({
    interviewId,
    data,
  })

  // Delete the answer file mp3
  await deleteFilesIfExists([answerFileName])
  return res.status(200).send({ updatedInterview })
}

// End Interview API
const endInterview = async (req, res) => {
  const { userId, interviewId } = req.body
  const fileNames = []
  const interview = await fetchInterviewByIdService(interviewId)
  const interviewData = await userInterviewDataExistsService(userId)
  const { _id: interviewDataId, onGoingInterviewDetails } = interviewData

  if (!interview) throw new BadRequestError('No interview found.')

  // If any reply file exits delete it
  Object.keys([...Array(interview.numberOfQuestions)]).map((item, i) => {
    fileNames.push(`${userId}_answer${i + 1}.mp3`)
  })
  await deleteFilesIfExists(fileNames)

  // Get interview details array
  const { interviewDetails, level, category, subCategory, numberOfQuestions } =
    interview

  // Format answers
  const formattedAnswers =
    formatInterviewDetailsPreEvaluationService(interviewDetails)

  // Evaluate results
  const { results, advice } = await getInterviewEvalutaionNew({
    level,
    category,
    subCategory,
    interviewDetails: formattedAnswers,
    numberOfQuestions,
  })

  console.log({ Results: results, advice: advice })

  // Update data
  let evaluationPercentage = 0
  const interviewDetailsResults = await Promise.all(
    interviewDetails.map(async (item, i) => {
      const { asked, averageScore, questionId } = item
      const score = getPercentage({ level, result: results[i] })
      const {
        feedback,
        clarity,
        accuracy,
        completeness,
        relevance,
        communication,
      } = results[i]

      evaluationPercentage += score
      const oldAverageScore = Number(averageScore || 0) * (asked || 0)
      const newAverageScore = Math.floor(
        (oldAverageScore + score) / (asked ? asked + 1 : 1),
      )

      //call to gemini service
      const { topics } = await recommendationSystemResponse({
        subCategory,
        feedback,
      })
      //call to youtube service
      const videoResults = await fetchYouTubeVideos(topics)
      console.log(videoResults)
      try {
        await updateQuestionByIDService({
          questionId,
          data: { averageScore: newAverageScore, $inc: { asked: 1 } },
        })
      } catch (error) {
        console.log(error)
      }

      return {
        ...item,
        score,
        feedback,
        videoResults,
        clarity: { score: clarity },
        accuracy: { score: accuracy },
        completeness: { score: completeness },
        relevance: { score: relevance },
        communication: { score: communication },
        averageScore: newAverageScore,
        asked: asked + 1,
      }
    }),
  )

  interview.advice = advice
  interview.interviewDetails = interviewDetailsResults
  interview.evaluationPercentage = Math.floor(
    evaluationPercentage / numberOfQuestions,
  )
  interview.status = 'Completed'

  interview.save()

  // Update interviewData
  const interviewsData = {
    $pull: {
      onGoingInterviewDetails: { category, subCategory: { $in: subCategory } },
    },
    onGoingInterview: onGoingInterviewDetails.length === 1 ? false : true,
    $inc: { interviewsCompleted: 1 },
  }
  const updatedInterviewData = await updateInterviewDataByIdService({
    interviewDataId,
    data: interviewsData,
  })
  return res
    .status(200)
    .send({ interview, interviewData: updatedInterviewData })
}

export {
  getAllInterviews,
  checkLatestInterviewData,
  startInterview,
  endInterview,
  postAnswerFile,
}
