async function callMistralAPI(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("Missing MISTRAL_API_KEY in environment variables");
  }

  const response = await fetch("https://api.mistral.ai/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // Adjust the payload as per Mistral API specs
      prompt,
      // Add other params like model, max_tokens, temperature etc if required
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Adjust according to the actual response format
  return data.generated_text || "No response from Mistral";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let files: ParsedForm["files"] | null = null;

  try {
    const { fields, files: parsedFiles } = await parseForm(req);
    files = parsedFiles;

    const question = Array.isArray(fields.question)
      ? fields.question[0]
      : fields.question;

    if (!question || typeof question !== "string" || question.length > 1000) {
      return res.status(400).json({
        error: "Question is required, must be a string, and cannot exceed 1000 characters",
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    let fileContent = "";

    if (file && file.size > 0) {
      fileContent = await fs.readFile(file.filepath, "utf8");
    }

    const prompt = `${question}${fileContent ? `\n\nFile content:\n${fileContent}` : ""}`;

    // Call Mistral API here with the prompt
    const aiResponse = await callMistralAPI(prompt);

    return res.status(200).json({ reply: aiResponse });
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  } finally {
    if (files) {
      const fileToClean = Array.isArray(files.file) ? files.file[0] : files.file;
      if (fileToClean && fileToClean.filepath) {
        try {
          await fs.unlink(fileToClean.filepath).catch(() => {});
        } catch (cleanupError) {
          console.error("File cleanup error:", cleanupError);
        }
      }
    }
  }
}
