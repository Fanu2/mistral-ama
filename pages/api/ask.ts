// pages/api/ask.ts

import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import { promises as fs } from "fs";

export const config = {
  api: {
    bodyParser: false, // disable Next.js default body parser to use formidable
  },
};

// Define Mistral message structure (optional)
type MistralMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse the incoming form data with formidable
  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ error: "Error parsing form data" });
    }

    // Validate 'question' field
    const question = fields.question;
    if (typeof question !== "string" || question.trim() === "") {
      return res
        .status(400)
        .json({ error: "Question field is required and must be a string" });
    }

    let fileContent = "";

    if (files.file) {
      try {
        // files.file can be single or array
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        // Cast to FormidableFile and access filepath (for formidable v2+)
        const filePath =
          (file as FormidableFile).filepath ?? (file as any).path;

        if (!filePath) {
          return res
            .status(400)
            .json({ error: "Uploaded file path not found" });
        }

        fileContent = await fs.readFile(filePath, "utf8");
      } catch (error) {
        console.error("Error reading file:", error);
        return res.status(500).json({ error: "Error reading uploaded file" });
      }
    }

    // Construct prompt for Mistral AI
    const prompt = fileContent
      ? `File content:\n${fileContent}\n\nQuestion:\n${question}`
      : question;

    try {
      // Call Mistral API
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured" });
      }

      const response = await fetch(
        "https://api.mistral.ai/v1/models/mistral-7b-instruct-v0/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Mistral API responded with status ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      // Adjust based on Mistral API response structure
      const reply = data.choices?.[0]?.message?.content;

      if (!reply) {
        return res.status(500).json({ error: "No reply from Mistral API" });
      }

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Error calling Mistral API:", error);
      return res.status(500).json({ error: "Error calling Mistral API" });
    }
  });
}
