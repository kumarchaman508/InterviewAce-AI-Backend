const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite",
});

const analyzeResume = async (resumeText) => {
  try {
    const prompt = `
You are an expert ATS Resume Reviewer and Senior HR Recruiter.

Analyze the following resume carefully.

Return ONLY valid JSON.

Resume:

${resumeText}

Response Format:

{
  "atsScore": 0,
  "overallScore": 0,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "missingKeywords": [],
  "technicalSkills": [],
  "softSkills": [],
  "projectFeedback": [],
  "grammarSuggestions": [],
  "formattingSuggestions": [],
  "finalVerdict": ""
}

Rules:

- ATS Score should be between 0-100.
- Overall Score should be between 0-100.
- Mention missing technologies.
- Mention grammar mistakes.
- Mention formatting improvements.
- Mention project quality.
- Mention resume strengths.
- Mention resume weaknesses.
- Return ONLY JSON.
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    const cleanedResponse = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedResponse);

  } catch (error) {
    console.error("Gemini Resume Error:", error);

    throw new Error("Failed to analyze resume.");
  }
};

module.exports = analyzeResume;