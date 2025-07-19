import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import { parseForm } from '../../utils/parseForm'; // Ensure this exists and works
import type { File } from 'formidable';

interface MistralResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

async function callMistralAPI(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("Missing MISTRAL_API_KEY in environment variables");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-tiny", // or mistral-small / mistral-medium based on your plan
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
  }

  const data: MistralResponse = await response.json();
  return data.choices?.[0]?.message?.content || "No response from Mistral";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ reply?: string; error?: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let files: { file?: File | File[] } | null = null;

  try {
    const { fields, files: parsedFiles } = await parseForm(req);
    files = parsedFiles;

    const question = Array.isArray(fields.question)
      ? fields.question[0]
      : fields.question;

    if (!question || typeof question !== "string" || question.length > 1000) {
      return res.status(400).json({
        error: "Question is required, must be a string, and cannot exceed 1000 characters",
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    let fileContent = "";

    if (file && file.size > 0) {
      if (file.size > 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds 1MB limit" });
      }
      fileContent = await fs.readFile(file.filepath, "utf8");
    }

    const prompt = `${question}${fileContent ? `\n\nFile content:\n${fileContent}` : ""}`;
    const aiResponse = await callMistralAPI(prompt);
    return res.status(200).json({ reply: aiResponse });
  } catch (error: unknown) {
    console.error("API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: errorMessage });
  } finally {
    if (files?.file) {
      const fileArray = Array.isArray(files.file) ? files.file : [files.file];
      await Promise.all(
        fileArray.map(async (f: File) => {
          if (f.filepath) {
            try {
              await fs.unlink(f.filepath);
              console.log(`Cleaned up file: ${f.filepath}`);
            } catch (cleanupError) {
              console.error("File cleanup error:", cleanupError);
            }
          }
        })
      );
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
