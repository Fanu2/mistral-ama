import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new IncomingForm();

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
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
      // You can add your logic here. Example:
      console.log('Received content:', contentToSend);

      // Respond back with a dummy response or integrate your model/API call
      res.status(200).json({ answer: `You said: ${contentToSend}` });
    } catch (processingError) {
      console.error('Processing error:', processingError);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

export default handler;
