import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm, File as FormidableFile } from 'formidable';

type Fields = { [key: string]: string | string[] };
type Files = { [key: string]: FormidableFile | FormidableFile[] };

export const config = {
  api: {
    bodyParser: false, // Disables Next.js default body parser so formidable can handle it
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, (err: any, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const question = fields.question;
    // Here, you could access uploaded file(s) from files if needed

    // For example: const uploadedFile = files.file;

    // TODO: Process the question and files with your Mistral model logic here
    // For demo, just send back the question:

    if (typeof question !== 'string') {
      return res.status(400).json({ error: 'Question must be a string' });
    }

    // Replace this with your actual AI logic call
    const reply = `You asked: ${question}`;

    res.status(200).json({ reply });
  });
}
