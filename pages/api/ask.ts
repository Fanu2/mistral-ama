import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm, Fields, Files } from 'formidable';

// Disable Next.js default body parsing to use formidable
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

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    try {
      // Example: Do something with the parsed fields/files
      // For demonstration, just respond with parsed data
      res.status(200).json({ fields, files });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
