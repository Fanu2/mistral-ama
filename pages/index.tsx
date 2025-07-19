import { useState, ChangeEvent, FormEvent } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse("");

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
        const err = await res.json();
        setError(err.error || "An error occurred");
        setLoading(false);
        return;
      }

      const data: { reply: string } = await res.json();
      setResponse(data.reply);
    } catch {
      setError("Failed to fetch response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Mistral AMA</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="question">Your Question:</label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          style={{ width: "100%", marginBottom: 12 }}
          required
        />

        <label htmlFor="file">Upload File (optional):</label>
        <input id="file" name="file" type="file" onChange={handleFileChange} style={{ marginBottom: 12 }} />

        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Ask Mistral"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {response && (
        <section
          style={{
            marginTop: 20,
            whiteSpace: "pre-wrap",
            backgroundColor: "#f5f5f5",
            padding: 12,
            borderRadius: 6,
          }}
        >
          <strong>Response:</strong>
          <p>{response}</p>
        </section>
      )}
    </main>
  );
}
