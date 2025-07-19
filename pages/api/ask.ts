import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File, Fields, Files } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

type Data = {
  reply?: string;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const form = new IncomingForm();

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    try {
      // Get question string from fields
      const question = Array.isArray(fields.question)
        ? fields.question[0]
        : fields.question || '';

      // Read uploaded file content if present
      let fileContent = '';
      const file = files.file as File | File[] | undefined;
      if (file) {
        // Handle single or multiple file uploads safely
        if (Array.isArray(file)) {
          // Just read the first file's content if multiple uploaded
          fileContent = fs.readFileSync(file[0].filepath, 'utf-8');
        } else {
          fileContent = fs.readFileSync(file.filepath, 'utf-8');
        }
      }

      // Prepare the content to send in Mistral API
      const contentToSend = fileContent
        ? `${question}\n\nAttached content:\n${fileContent}`
        : question;

      console.log('contentToSend:', contentToSend);

      // Call Mistral API
      const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-small',
          messages: [
            {
              role: 'user',
              content: contentToSend,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!mistralRes.ok) {
        const errorData = await mistralRes.json().catch(() => null);
        console.error('Mistral API error:', errorData || mistralRes.statusText);
        res.status(500).json({ error: `Mistral API error: ${JSON.stringify(errorData)}` });
        return;
      }

      const result = await mistralRes.json();
      const reply = result.choices?.[0]?.message?.content || 'No response from Mistral';

      res.status(200).json({ reply });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Unexpected server error' });
    }
  });
}
