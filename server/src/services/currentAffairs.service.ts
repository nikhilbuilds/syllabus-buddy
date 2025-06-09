import { AppDataSource } from "../db/data-source";
import { CurrentAffair } from "../models/CurrentAffair";
import { extractTextFromFile } from "./llmTextExtractor.service";
import { OpenAI } from "openai";
import { getFileContent } from "./getFileContent.service";
import { v4 as uuidV4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const currentAffairRepo = AppDataSource.getRepository(CurrentAffair);

interface ProcessedAffair {
  headline: string;
  summary: string;
  keywords: string[];
  relatedTopics: string[];
}

export class CurrentAffairsService {
  static async processPDF(file: any): Promise<ProcessedAffair[]> {
    try {
      // Extract text from PDF
      let rawText = "";

      //   if (file.mimetype === "application/pdf") {
      //     const fileBuffer = await getFileContent(file.location);
      //     const parsed = await PdfParse(fileBuffer);
      //     rawText = parsed.text.replace(/\x00/g, "").trim();
      //   } else if (file.mimetype === "text/plain") {
      //     rawText = file.buffer.toString("utf-8").replace(/\x00/g, "").trim();
      //   } else {
      //     const fileBuffer = await getFileContent(file.location);
      //     rawText = await extractTextFromFile(fileBuffer, file.mimetype);
      //   }

      const fileBuffer = await getFileContent(file.location);
      rawText = await extractTextFromFile(fileBuffer, file.mimetype);

      if (!rawText || rawText.length < 50) {
        throw new Error("Could not extract meaningful text from the file");
      }

      // Process text with OpenAI to extract current affairs
      const processedAffairs = await this.extractCurrentAffairs(rawText);

      //Add JSON validation for processedAffairs

      const createdAffairs = processedAffairs.currentAffairs.map((affair) => {
        return {
          ...affair,
          id: uuidV4(),
          filePath: file.location,
        };
      });

      return createdAffairs;
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw error;
    }
  }

  private static async extractCurrentAffairs(text: string): Promise<any> {
    const prompt = `
      Analyze the following text and extract current affairs in the following format:
      [
        {
          "headline": "Main headline or title",
          "summary": "Brief summary of the affair",
          "keywords": ["keyword1", "keyword2", ...],
          "relatedTopics": ["topic1", "topic2", ...]
        },
        ...
      ]

      Text to analyze:
      ${text}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that extracts current affairs from text. Return only valid JSON array.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("Failed to get response from OpenAI");
    }

    try {
      const parsed = JSON.parse(response);

      return parsed;
      //return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      throw new Error("Failed to parse current affairs from AI response");
    }
  }

  static async getAllCurrentAffairs(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [affairs, total] = await currentAffairRepo.findAndCount({
      order: { createdAt: "DESC" },
      skip,
      take: limit,
      select: {
        id: true,
        headline: true,
        publishedDate: true,
        isImportant: true,
      },
      //  relations: ["createdBy"],
    });

    return {
      affairs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getCurrentAffairById(id: string) {
    return await currentAffairRepo.findOne({
      where: { id },
      select: {
        id: true,
        headline: true,
        summary: true,
        keywords: true,
        relatedTopics: true,
        publishedDate: true,
        isImportant: true,
      },
    });
  }

  static async updateCurrentAffair(id: string, data: Partial<CurrentAffair>) {
    const affair = await currentAffairRepo.findOneBy({ id });
    if (!affair) {
      throw new Error("Current affair not found");
    }

    Object.assign(affair, data);
    return await currentAffairRepo.save(affair);
  }

  static async deleteCurrentAffair(id: string) {
    const affair = await currentAffairRepo.findOneBy({ id });
    if (!affair) {
      throw new Error("Current affair not found");
    }

    await currentAffairRepo.remove(affair);
    return { message: "Current affair deleted successfully" };
  }
}
