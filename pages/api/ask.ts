import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files } from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Important to disable Next.js default body parser for formidable
  },
};

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err: Error | null, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fields, files } = await parseForm(req);

    // Example: Access field named 'question'
    const question = fields.question as string | undefined;

    // Your logic here, e.g., process the question or files

    res.status(200).json({ success: true, question, files });
  } catch (error) {
    console.error('Error parsing form:', error);
    res.status(500).json({ success: false, error: 'Failed to parse form data' });
  }
}
