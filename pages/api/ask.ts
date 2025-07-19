import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false,
  },
};

type MistralApiResponse = {
  results: Array<{
    reply: string;
  }>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ error: "Error parsing the form" });
    }

    const question = fields.question;
    if (typeof question !== "string") {
      return res.status(400).json({ error: "Question field is required" });
    }

    let fileContent = "";

    if (files.file) {
      try {
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        type FileWithPath = FormidableFile & { path?: string };

        const fileTyped = file as FileWithPath;

        const filePath = fileTyped.filepath ?? fileTyped.path;

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

    const prompt = `You are a helpful AI assistant. Based on the following input:\n\n${fileContent}\n\nUser question: ${question}`;

    try {
      const response = await fetch("https://api.mistral.ai/v1/models/mistral-7b-instruct/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 100,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data: MistralApiResponse = await response.json();

      const reply = data.results?.[0]?.reply || "No reply from model.";

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Error calling Mistral API:", error);
      return res.status(500).json({ error: "Error generating response" });
    }
  });
}
