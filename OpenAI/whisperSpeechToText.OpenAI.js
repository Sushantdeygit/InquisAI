import OpenAI from 'openai';

import { getBaseDirname } from '../utils/system/index.js';
import path from 'path';
import fs from 'fs';

const openai = new OpenAI();
const OpenAIWhisperSpeechToText = async (answerFileName) => {
  try {
    const baseDir = getBaseDirname();
    // Speech to text (using whisper)
    const answerFilePath = path.join(baseDir, 'public/assets', answerFileName);
    const file = fs.createReadStream(answerFilePath);
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });
    return response;
  } catch (error) {
    console.log(error);
    console.log('OpenAIWhisperSpeechToText');
  }
};
export { OpenAIWhisperSpeechToText };
