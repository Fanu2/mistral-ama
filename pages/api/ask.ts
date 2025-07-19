import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';

type Fields = { [key: string]: string | string[] };
type Files = { [key: string]: FormidableFile | FormidableFile[] };

export const config = {
  api: {
    bodyParser: false, // disable default body parsing so formidable can handle multipart
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, (err: Error | null, fields: Fields, _files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const question = fields.question;

    // Handle question possibly being array or undefined
    const questionText = Array.isArray(question)
      ? question[0]
      : question || '';

    if (!questionText) {
      return res.status(400).json({ error: 'No question provided' });
    }

    // Simulate processing the question and generating an answer
    const answer = `You asked: ${questionText}`;

    return res.status(200).json({ answer });
  });
}
