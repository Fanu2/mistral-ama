import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";

// Define generic types for formidable fields and files
type Fields = Record<string, any>;
type Files = Record<string, any>;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ error: "Error parsing the form" });
    }

    let fileContent = "";

    try {
      // files.file can be single or array
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      // Use 'filepath' or 'path' depending on formidable version
      // Newer versions use 'filepath', older 'path'
      const filePath = (file as any).filepath || (file as any).path;

      if (!filePath) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      fileContent = await fs.readFile(filePath, "utf8");
    } catch (error) {
      console.error("Error reading file:", error);
      return res.status(500).json({ error: "Error reading uploaded file" });
    }

    // Your logic here with fileContent, fields, etc.

    res.status(200).json({ success: true, content: fileContent });
  });
}
