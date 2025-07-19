import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import type { File } from 'formidable';

type Fields = { [key: string]: string | string[] };
type Files = { [key: string]: File | File[] };

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({ multiples: false, keepExtensions: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files: files as Files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fields, files } = await parseForm(req);
    res.status(200).json({ success: true, fields, files });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to parse form data' });
  }
}
