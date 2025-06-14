import { extractTopicsWithFallback } from "./llm.service";

const CHUNK_SIZE = 3000; // 3k characters is safe

export const extractTopicsFromSyllabus = async (
  rawText: string,
  preferences: string,
  language: string
) => {
  try {
    console.log("rawText length:", rawText.length);

    // 1️⃣ Split rawText into chunks
    const chunks: string[] = [];
    for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
      chunks.push(rawText.slice(i, i + CHUNK_SIZE));
    }

    console.log("Number of chunks:", chunks.length);

    const allTopics: any[] = [];

    // 2️⃣ Process each chunk individually
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Processing chunk ${index + 1}/${chunks.length}`);

      try {
        const topics = await extractTopicsWithFallback(
          chunk,
          preferences,
          language
        );
        console.log(`Chunk ${index + 1} parsed topics:`, topics);
        allTopics.push(...topics);
      } catch (e) {
        console.error(`Chunk ${index + 1} error:`, e);
        throw new Error(
          `Failed to parse topics from LLM output in chunk ${index + 1}`
        );
      }
    }

    console.log("Total topics parsed:", allTopics.length);
    return allTopics;
  } catch (error) {
    console.error("Error in extractTopicsFromSyllabus:", error);
    throw error; // re-throw the error to be caught by the caller
  }
};
