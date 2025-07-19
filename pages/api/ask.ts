import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

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

  form.parse(req, async (err: Error | null, fields: Record<string, any>, files: Record<string, any>) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    let question = fields.question;
    let fileContent = '';

    // Read the file content if uploaded
    const fileField = files.file;
    if (fileField && !Array.isArray(fileField)) {
      const uploadedFile = fileField as unknown as { filepath: string };
      fileContent = fs.readFileSync(uploadedFile.filepath, 'utf-8');
    }

    // Build the prompt based on whether a file was uploaded
    const prompt = fileContent
      ? `User uploaded this file content:\n${fileContent}\n\nUser asked: ${question}`
      : question;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question must be a string' });
    }

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-medium',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ] as MistralMessage[],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API error: ${errorText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;

      res.status(200).json({ reply });
    } catch (error: any) {
      console.error('Mistral API call failed:', error);
      res.status(500).json({ error: 'Failed to generate response from Mistral.' });
    }
  });
}
