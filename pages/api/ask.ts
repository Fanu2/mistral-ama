import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";

type ParsedForm = {
  fields: Record<string, string>;
  files: Record<string, formidable.File | formidable.File[]>;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = new formidable.IncomingForm();

  return new Promise((resolve, reject) => {
    form.parse(
      req,
      (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
        if (err) return reject(err);
        resolve({
          fields: fields as Record<string, string>,
          files: files as ParsedForm["files"],
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
    const file = files.file;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "Question is required" });
    }

    // Example: you can access file data here if needed
    // Do your processing logic here...

    // Dummy response for example
    res.status(200).json({ reply: `Received your question: ${question}` });
  } catch (err) {
    console.error("Error parsing form:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
}
