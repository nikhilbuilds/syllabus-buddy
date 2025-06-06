import fs from "fs";
import { openai } from "../config/openai";

export const extractTextFromFile = async (
  filePath: string,
  mimeType: string
): Promise<string> => {
  const fileBuffer = fs.readFileSync(filePath);
  const rawText = fileBuffer.toString("utf-8");
  const chunkSize = 3000;

  console.log(rawText);

  const chunks = [];
  for (let i = 0; i < rawText.length; i += chunkSize) {
    chunks.push(rawText.slice(i, i + chunkSize));
  }

  let finalExtractedText = "";

  for (const chunk of chunks) {
    const prompt = `You are a file parser. The user uploaded a file of type "${mimeType}". Extract readable text suitable for syllabus parsing.

Input chunk:
${chunk}

Return only the extracted text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "system", content: prompt }],
      max_tokens: 2000,
    });

    const extractedText = response.choices[0].message?.content?.trim() || "";
    console.log("Extracted text:", extractedText);
    finalExtractedText += extractedText + "\n";
  }

  return finalExtractedText;
};
