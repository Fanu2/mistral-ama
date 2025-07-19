import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { Readable } from "stream";

export const config = {
  api: {
    bodyParser: false,
  },
};

type ParsedForm = {
  fields: any;
  files: any;
};

async function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function readFileAsText(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, "utf8");
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);
    const question = fields.question;

    let fileContent = "";

    const uploadedFile = files.file?.[0] || files.file;

    if (uploadedFile && uploadedFile.filepath) {
      fileContent = await readFileAsText(uploadedFile.filepath);
    }

    const fullPrompt = `${fileContent ? `Context:\n${fileContent}\n\n` : ""}Question: ${question}`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: fullPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mistral error:", data);
      return res.status(500).json({ error: data.error || "Mistral API error" });
    }

    const reply = data.choices?.[0]?.message?.content || "No response from model.";
    res.status(200).json({ reply });
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
