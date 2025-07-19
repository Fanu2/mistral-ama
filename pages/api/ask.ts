import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(req, async (err: Error | null, fields: any, files: any) => {
    if (err) {
      console.error('Form parsing error:', err);
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    try {
      // Ensure question is a string, not an array
      const question = Array.isArray(fields.question) ? fields.question[0] : fields.question || '';

      // Read file content if uploaded
      let fileContent = '';
      if (files.file && !Array.isArray(files.file)) {
        const uploadedFile = files.file;
        fileContent = fs.readFileSync(uploadedFile.filepath, 'utf-8');
      }

      // Construct prompt content
      const contentToSend = fileContent
        ? `${question}\n\nAttached content:\n${fileContent}`
        : question;

      console.log('contentToSend:', contentToSend);

      // Call Mistral API
      const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
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
