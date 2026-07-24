const pdfParse = require('pdf-parse');

const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer);
    return data.text.trim();
  } catch (error) {
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
};

module.exports = { extractTextFromPDF };
