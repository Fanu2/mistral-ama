import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';

type Fields = { [key: string]: string | string[] };

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, (error: Error | null, fields: Fields) => {
    if (error) {
      console.error('Form parsing error:', error);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const question = fields.question;

    if (typeof question !== 'string') {
      return res.status(400).json({ error: 'Question must be a string' });
    }

    // Replace with your actual AI logic here
    const reply = `You asked: ${question}`;

    res.status(200).json({ reply });
  });
}
