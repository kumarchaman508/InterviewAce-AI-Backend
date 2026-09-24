const fs = require("fs");
const pdfParse = require("pdf-parse");

const extractTextFromPDF = async (filePath) => {
  try {
    // Read PDF
    const buffer = fs.readFileSync(filePath);

    // Extract Text
    const data = await pdfParse(buffer);

    return data.text;
  } catch (error) {
    console.error("PDF Extraction Error:", error);

    throw new Error("Failed to extract text from PDF.");
  }
};

module.exports = extractTextFromPDF;