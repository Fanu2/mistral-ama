import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Define ParsedForm with files typed as Record<string, any>
type ParsedForm = {
  fields: Record<string, string>;
  files: Record<string, any>;  // <---- changed here, no formidable.File type
};

async function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields: fields as Record<string, string>, files });
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
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    let fileContent = "";

    if (file && file.filepath) {
      fileContent = await fs.readFile(file.filepath, "utf8");
    }

    const truncated = fileContent.length > 100;
    const reply = `Echo: ${question.trim()}${
      fileContent ? ` | File: ${fileContent.slice(0, 100)}` : ""
    }${truncated ? "..." : ""}`;

    res.status(200).json({ reply, truncated });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
