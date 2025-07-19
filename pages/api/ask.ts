import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Manual type definitions from Formidable
import type { IncomingForm as FormidableIncomingForm } from 'formidable';
type FormidableFields = Parameters<FormidableIncomingForm['parse']>[1];
type FormidableFiles = Parameters<FormidableIncomingForm['parse']>[2];

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new IncomingForm();

  form.parse(req, async (err: Error | null, fields: ReturnType<NonNullable<FormidableFields>>, _files: ReturnType<NonNullable<FormidableFiles>>) => {
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
      console.log('Received content:', contentToSend);
      res.status(200).json({ answer: `You said: ${contentToSend}` });
    } catch (processingError: unknown) {
      console.error('Processing error:', processingError);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

export default handler;
