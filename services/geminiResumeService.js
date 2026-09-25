const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",

    generationConfig: {
        responseMimeType: "application/json",
    },
});

const analyzeResume = async (resumeText) => {
    try {
        if (!resumeText || !resumeText.trim()) {
            throw new Error("Resume text is empty.");
        }

        const prompt = `
You are an expert ATS Resume Reviewer and Senior HR Recruiter.

Analyze the following resume carefully.

IMPORTANT:
Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not add any explanation outside JSON.

Resume:
${resumeText}

Return exactly this JSON structure:

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

- atsScore must be a number between 0 and 100.
- overallScore must be a number between 0 and 100.
- strengths must be an array of strings.
- weaknesses must be an array of strings.
- missingKeywords must be an array of strings.
- technicalSkills must be an array of strings.
- softSkills must be an array of strings.
- projectFeedback must be an array of strings.
- grammarSuggestions must be an array of strings.
- formattingSuggestions must be an array of strings.
- summary must be a concise professional assessment.
- finalVerdict must provide a concise final recommendation.
- Analyze the actual resume content.
- Do not invent experience that is not present in the resume.
`;

        const result = await model.generateContent(prompt);

        const responseText = result.response.text().trim();

        const analysis = JSON.parse(responseText);

        return analysis;

    } catch (error) {
        console.error("Gemini Resume Error:", error);

        throw new Error(
            error.message || "Failed to analyze resume."
        );
    }
};

module.exports = analyzeResume;