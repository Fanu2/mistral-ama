import React, { useState, FormEvent, ChangeEvent } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append("question", question);
      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/ask", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch response");
      }

      const data = await res.json();
      setResponse(data.reply || "No reply received.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Mistral AMA</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="question">Question:</label>
        <textarea
          id="question"
          name="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          rows={4}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        <label htmlFor="file">Optional file upload:</label>
        <input
          id="file"
          name="file"
          type="file"
          onChange={handleFileChange}
          style={{ marginBottom: "1rem" }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>
          Error: {error}
        </p>
      )}

      {response && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Response:</h2>
          <p>{response}</p>
        </section>
      )}
    </main>
  );
}
