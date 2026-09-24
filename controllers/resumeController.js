const fs = require("fs");
const pool = require("../config/db");

const extractTextFromPDF = require("../utils/pdfExtractor");
const analyzeResume = require("../services/geminiResumeService");

// ============================================
// Analyze Resume
// ============================================

const analyzeResumeController = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF resume.",
      });
    }

    const filePath = req.file.path;

    // Extract text from PDF
    const resumeText = await extractTextFromPDF(filePath);

    // Analyze using Gemini
    const result = await analyzeResume(resumeText);

    // Logged in user
    const userId = req.user.id;

    // Save analysis in database
    const savedReport = await pool.query(
      `
      INSERT INTO resume_analysis
      (
        user_id,
        resume_name,
        ats_score,
        overall_score,
        strengths,
        weaknesses,
        missing_keywords,
        suggestions,
        extracted_text
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      RETURNING *;
      `,
      [
        userId,
        req.file.originalname,
        result.atsScore,
        result.overallScore,
        JSON.stringify(result.strengths),
        JSON.stringify(result.weaknesses),
        JSON.stringify(result.missingKeywords),
        JSON.stringify({
          summary: result.summary,
          technicalSkills: result.technicalSkills,
          softSkills: result.softSkills,
          projectFeedback: result.projectFeedback,
          grammarSuggestions: result.grammarSuggestions,
          formattingSuggestions: result.formattingSuggestions,
          finalVerdict: result.finalVerdict,
        }),
        resumeText,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully.",
      report: savedReport.rows[0],
      analysis: result,
    });

  } catch (error) {
    console.error("Resume Analysis Error:", error);

    return res.status(500).json({
      success: false,
      message: "Resume analysis failed.",
      error: error.message,
    });

  } finally {
    // Delete uploaded PDF
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Uploaded PDF deleted.");
      } catch (deleteError) {
        console.error("Failed to delete uploaded PDF:", deleteError);
      }
    }
  }
};

// ============================================
// Get Resume History
// ============================================

const getResumeHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await pool.query(
      `
      SELECT
        id,
        resume_name,
        ats_score,
        overall_score,
        created_at
      FROM resume_analysis
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: history.rows.length,
      resumes: history.rows,
    });

  } catch (error) {
    console.error("Resume History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch resume history.",
      error: error.message,
    });
  }
};

// ============================================
// Get Single Resume
// ============================================

const getResumeById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM resume_analysis
      WHERE id = $1
      AND user_id = $2
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Resume analysis not found.",
      });
    }

    const resume = result.rows[0];

    // Parse JSON fields safely
    let strengths = [];
    let weaknesses = [];
    let missingKeywords = [];
    let suggestions = {};

    try {
      strengths = resume.strengths
        ? JSON.parse(resume.strengths)
        : [];
    } catch {
      strengths = [];
    }

    try {
      weaknesses = resume.weaknesses
        ? JSON.parse(resume.weaknesses)
        : [];
    } catch {
      weaknesses = [];
    }

    try {
      missingKeywords = resume.missing_keywords
        ? JSON.parse(resume.missing_keywords)
        : [];
    } catch {
      missingKeywords = [];
    }

    try {
      suggestions = resume.suggestions
        ? JSON.parse(resume.suggestions)
        : {};
    } catch {
      suggestions = {};
    }

    return res.status(200).json({
      success: true,
      resume: {
        id: resume.id,
        resume_name: resume.resume_name,
        ats_score: resume.ats_score,
        overall_score: resume.overall_score,

        strengths,
        weaknesses,
        missingKeywords,

        summary: suggestions.summary || "",

        technicalSkills:
          suggestions.technicalSkills || [],

        softSkills:
          suggestions.softSkills || [],

        projectFeedback:
          suggestions.projectFeedback || [],

        grammarSuggestions:
          suggestions.grammarSuggestions || [],

        formattingSuggestions:
          suggestions.formattingSuggestions || [],

        finalVerdict:
          suggestions.finalVerdict || "",

        extracted_text: resume.extracted_text,
        created_at: resume.created_at,
      },
    });

  } catch (error) {
    console.error("Get Resume Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch resume.",
      error: error.message,
    });
  }
};

// ============================================
// Delete Resume
// ============================================

const deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM resume_analysis
      WHERE id = $1
      AND user_id = $2
      RETURNING *
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully.",
    });

  } catch (error) {
    console.error("Delete Resume Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete resume.",
      error: error.message,
    });
  }
};

// ============================================
// Exports
// ============================================

module.exports = {
  analyzeResumeController,
  getResumeHistory,
  getResumeById,
  deleteResume,
};