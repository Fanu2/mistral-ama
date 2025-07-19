import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

type Fields = { [key: string]: string | string[] };
type Files = { [key: string]: formidable.File | formidable.File[] };

export const config = {
  api: {
    bodyParser: false, // disable Next.js default body parsing for formidable
  },
};

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({ multiples: false, keepExtensions: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fields, files } = await parseForm(req);
    res.status(200).json({ success: true, fields, files });
  } catch (_error) {
    // prefix _error to avoid unused variable warning
    res.status(500).json({ success: false, error: 'Failed to parse form data' });
  }
}
