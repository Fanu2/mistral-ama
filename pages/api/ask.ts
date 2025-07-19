import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import { parseForm, ParsedForm } from '../../utils/parseForm';

async function callMistralAPI(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("Missing MISTRAL_API_KEY in environment variables");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-tiny",
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

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response from Mistral";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let files: ParsedForm["files"] | null = null;

  try {
    // Parse multipart form data
    const { fields, files: parsedFiles } = await parseForm(req);
    files = parsedFiles;

    // Extract question from form fields
    const question = Array.isArray(fields.question)
      ? fields.question[0]
      : fields.question;

    // Validate question
    if (!question || typeof question !== "string" || question.length > 1000) {
      return res.status(400).json({
        error: "Question is required, must be a string, and cannot exceed 1000 characters",
      });
    }

    // Process uploaded file if exists
    let fileContent = "";
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (file && file.size > 0) {
      // Validate file size (1MB limit)
      if (file.size > 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds 1MB limit" });
      }

      // Read file content
      fileContent = await fs.readFile(file.filepath, "utf8");
    }

    // Create prompt combining question and file content
    const prompt = `${question}${fileContent ? `\n\nFile content:\n${fileContent}` : ""}`;

    // Call Mistral API with the prompt
    const aiResponse = await callMistralAPI(prompt);

    // Return successful response
    return res.status(200).json({ reply: aiResponse });
  } catch (error) {
    // Handle errors
    console.error("API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: errorMessage });
  } finally {
    // Clean up uploaded files
    if (files) {
      const fileToClean = Array.isArray(files.file) ? files.file : [files.file].filter(Boolean);
      await Promise.all(
        fileToClean.map(async (f) => {
          if (f?.filepath) {
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
    bodyParser: false, // Disable default body parser to handle multipart/form-data
  },
};
