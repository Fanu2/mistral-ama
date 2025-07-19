import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs/promises";

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

type ParsedForm = {
  fields: Record<string, string>;
  files: Record<string, FormidableFile | FormidableFile[]>;
};

async function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(
      req,
      (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
        if (err) return reject(err);
        resolve({
          fields: fields as Record<string, string>,
          files: files as Record<string, FormidableFile | FormidableFile[]>,
        });
      }
    );
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

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    let fileContent = "";

    if (file && "filepath" in file) {
      fileContent = await fs.readFile(file.filepath, "utf8");
    }

    const fakeAnswer = `Echo: ${question}${
      fileContent ? ` | File: ${fileContent.slice(0, 100)}...` : ""
    }`;

    res.status(200).json({ reply: fakeAnswer });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
