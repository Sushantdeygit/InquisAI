import fs from 'fs';

export const writeToFile = (fileName, input) => {
  fs.writeFile(fileName, input, (err) => {
    if (err) {
      console.error('Error writing to file:', err);
      return;
    }
    console.log('Data has been written to', fileName);
  });
};

// Example usage:
