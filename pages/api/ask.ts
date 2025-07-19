import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm } from 'formidable';

type Fields = { [key: string]: string | string[] };
type Files = { [key: string]: any };

export const config = {
  api: {
    bodyParser: false, // disable default body parser to handle formidable manually
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new IncomingForm();

  form.parse(req, async (err: Error | null, fields: Fields, _files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    // Example: retrieve question field (adjust to your actual field names)
    const question = Array.isArray(fields.question)
      ? fields.question[0]
      : fields.question || '';

    try {
      // Your existing logic here — e.g., process question, call OpenAI, etc.
      // For example:
      const answer = `You asked: ${question}`;

      res.status(200).json({ answer });
    } catch (error) {
      console.error('API handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
