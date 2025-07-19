import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { Readable } from "stream";

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParsedForm = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);
    const question = fields.question;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    const file = files.file?.[0] || files.file;
    let fileContent = "";

    if (file && file.filepath) {
      fileContent = fs.readFileSync(file.filepath, "utf8");
    }

    // This is where you'd use the question + fileContent with Mistral or other logic.
    const fakeAnswer = `Echo: ${question}${fileContent ? ` | File: ${fileContent.slice(0, 100)}...` : ""}`;

    res.status(200).json({ reply: fakeAnswer });
  } catch (error: any) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
