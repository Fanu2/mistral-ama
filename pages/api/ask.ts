import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

interface WriteStreamWithPath extends NodeJS.WritableStream {
  path: string;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest) {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (_err, fields, files) => {
      if (_err) reject(_err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let fileContent = "";

  try {
    const { fields, files: parsedFiles } = await parseForm(req);

    // files can be null so guard it
    const files = parsedFiles ?? null;

    if (!files || !files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    // Accessing the underlying file path of the uploaded file
    const streamPath = (file._writeStream as WriteStreamWithPath).path;

    const stats = await fs.promises.stat(streamPath);

    if (stats.size > 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds 1MB limit" });
    }

    fileContent = await fs.promises.readFile(streamPath, "utf8");

    const question = fields.question as string | undefined;

    if (!question) {
      return res.status(400).json({ error: "No question provided" });
    }

    const prompt = `${question}${fileContent ? `\n\nFile content:\n${fileContent}` : ""}`;

    // ... rest of your processing logic with prompt

    return res.status(200).json({ prompt });
  } catch (error) {
    console.error("Error in API handler:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
