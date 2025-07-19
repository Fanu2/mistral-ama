import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs/promises";

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define interface for formidable file
interface FormidableFile extends File {
  filepath: string;
  originalFilename?: string | null;
  mimetype?: string | null;
  size: number;
}

interface ParsedForm {
  fields: Record<string, string | string[]>;
  files: Record<string, FormidableFile | FormidableFile[]>;
}

async function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  const form = formidable({
    multiples: true,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    filter: ({ mimetype }: { mimetype: string | null }) => {
      return !!mimetype && ["text/plain", "application/pdf"].includes(mimetype);
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err: Error | null, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({
        fields: fields as Record<string, string | string[]>,
        files: files as Record<string, FormidableFile | FormidableFile[]>,
      });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let files: ParsedForm["files"] | null = null;
  try {
    const { fields, files: parsedFiles } = await parseForm(req);
    files = parsedFiles; // Store for cleanup

    const question = Array.isArray(fields.question)
      ? fields.question[0]
      : fields.question;

    if (!question || typeof question !== "string" || question.length > 1000) {
      return res.status(400).json({
        error: "Question is required, must be a string, and cannot exceed 1000 characters",
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    let fileContent = "";

    if (file && "filepath" in file && file.size > 0) {
      try {
        fileContent = await fs.readFile(file.filepath, "utf8");
      } catch (readError) {
        console.error("File read error:", readError);
        return res.status(400).json({ error: "Failed to read uploaded file" });
      }
    }

    const response = {
      reply: `Echo: ${question}${fileContent ? ` | File: ${fileContent.slice(0, 100)}` : ""}`,
      truncated: fileContent ? fileContent.length > 100 : false,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (files) {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (file && "filepath" in file) {
        try {
          await fs.unlink(file.filepath).catch(() => {}); // Ignore cleanup errors
        } catch (cleanupError) {
          console.error("File cleanup error:", cleanupError);
        }
      }
    }
  }
}
