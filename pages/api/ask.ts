import { IncomingForm, Fields, Files } from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false, // disable default body parser for formidable to work
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    // Example: Access form fields or files here
    // For now, just echo them back
    res.status(200).json({ fields, files });
  });
}
