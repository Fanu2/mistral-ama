import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';

type Fields = Record<string, string | string[]>;
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
  const form = new IncomingForm();

  form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    // Example response — customize as needed
    res.status(200).json({ fields, files });
  });
}
