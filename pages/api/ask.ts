import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // important: disable Next.js built-in body parser for formidable
  },
};

type Fields = {
  [key: string]: any;
};

type Files = {
  [key: string]: File | File[];
};

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fields, files } = await parseForm(req);

    // your logic here with fields and files

    res.status(200).json({ success: true, fields, files });
  } catch (error) {
    console.error('Form parsing error:', error);
    res.status(500).json({ error: 'Form parsing error' });
  }
}
