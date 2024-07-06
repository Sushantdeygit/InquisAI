const mapping = {
  mbp: 'A',
  etc: 'B',
  e: 'C',
  ai: 'D',
  o: 'E',
  u: 'F',
  fv: 'G',
  l: 'H',
  rest: 'X',
  t: 'A',
  '@': 'B',
  k: 'C',
  u: 'D',
  i: 'E',
  p: 'F',
  r: 'G',
  t: 'H',
  f: 'X',
  s: 'X',
  E: 'X',
  o: 'X',
  sil: 'X',
};

// Map the value for AWS Polly viseme to Rhubarb viseme
function mapViseme(viseme) {
  const lowerCaseViseme = viseme.toLowerCase(); // Convert input viseme to lowercase
  const upperCaseViseme = viseme.toUpperCase(); // Convert input viseme to uppercase
  const mappedValue = mapping[lowerCaseViseme] || mapping[upperCaseViseme];
  return mappedValue !== undefined ? mappedValue : viseme.toUpperCase(); // Return the mapped value, or the original value if not found in the mapping
}

// Convert all AWS Polly viseme to Rhubarb viseme with start and end
// This need refinement for words as there are too many Cues from AWS Polly
export function visemeToMouthCues(speechMarks) {
  const duration = speechMarks[speechMarks.length - 1].time / 1000; // Assuming time is in milliseconds
  const mouthCues = [];
  speechMarks.forEach((mark, index) => {
    if (mark.type === 'viseme') {
      const pollyValue = mark.value.toLowerCase();
      const start = mark.time / 1000; // Time is in milliseconds
      const end = index < speechMarks.length - 1 ? speechMarks[index + 1].time / 1000 : duration;
      const value = mapViseme(pollyValue); // Use mapViseme function to map the viseme value
      mouthCues.push({ start, end, value });
    }
  });
  return { metadata: { duration }, mouthCues };
}
