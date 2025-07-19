import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Important for formidable
  },
};

// Define types for parsed files
type FormidableFiles = {
  [key: string]: File | File[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, async (err: Error | null, fields: Record<string, string | string[]>, files: FormidableFiles) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    try {
      // Ensure question is a single string
      const question = Array.isArray(fields.question) ? fields.question[0] : fields.question || '';

      // Read file content if uploaded
      let fileContent = '';
      const fileField = files.file;
      if (fileField && !Array.isArray(fileField)) {
        fileContent = fs.readFileSync(fileField.filepath, 'utf-8');
      }

      // Construct the content to send to Mistral
      const contentToSend = fileContent
        ? `${question}\n\nAttached content:\n${fileContent}`
        : question;

      // Make sure it's not empty
      if (!contentToSend.trim()) {
        res.status(400).json({ error: 'Question must be a non-empty string' });
        return;
      }

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
