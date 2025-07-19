import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";

type Fields = Record<string, unknown>;
type Files = Record<string, unknown>;

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

    try {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const filePath = (file as any)?.filepath || (file as any)?.path;

      if (!filePath) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = await fs.readFile(filePath, "utf8");

      // your logic here

      res.status(200).json({ success: true, content: fileContent });
    } catch (error) {
      console.error("Error reading file:", error);
      return res.status(500).json({ error: "Error reading uploaded file" });
    }
  });
}
