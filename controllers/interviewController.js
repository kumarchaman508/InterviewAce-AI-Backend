const pool = require("../config/db");

const {
  generateInterviewQuestions,
  evaluateInterview,
} = require("../services/geminiService");

// ======================================
// Generate Interview Questions
// ======================================

const startInterview = async (req, res) => {
  try {
    const {
      role,
      difficulty,
      questions,
      type,
    } = req.body;

    if (!role || !difficulty || !questions || !type) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const interviewQuestions =
      await generateInterviewQuestions({
        role,
        difficulty,
        questions,
        type,
      });

    return res.status(200).json({
      success: true,
      message: "Interview generated successfully.",
      questions: interviewQuestions,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate interview.",
    });

  }
};

// ======================================
// Submit Interview
// ======================================

const submitInterview = async (req, res) => {

  try {

    const {
      role,
      questions,
      answers,
    } = req.body;

    if (
      !role ||
      !questions ||
      !answers
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing interview data.",
      });
      
    }
    

    const evaluation =
      await evaluateInterview({
        role,
        questions,
        answers,
      });

    const userId =
      req.user.id || req.user.userId;

    const query = `
      INSERT INTO interview_results
      (
        user_id,
        role,
        score,
        technical_score,
        communication_score,
        problem_solving,
        confidence_score,
        strengths,
        improvements,
        feedback
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *;
    `;

    const values = [
      userId,
      role,
      evaluation.score,
      evaluation.technical_score,
      evaluation.communication_score,
      evaluation.problem_solving,
      evaluation.confidence_score,
      evaluation.strengths,
      evaluation.improvements,
      evaluation.feedback,
    ];

    const result =
      await pool.query(query, values);

    return res.status(200).json({

      success: true,

      message:
        "Interview submitted successfully.",

      result:
        result.rows[0],

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit interview.",
    });
    

  }
};
const getInterviewHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const query = `
      SELECT *
      FROM interview_results
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      history: result.rows,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview history.",
    });
  }
};
// ======================================
// Get Interview Analytics
// ======================================

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const query = `
      SELECT *
      FROM interview_results
      WHERE user_id = $1
      ORDER BY created_at ASC;
    `;

    const { rows } = await pool.query(query, [userId]);

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        analytics: {
          totalInterviews: 0,
          highestScore: 0,
          averageScore: 0,
          technicalAverage: 0,
          communicationAverage: 0,
          problemSolvingAverage: 0,
          confidenceAverage: 0,
          bestRole: null,
          strongestSkill: null,
          weakestSkill: null,
          scoreTrend: [],
        },
      });
    }

    const totalInterviews = rows.length;

    const average = (key) =>
      Math.round(
        rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) /
          totalInterviews
      );

    const technicalAverage = average("technical_score");
    const communicationAverage = average("communication_score");
    const problemSolvingAverage = average("problem_solving");
    const confidenceAverage = average("confidence_score");

    const highestInterview = rows.reduce((best, current) =>
      Number(current.score) > Number(best.score) ? current : best
    );

    const skills = [
      { name: "Technical", score: technicalAverage },
      { name: "Communication", score: communicationAverage },
      { name: "Problem Solving", score: problemSolvingAverage },
      { name: "Confidence", score: confidenceAverage },
    ];

    const strongestSkill = [...skills].sort((a, b) => b.score - a.score)[0];
    const weakestSkill = [...skills].sort((a, b) => a.score - b.score)[0];

    const scoreTrend = rows.map((item) => ({
      id: item.id,
      role: item.role,
      score: Number(item.score),
      technical: Number(item.technical_score),
      communication: Number(item.communication_score),
      problemSolving: Number(item.problem_solving),
      confidence: Number(item.confidence_score),
      date: item.created_at,
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        totalInterviews,
        highestScore: Number(highestInterview.score),
        averageScore: average("score"),
        technicalAverage,
        communicationAverage,
        problemSolvingAverage,
        confidenceAverage,
        bestRole: highestInterview.role,
        strongestSkill,
        weakestSkill,
        scoreTrend,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics.",
    });
  }
};

// 👇 Fir module.exports
module.exports = {
  startInterview,
  submitInterview,
  getInterviewHistory,
  getAnalytics,
};
