import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

type MistralMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new IncomingForm();

  form.parse(
    req,
    async (
      err: Error | null,
      fields: Record<string, string | string[]>,
      files: Record<string, FormidableFile | FormidableFile[]>
    ) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(500).json({ error: 'Form parsing error' });
      }

      const questionConst = fields.question;
      if (!questionConst || typeof questionConst !== 'string') {
        return res.status(400).json({ error: 'Question must be a string' });
      }
      const question = questionConst;

      let fileContent = '';
      const fileField = files.file;

      if (fileField && !Array.isArray(fileField)) {
        fileContent = fs.readFileSync(fileField.filepath, 'utf-8');
      }

      const prompt = fileContent
        ? `User uploaded this file content:\n${fileContent}\n\nUser asked: ${question}`
        : question;

      try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'mistral-medium',
            messages: [{ role: 'user', content: prompt } as MistralMessage],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mistral API error: ${errorText}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        res.status(200).json({ reply });
      } catch (error) {
        console.error('Mistral API call failed:', error);
        res.status(500).json({ error: 'Failed to generate response from Mistral.' });
      }
    }
  );
}
