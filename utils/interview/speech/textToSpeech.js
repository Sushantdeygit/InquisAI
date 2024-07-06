import fs from 'fs';
import AWS from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } from '../../../config/globals.config.js';
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

async function textToSpeech(text, id) {
  const polly = new AWS.Polly({ apiVersion: '2016-06-10' });
  const params = {
    Text: text,
    VoiceId: 'Matthew',
    OutputFormat: 'mp3',
  };

  // Note: The commented-out section about 'Engine: neural' was incomplete in the original code.

  return new Promise(async (resolve, reject) => {
    polly.synthesizeSpeech(params, async (err, data) => {
      if (err) {
        console.error('Error occurred:', err);
        reject(err);
      } else {
        try {
          const mp3FilePath = `public/assets/${id}.mp3`;
          const wavFilePath = `public/assets/${id}.wav`;
          const jsonFilePath = `public/assets/${id}.json`;
          const audioFileName = wavFilePath.split('assets/')[1].split('.wav')[0];
          const audioBuffer = Buffer.from(data.AudioStream);
          fs.writeFileSync(mp3FilePath, audioBuffer);
          // await convertMP3ToWAV(mp3FilePath, wavFilePath);
          const speechMarks = await synthesizeSpeechmarks(text, 'Matthew');
          const convertedJson = convertToMouthCues(speechMarks);
          fs.writeFileSync(jsonFilePath, JSON.stringify(convertedJson));
          // await rhubarbCommandLineExec(audioFileName);
          resolve(`Speech saved to  and `);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      }
    });
    console.log('SOMETHING HAPPERNING');
    try {
      // const mp3FilePath = `public/assets/${id}.mp3`;
      // const wavFilePath = `public/assets/${id}.wav`;
      // const audioFileName = wavFilePath.split('assets/')[1].split('.wav')[0];
      // await convertMP3ToWAV(mp3FilePath, wavFilePath);
      // await rhubarbCommandLineExec(audioFileName);
      resolve(`Speech saved to  and `);
    } catch (error) {
      reject(error);
    }
  });
}

const polly = new AWS.Polly({ apiVersion: '2016-06-10' });

const synthesizeSpeechmarks = async (text) => {
  console.log(`Synthesizing speechmarks for ${text} with voice: Matthew`);
  const params = {
    OutputFormat: 'json',
    SpeechMarkTypes: ['viseme'],
    Text: text,
    VoiceId: 'Matthew',
  };
  return polly
    .synthesizeSpeech(params)
    .promise()
    .then((result) => {
      // Convert charcodes to string
      console.log(result);
      const jsonString = JSON.stringify(result.AudioStream);
      const json = JSON.parse(jsonString);
      const dataStr = json.data.map((c) => String.fromCharCode(c)).join('');

      const markTypes = {
        sentence: [],
        word: [],
        viseme: [],
        ssml: [],
      };
      const endMarkTypes = {
        sentence: null,
        word: null,
        viseme: null,
        ssml: null,
      };

      // Split by enclosing {} to create speechmark objects
      const speechMarks = [...dataStr.matchAll(/\{.*?\}(?=\n|$)/gm)].map((match) => {
        const mark = JSON.parse(match[0]);

        // Set the duration of the last speechmark stored matching this one's type
        const numMarks = markTypes[mark.type].length;
        if (numMarks > 0) {
          const lastMark = markTypes[mark.type][numMarks - 1];
          lastMark.duration = mark.time - lastMark.time;
        }

        markTypes[mark.type].push(mark);
        endMarkTypes[mark.type] = mark;
        return mark;
      });

      // Find the time of the latest speechmark
      const endTimes = [];
      if (endMarkTypes.sentence) {
        endTimes.push(endMarkTypes.sentence.time);
      }
      if (endMarkTypes.word) {
        endTimes.push(endMarkTypes.word.time);
      }
      if (endMarkTypes.viseme) {
        endTimes.push(endMarkTypes.viseme.time);
      }
      if (endMarkTypes.ssml) {
        endTimes.push(endMarkTypes.ssml.time);
      }
      const endTime = Math.max(...endTimes);

      // Calculate duration for the ending speechMarks of each type
      if (endMarkTypes.sentence) {
        endMarkTypes.sentence.duration = Math.max(0.05, endTime - endMarkTypes.sentence.time);
      }
      if (endMarkTypes.word) {
        endMarkTypes.word.duration = Math.max(0.05, endTime - endMarkTypes.word.time);
      }
      if (endMarkTypes.viseme) {
        endMarkTypes.viseme.duration = Math.max(0.05, endTime - endMarkTypes.viseme.time);
      }
      if (endMarkTypes.ssml) {
        endMarkTypes.ssml.duration = Math.max(0.05, endTime - endMarkTypes.ssml.time);
      }
      fs.writeFileSync('speechMarks.json', JSON.stringify({ speechMarks }), { flag: 'w' });
      return speechMarks;
    });
};

export { textToSpeech };

// async function convertMP3ToWAV(mp3FilePath, wavFilePath) {
//   return new Promise((resolve, reject) => {
//     ffmpeg(mp3FilePath)
//       .toFormat('wav')
//       .on('error', (err) => {
//         reject(err);
//       })
//       .on('end', () => {
//         resolve(`Converted MP3 to WAV: ${wavFilePath}`);
//       })
//       .save(wavFilePath);
//   });
// }
