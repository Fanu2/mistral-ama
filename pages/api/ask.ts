import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export const config = {
  api: {
    bodyParser: false, // Required for formidable to work
  },
};

// Utility to parse the form
async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ multiples: false, keepExtensions: true });

  return await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let fileContent = '';
  let question = '';
  let files: { file?: formidable.File | formidable.File[] } | null = null;

  try {
    const { fields, files: parsedFiles } = await parseForm(req);
    files = parsedFiles;
    question = typeof fields.question === 'string' ? fields.question : fields.question?.[0] || '';
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse form data' });
  }

  if (files?.file) {
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (file.size > 1 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 1MB limit' });
    }

    if (file.filepath) {
      fileContent = await fs.readFile(file.filepath, 'utf8');
    } else if (file._writeStream && 'path' in file._writeStream) {
      // fallback in some environments
      const streamPath = (file._writeStream as any).path;
      fileContent = await fs.readFile(streamPath, 'utf8');
    }
  }

  const prompt = `${question}${fileContent ? `\n\nFile content:\n${fileContent}` : ''}`;

  // Replace below with your Mistral API logic
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-tiny', // or 'mistral-small', etc.
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json({ error: 'Failed to get a response from Mistral', detail: data });
  }

  return res.status(200).json({ answer: data.choices?.[0]?.message?.content || 'No answer generated' });
}
