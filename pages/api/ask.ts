import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false,
  },
};

type MistralMessage = {
  role: string;
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new formidable.IncomingForm();

  form.parse(
    req,
    async (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
      if (err) {
        console.error("Form parsing error:", err);
        return res.status(500).json({ error: "Error parsing the form" });
      }

      const question = fields.question;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'question' field" });
      }

      let fileContent = "";
      try {
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (file && file.filepath) {
          fileContent = await fs.readFile(file.filepath, "utf8");
        }
      } catch (error) {
        console.error("Error reading file:", error);
        return res.status(500).json({ error: "Error reading uploaded file" });
      }

      const prompt = `${fileContent}\n\nUser question: ${question}`;

      try {
        const response = await fetch("https://api.mistral.ai/v1/models/mistral-7b-instruct/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mistral API error: ${errorText}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "No reply from Mistral API";

        return res.status(200).json({ reply });
      } catch (error) {
        console.error("Mistral API call error:", error);
        return res.status(500).json({ error: "Failed to get response from Mistral API" });
      }
    }
  );
}
