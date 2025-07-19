import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";

type FormidableFileLike = {
  filepath: string;
  originalFilename?: string;
  mimetype?: string;
  size?: number;
};

type ParsedForm = {
  fields: Record<string, string>;
  files: Record<string, FormidableFileLike | FormidableFileLike[]>;
};

export const config = {
  api: {
    bodyParser: false, // Disable Next.js built-in body parsing to use formidable
  },
};

async function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = new formidable.IncomingForm();

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, string>, files: files as ParsedForm["files"] });
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

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "Question is required" });
    }

    let fileContent = "";

    if (files.file) {
      // files.file can be a single file or array, normalize to array
      const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];

      // Just take first file for now
      const file = uploadedFiles[0];

      // Read file content if it's .txt or .pdf (assuming you handle pdf differently)
      if (file.mimetype === "text/plain") {
        fileContent = await fs.readFile(file.filepath, "utf-8");
      } else if (file.mimetype === "application/pdf") {
        // Handle PDF parsing or ignore for now
        fileContent = "[PDF file uploaded]";
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }
    }

    // TODO: Process question and fileContent to generate reply
    // For now, just echo back question and file content
    const reply = `You asked: ${question}\n\nFile content:\n${fileContent}`;

    res.status(200).json({ reply });
  } catch (error) {
    console.error("API handler error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
