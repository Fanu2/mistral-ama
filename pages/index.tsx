import { useState, ChangeEvent, FormEvent } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setError(null);

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
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.reply);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Ask Mistral AI</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="question" style={{ display: "block", marginBottom: 4 }}>
          Your question:
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          required
          style={{ width: "100%", marginBottom: 12 }}
        />

        <label htmlFor="file" style={{ display: "block", marginBottom: 4 }}>
          Optional file upload:
        </label>
        <input type="file" id="file" onChange={handleFileChange} />

        <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: 20 }}>
          Error: {error}
        </p>
      )}

      {response && (
        <section
          style={{
            marginTop: 20,
            whiteSpace: "pre-wrap",
            backgroundColor: "#f0f0f0",
            padding: 12,
            borderRadius: 4,
          }}
        >
          <h2>Response:</h2>
          <p>{response}</p>
        </section>
      )}
    </main>
  );
}
