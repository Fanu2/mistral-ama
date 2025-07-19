import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

type ParsedForm = {
  fields: formidable.Fields;
  files: formidable.Files;
};

function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const question = fields.question;
    if (typeof question !== "string") {
      return res.status(400).json({ error: "Question must be a string" });
    }

    let fileContent = "";
    if (files.file) {
      const uploadedFile = Array.isArray(files.file)
        ? files.file[0]
        : files.file;
      const filePath = uploadedFile.filepath;
      fileContent = fs.readFileSync(filePath, "utf8");
    }

    // Send request to Mistral API
    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-tiny",
        messages: [
          {
            role: "user",
            content: fileContent
              ? `${question}\n\nFile content:\n${fileContent}`
              : question,
          },
        ],
      }),
    });

    if (!mistralResponse.ok) {
      const errorData = await mistralResponse.json();
      return res.status(500).json({ error: errorData.error || "Mistral API error" });
    }

    const data = await mistralResponse.json();
    const reply = data.choices?.[0]?.message?.content || "No reply from Mistral.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
