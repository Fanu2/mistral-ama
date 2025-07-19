export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
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
      if (file.size > 1024 * 1024) { // 1MB limit
        return res.status(400).json({ error: "File size exceeds 1MB limit" });
      }
      fileContent = await fs.readFile(file.filepath, "utf8");
    }

    const prompt = `${question}${fileContent ? `\n\nFile content:\n${fileContent}` : ""}`;

    const aiResponse = await callMistralAPI(prompt);
    return res.status(200).json({ reply: aiResponse });
  } catch (error) {
    console.error("API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: errorMessage });
  } finally {
    if (files) {
      const fileToClean = Array.isArray(files.file) ? files.file : [files.file].filter(Boolean);
      await Promise.all(
        fileToClean.map(async (f) => {
          if (f?.filepath) {
            try {
              await fs.unlink(f.filepath);
            } catch (cleanupError) {
              console.error("File cleanup error:", cleanupError);
            }
          }
        })
      );
    }
  }
}
