import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config/globals.config.js';

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_interview_evaluation',
      description: 'Get Evaluation for the AI interview',
      parameters: {
        type: 'object',
        properties: {
          interviewResult: {
            type: 'array',
            description: 'Evaluations with percentage of each answer.',
            items: {
              $ref: '#/$defs/result',
            },
          },
          advice: {
            type: 'string',
            description: 'A piece of advice given to the candidate based on the answers.',
          },
        },
        $defs: {
          result: {
            type: 'object',
            required: ['percentage', 'feedback'],
            properties: {
              percentage: {
                type: 'string',
                description:
                  'A percentage out of 100 based on the question and the answer given by the candidate with question Number',
              },
              feedback: {
                type: 'string',
                description: 'A 4 to 5 words feedback based on answers to the question',
              },
            },
          },
        },
        required: ['interviewResult', 'advice'],
      },
    },
  },
];

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const technicalInterviewPrompt = `Analyze the provided technical questions and corresponding answers with a focus on evaluating the interviewee's theoretical knowledge
, problem-solving skills, clarity of explanation, and communication effectiveness. Consider both the content of the answers and the relevance to the questions asked.

Descriptor Requirements:
Fully Addressed (90-100%): The answer comprehensively addresses all parts of the question, demonstrating a thorough understanding and providing well-developed, supported ideas.
Sufficiently Addressed (80-89%): The answer addresses all parts of the question adequately, providing relevant and extended ideas with clarity and coherence.
Adequately Addressed (70-79%): The answer addresses all parts of the question, presenting a clear position with some minor gaps or areas of less detail.
Partially Addressed (60-69%): The answer addresses some parts of the question but may lack clarity or depth in others, with noticeable gaps in understanding or development.
Inadequately Addressed (40-59%): The answer only partially addresses the question, with significant gaps in understanding or development and unclear or irrelevant content.
Not Addressed (Below 40%): The answer does not address the question adequately, with substantial deficiencies in understanding or development and significant irrelevant content.

`;


const getInterviewEvalutaion = async ({ level, category, subCategory, interviewDetails, numberOfQuestions }) => {
  // For single or multiple sub Categories
  const actualSubCategory = Array.isArray(subCategory) ? subCategory.join(', ') : subCategory;

  const messages = [
    {
      role: 'system',
      content: `You are an interviewer and need to evaluate the candidates questions, you will be given number of questions, 
      evaluate all of them. Evaluate the candidate's performance based strictly on the technical accuracy with heavy consideration
      on level and quality of answers. Exclude any consideration for creativity, metaphorical explanations, or humor in your evaluation 
      give percentage to every answer. Do not give 100% to anyone and also try to give evaluation based on if the person gives the same
      answer in a real interview will they get selected. If the answer is empty or very small and not relevant give 0%.`,
    },
    {
      role: 'user',
      content: `Interview on category: ${category}; Sub Category: ${actualSubCategory}; level: ${level}; Number of questions: ${numberOfQuestions};  ${interviewDetails}`,
    },
  ];
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    messages: messages,
    tools: tools,
    max_tokens: 2000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  // The content below is stringified
  // response.choices[0].message.tool_calls[0].function.arguments
  // Need to parse this first before converting to JSON
  const responseArray = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments).interviewResult;
  const responseAdvice = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments).advice;
  // Returns the questions and expectedAnswers array
  return { responseArray, responseAdvice };
};

export { getInterviewEvalutaion };
