import { createClient } from '@deepgram/sdk';
import { getBaseDirname } from '../utils/system/index.js';
import path from 'path';
import fs from 'fs';
import { DEEPGRAM_API_KEY } from '../config/globals.config.js';

const deepgram = createClient(DEEPGRAM_API_KEY);

const deepgramSpeechToText = async (answerFileName) => {
  console.info('Creating Transcribe of ' + answerFileName);
  const baseDir = getBaseDirname();
  // Speech to text (using deepgramSpeechToText)
  const answerFilePath = path.join(baseDir, 'public/assets', answerFileName);
  const file = fs.createReadStream(answerFilePath);
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(file, {
    model: 'nova-2',
  });
  if (error) {
    console.error(error);
    console.log('deepgramSpeechToText');
  }
  const { transcript } = result.results.channels[0].alternatives[0];
  return transcript;
};
export { deepgramSpeechToText };
