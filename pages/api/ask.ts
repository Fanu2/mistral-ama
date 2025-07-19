import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

// Define your own File type to avoid type errors
type File = {
  filepath: string;
  originalFilename?: string;
  mimetype?: string;
  // add any other fields if you need
};

type Fields = { [key: string]: string | string[] };
type Files = { [key: string]: File | File[] };

// Disable Next.js built-in body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    // Now you can access form fields and files safely
    console.log('Fields:', fields);
    console.log('Files:', files);

    // Example response:
    res.status(200).json({ message: 'Form received', fields, files });
  });
}
