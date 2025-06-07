import pdfParse from "pdf-parse";
import { openai } from "../config/openai";
import tesseract from "tesseract.js";

export const extractTextFromFile = async (
  fileData: Buffer,
  fileType: string
): Promise<string> => {
  try {
    let extractedText = "";

    if (fileType === "application/pdf") {
      // Parse PDF locally
      const pdfData = await pdfParse(fileData);
      extractedText = pdfData.text;
    } else if (fileType.startsWith("image/")) {
      // Use OCR for images
      const {
        data: { text },
      } = await tesseract.recognize(fileData);
      extractedText = text;
    } else if (fileType === "text/plain") {
      extractedText = fileData.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error("Failed to extract meaningful text from the file.");
    }

    // Summarize or clean up text using OpenAI
    const summaryPrompt = `
You are a syllabus assistant. Summarize and clean up the extracted text below to make it easier to parse into topics later.

Extracted Text:
${extractedText.substring(0, 4000)}  // Truncate to avoid token overflow
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: summaryPrompt },
      ],
      max_tokens: 1000,
    });

    const summary = response.choices[0]?.message?.content || "";
    if (!summary || summary.length < 50) {
      throw new Error("Failed to generate summary from extracted text.");
    }

    return summary;
  } catch (error) {
    console.error("Error in LLM text extraction:", error);
    throw new Error("Failed to extract text from file using LLM");
  }
};
