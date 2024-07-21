import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
})

const recommendationSystemPrompt = (category, feedback) =>
  `
    imagine you are incharge of extracting insights from an interview on the category: ${category}  and the feedback of the interview is: ${feedback}.
    So suggest 1 youtube search query based on the insights extracted from the interview.

    Do not give explanations, just suggest the search queries.

    format the query as follows:
    topics:[
        "query 1",
    ]

`

const recommendationSystemResponse = async ({ category, feedback }) => {
  const userPrompt = `Interview on category: ${category}; feedback: ${feedback}`
  const prompt = recommendationSystemPrompt(category, feedback)

  const messages = [
    {
      role: 'system',
      content: recommendationSystemPrompt,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ]

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    const cleanedText = text
      .replace(/^\s*topics:\s*\[\s*|\s*\]\s*$/g, '') // Remove "topics:" and brackets
      .replace(/\\\"/g, '"') // Fix escaped quotes
      .trim() // Trim whitespace
    // Convert to array
    const formattedArray = cleanedText
      .split(/,\s*(?=(?:[^"]*"[^"]*")*[^"]*$)/g) // Split by commas, respecting quoted strings
      .map((item) => item.replace(/^"|"$/g, '').trim())

    return { topics: formattedArray }
  } catch (error) {
    console.error('Error generating content:', error)
  }
}

export { recommendationSystemResponse }
