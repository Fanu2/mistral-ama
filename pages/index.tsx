// pages/index.tsx
import { useState, ChangeEvent } from 'react';
import Head from 'next/head';

interface HistoryItem {
  q: string;
  a: string;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const askMistral = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');

    const formData = new FormData();
    formData.append('question', question);
    if (file) {
      formData.append('file', file);
    }

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        setAnswer(`Error: ${text}`);
      } else {
        const data = await res.json();
        setAnswer(data.reply);
        setHistory((prev) => [...prev, { q: question, a: data.reply }]);
      }
    } catch (error) {
      console.error(error);
      setAnswer('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mistral AMA</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4">Ask Me Anything (Powered by Mistral)</h1>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full max-w-xl p-2 border border-gray-700 rounded mb-4 text-black"
          rows={4}
          placeholder="Ask a question..."
        />
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4 text-white"
        />
        <button
          onClick={askMistral}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || !question.trim()}
        >
          {loading ? 'Asking...' : 'Ask Mistral'}
        </button>

        {answer && (
          <div className="mt-6 max-w-xl w-full bg-gray-800 p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Mistral says:</h2>
            <div
              className="prose prose-invert"
              dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br/>') }}
            />
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-8 max-w-xl w-full">
            <h3 className="text-xl font-semibold mb-2">History</h3>
            <ul className="space-y-2">
              {history.map((item, i) => (
                <li key={i} className="bg-gray-800 p-3 rounded">
                  <p><strong>Q:</strong> {item.q}</p>
                  <p><strong>A:</strong> {item.a}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
