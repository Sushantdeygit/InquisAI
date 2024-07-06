import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getBaseDirname } from '../../system/index.js';
async function convertBlobToMp3(blobFileName, outputFileName) {
  const baseDir = getBaseDirname();
  try {
    const blobFilePath = path.join(baseDir, 'public/assets', blobFileName);
    const inputBuffer = await readFile(blobFilePath);
    const outputPath = path.join(baseDir, 'public/assets', `${outputFileName}`);

    await writeFile(outputPath, inputBuffer);

    console.log(`WAV file saved successfully with name: ${outputFileName}`);
    return outputPath;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export { convertBlobToMp3 };
