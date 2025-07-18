import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new IncomingForm();

  form.parse(
    req,
    async (err: any, fields: Fields, files: Files) => {
      if (err) {
        console.error('Form parsing error:', err);
        res.status(500).json({ error: 'Form parsing error' });
        return;
      }

      // Your existing logic here, e.g.:
      // const question = fields.question as string;
      // do something with the question and files...

      res.status(200).json({ message: 'Form parsed successfully' });
    }
  );
}
