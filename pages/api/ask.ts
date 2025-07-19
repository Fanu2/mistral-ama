import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";

// Minimal type for formidable fields and files (adjust if you want stricter)
type Fields = Record<string, string | string[] | undefined>;
type Files = Record<string, formidable.File | formidable.File[]>;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new formidable.IncomingForm();

  form.parse(
    req,
    async (err: Error | null, fields: Fields, files: Files) => {
      if (err) {
        console.error("Form parsing error:", err);
        return res.status(500).json({ error: "Error parsing the form" });
      }

      try {
        // Example to handle a single file upload, adapt your field name here
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file || !file.filepath) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const fileContent = await fs.readFile(file.filepath, "utf8");

        // your logic here
        res.status(200).json({ success: true, content: fileContent });
      } catch (error) {
        console.error("Error reading file:", error);
        res.status(500).json({ error: "Error reading uploaded file" });
      }
    }
  );
}
