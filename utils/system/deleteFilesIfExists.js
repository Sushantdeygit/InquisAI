import fs from 'fs/promises';
import path from 'path';
import { getBaseDirname } from './index.js';

async function deleteFilesIfExists(fileNames) {
  const baseDir = getBaseDirname();
  const directoryPath = path.join(baseDir, 'public', 'assets');
  const deletePromises = fileNames.map(async (item) => {
    const filePath = path.join(directoryPath, item);
    try {
      await fs.access(filePath, fs.constants.F_OK);
      await fs.unlink(filePath);
      return `${item} deleted successfully.`;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return `${item} does not exist.`;
      }
      throw new Error(`Error deleting ${item}: ${error.message}`);
    }
  });

  try {
    const results = await Promise.all(deletePromises);
    console.log('Deletion results:', results);
    return results;
  } catch (error) {
    console.error('Error during file deletion:', error);
    throw error;
  }
}

export { deleteFilesIfExists };
