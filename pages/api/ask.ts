import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

type Fields = Record<string, string | string[]>;
type FileType = {
  filepath: string;
  originalFilename?: string;
  mimetype?: string;
  size: number;
  // add any other properties your app expects
};
type Files = Record<string, FileType | FileType[]> | null;

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// Example usage in your API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { fields, files } = await parseForm(req);

    // Access file safely
    let file: FileType | undefined;
    if (files && files.file) {
      if (Array.isArray(files.file)) {
        file = files.file[0];
      } else {
        file = files.file;
      }
    }

    // Your logic with fields and file here

    res.status(200).json({ fields, file });
  } catch (error) {
    res.status(500).json({ error: 'Error parsing form data' });
  }
}

// Disable the default bodyParser to use formidable
export const config = {
  api: {
    bodyParser: false,
  },
};
