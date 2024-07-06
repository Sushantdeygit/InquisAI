import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config/globals.config.js';
import { writeToFile } from '../utils/system/index.js';
// System
// You are an interviewer and taking an interview of an employee for the role they are applying for. You will be provided with user's  full name, level of questions , category , sub-category and number Of Questions. Use this information to generate questions please keep heavy consideration on level of questions and category to choose questions.
// You are an interview question generator for an interview of an employee and for the role they are applying for. You will be provided with user's  full name, level of questions , category , sub-category and number Of Questions. Use this information to generate questions please keep heavy consideration on level of questions and category to choose questions.
// User
// full name: Priyanshu Rawat level of questions: Advanced category: Software Engineer sub-category: LAMP Stack; number Of Questions: 5

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_interview_questions',
      parameters: {
        type: 'object',
        properties: {
          interviewQuestions: {
            type: 'array',
            description: 'Questions that will be asked in the interview',
            items: {
              $ref: '#/$defs/question',
            },
          },
        },
        $defs: {
          question: {
            type: 'object',
            required: ['question'],
            properties: {
              question: {
                type: 'string',
                description: 'Question that will be asked in the interview',
              },
            },
          },
        },
        required: ['interviewQuestions'],
      },
      description: 'Get questions for the AI interview',
    },
  },
];

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});
const fetchInterviewQuestions = async ({ fullName, level, category, subCategory, numberOfQuestions }) => {
  // For single or multiple sub Categories
  const actualSubCategory = Array.isArray(subCategory) ? subCategory.join(', ') : subCategory;

  const message = [
    {
      role: 'system',
      content: `You are an interview question generator for an interview of an employee and for the role they are applying for. You will be provided with user's  full name, level of questions , category , sub-category and Number Of questions. Use this information to generate questions please keep heavy consideration on level of questions and category to choose questions.`,
    },
    {
      role: 'user',
      content: `Full name: ${fullName}; Level of questions: ${level}; Category: ${category}; Sub-category: ${actualSubCategory}; Number Of questions: ${numberOfQuestions}`,
    },
  ];
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: message,
    tools: tools,
    max_tokens: 4096,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  // writeToFile('chatGPT.json', JSON.stringify(response));
  console.log(response.usage);
  // The content below is stringified
  // response.choices[0].message.tool_calls[0].function.arguments
  // Need to parse this first before converting to JSON
  const responseArray = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments).interviewQuestions;

  // Returns the questions and expectedAnswers array
  return responseArray;
};

export { fetchInterviewQuestions };

// fetchInterviewQuestions({ fullName: 'Priyanshu Rawat', level: 'Expert', category: 'Framework', subCategory: 'Nest JS', numberOfQuestions: 5 });
