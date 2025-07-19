import { useState, ChangeEvent, FormEvent } from "react";

export default function Home() {
  const [question, setQuestion] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) {
      setError("Question is required");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse("");

    try {
      const formData = new FormData();
      formData.append("question", question.trim());
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/ask", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP error! status: ${res.status}`);
      }

      const data: { reply: string } = await res.json();
      setResponse(data.reply);
    } catch (err: unknown) {
      console.error("Submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        fontFamily: "Arial, sans-serif",
        padding: "0 1rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Mistral AMA</h1>
      <form onSubmit={handleSubmit} aria-busy={loading}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="question" style={{ display: "block", marginBottom: "0.5rem" }}>
            Your Question:
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: "0.5rem", resize: "vertical" }}
            required
            aria-invalid={error ? "true" : "false"}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="file" style={{ display: "block", marginBottom: "0.5rem" }}>
            Upload File (optional):
          </label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            style={{ marginBottom: "0.5rem" }}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
          aria-disabled={loading}
        >
          {loading ? "Processing..." : "Ask Mistral"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: "1rem" }} role="alert">
          {error}
        </p>
      )}
      {response && (
        <section
          style={{
            marginTop: "1.5rem",
            whiteSpace: "pre-wrap",
            backgroundColor: "#f5f5f5",
            padding: "1rem",
            borderRadius: "6px",
          }}
          aria-live="polite"
        >
          <strong style={{ display: "block", marginBottom: "0.5rem" }}>
            Response:
          </strong>
          <p>{response}</p>
        </section>
      )}
    </main>
  );
}
