import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

type Fields = { [key: string]: string | string[] };
type Files = { [key: string]: formidable.File | formidable.File[] };

export const config = {
  api: {
    bodyParser: false,
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

  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields: Fields, _files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const question = fields.question;
    const questionText = Array.isArray(question) ? question[0] : question || '';

    if (!questionText) {
      return res.status(400).json({ error: 'No question provided' });
    }

    const answer = `You asked: ${questionText}`;

    return res.status(200).json({ answer });
  });
}
