const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite",
});

// ===============================
// Generate Interview Questions
// ===============================

const generateInterviewQuestions = async ({
  role,
  difficulty,
  questions,
  type,
}) => {
  try {

    // Har request ko unique banane ke liye random seed/token
    // isse Gemini same-ish prompt pe same-ish answers nahi degi
    const sessionSeed = crypto.randomUUID();
    const randomAngle = Math.floor(Math.random() * 1000);

    const prompt = `
You are an expert interviewer conducting a fresh, one-of-a-kind interview session.

Session ID: ${sessionSeed}
Variation Seed: ${randomAngle}

Generate ${questions} UNIQUE interview questions.

Role: ${role}
Difficulty: ${difficulty}
Type: ${type}

Rules:
- This is a NEW session — do not reuse questions from any previous session.
- Never repeat common/generic textbook interview questions.
- Generate a fresh set every time, even for the same role and difficulty.
- Include a mix of:
  - Conceptual
  - Practical
  - Scenario-based
  - Debugging
  - Coding (if applicable)
- No two questions in this list should be similar in meaning.
- Make the interview realistic like Google, Microsoft or Amazon.
- Return only JSON, no markdown, no explanation.

Format:
[
  {
    "question": "...",
    "type": "technical"
  }
]
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.0,   // zyada randomness/variety ke liye
        topP: 0.95,
        topK: 40,
      },
    });

    const response = await result.response;

    const text = response.text();

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsedQuestions = JSON.parse(cleanedText);

    // Safety net: agar Gemini khud hi ek list ke andar
    // duplicate/similar question de de to filter karo
    const seen = new Set();
    parsedQuestions = parsedQuestions.filter((q) => {
      const key = q.question.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return parsedQuestions;

  } catch (error) {

    console.error("Question Generation Error:", error);

    throw error;
  }
};

// =====================================
// Evaluate Interview Answers
// =====================================

const evaluateInterview = async ({
  role,
  questions,
  answers,
}) => {
  try {

    // "answers" ab {question, answer, skipped} objects ka array hai,
    // isliye .answer nikaalna hoga, plain string nahi hai
    const interviewData = questions.map((q, index) => ({
      question: q.question,
      answer: answers[index]?.answer || "",
      skipped: answers[index]?.skipped || false,
    }));

    const prompt = `
You are a Senior FAANG Interviewer.

Evaluate the following interview.

Role:
${role}

Interview:

${JSON.stringify(interviewData, null, 2)}

Return ONLY valid JSON.

Do NOT return markdown.

Do NOT use \`\`\`.

JSON Format:

{
  "score":90,
  "technical_score":90,
  "communication_score":90,
  "problem_solving":90,
  "confidence_score":90,

  "strengths":[
    "Point 1",
    "Point 2",
    "Point 3"
  ],

  "improvements":[
    "Point 1",
    "Point 2",
    "Point 3"
  ],

  "feedback":"Overall detailed feedback in around 150 words."
}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    console.log(text);

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedText);

  } catch (error) {

    console.error("Evaluation Error:", error);

    throw error;

  }
};

module.exports = {
  generateInterviewQuestions,
  evaluateInterview,
};