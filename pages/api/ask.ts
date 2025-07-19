import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";

// Define your own minimal File type since formidable.File doesn't exist in typings
type File = {
  filepath: string;
  originalFilename?: string;
  mimetype?: string;
  size?: number;
};

// Define Fields and Files using your own File type
type Fields = Record<string, string | string[] | undefined>;
type Files = Record<string, File | File[]>;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields: Fields, files: Files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).json({ error: "Error parsing the form" });
    }

    // You can now safely use fields and files with correct typings
    console.log(fields);
    console.log(files);

    // Your logic here...

    res.status(200).json({ message: "Form parsed successfully", fields, files });
  });
}
