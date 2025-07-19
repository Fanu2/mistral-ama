import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, type Fields, type Files, type File } from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable Next.js default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// API route handler
const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new IncomingForm();

  // Parse form data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  form.parse(req, async (err: Error | null, fields: Fields, _files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    const contentField = fields.content;
    const contentToSend = Array.isArray(contentField) ? contentField[0] : contentField;

    if (typeof contentToSend !== 'string') {
      res.status(400).json({ error: 'Invalid content format' });
      return;
    }

    try {
      // Log received content
      console.log('Received content:', contentToSend);

      // Placeholder response logic
      res.status(200).json({ answer: `You said: ${contentToSend}` });
    } catch (processingError) {
      console.error('Processing error:', processingError);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

export default handler;
