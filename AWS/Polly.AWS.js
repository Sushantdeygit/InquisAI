import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } from '../config/globals.config.js';

const pollyClient = new PollyClient({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

const AWSPollyTextToSpeechBuffer = async (text) => {
  try {
    const params = {
      Text: text,
      VoiceId: 'Matthew',
      OutputFormat: 'mp3',
      // Engine: 'neural', // Specify the neural engine for better speech quality
    };
    console.log(`Synthesizing audio for ${text} with voice: Matthew`);
    // Synthesize speech
    const synthesizeCommand = new SynthesizeSpeechCommand(params);
    const response = await pollyClient.send(synthesizeCommand);
    const audioBuffer = await streamToBuffer(response.AudioStream);

    // Return audo Buffer
    return audioBuffer;
  } catch (err) {
    console.error('Error synthesizing speech: AWSPollyTextToSpeechBuffer', err);
    throw err; // Propagate the error
  }
};

const AWSPollySynthesizeSpeechmarks = async (text) => {
  try {
    console.log(`Synthesizing speechmarks for ${text} with voice: Matthew`);
    const params = {
      OutputFormat: 'json',
      SpeechMarkTypes: ['viseme'],
      Text: text,
      VoiceId: 'Matthew',
    };
    const synthesizeCommand = new SynthesizeSpeechCommand(params);
    const response = await pollyClient.send(synthesizeCommand);
    const audioStream = await streamToBuffer(response.AudioStream);

    // Convert charcodes to string
    const jsonString = JSON.stringify(audioStream);
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
    return speechMarks;
  } catch (error) {
    console.error('Error synthesizing speech: AWSPollySynthesizeSpeechmarks');
    throw err; // Propagate the error
  }
};
export { AWSPollySynthesizeSpeechmarks, AWSPollyTextToSpeechBuffer };
