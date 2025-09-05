import { useState } from "react";

function App() {
  const [model, setModel] = useState("gpt-4o-realtime");
  const [voice, setVoice] = useState("verse");
  const [log, setLog] = useState([]);

  // 🎙️ Create session
  async function startSession() {
    try {
      const res = await fetch("http://localhost:8787/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, voice }),
      });

      const data = await res.json();
      setLog((prev) => [...prev, "✅ Session started"]);
      console.log("Session:", data);
    } catch (err) {
      console.error("Session error:", err);
      setLog((prev) => [...prev, "❌ Failed to start session"]);
    }
  }

  // 🔊 Test TTS
  async function speakText() {
    try {
      const res = await fetch("http://localhost:8787/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello, I am Iqra!", voice }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();

      setLog((prev) => [...prev, "🔊 Speaking…"]);
    } catch (err) {
      console.error("Speak error:", err);
      setLog((prev) => [...prev, "❌ Failed to speak"]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">🎤 Iqra — Voice AI</h1>

      {/* Model Selector */}
      <div className="mb-4">
        <label className="mr-2">Model:</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-black p-1 rounded"
        >
          <option value="gpt-4o-realtime">gpt-4o-realtime</option>
          <option value="gpt-4o-mini">gpt-4o-mini</option>
        </select>
      </div>

      {/* Voice Selector */}
      <div className="mb-4">
        <label className="mr-2">Voice:</label>
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="text-black p-1 rounded"
        >
          <option value="verse">verse</option>
          <option value="alloy">alloy</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={startSession}
          className="bg-blue-600 px-4 py-2 rounded-lg"
        >
          Start Session
        </button>
        <button
          onClick={speakText}
          className="bg-green-600 px-4 py-2 rounded-lg"
        >
          Speak Test
        </button>
      </div>

      {/* Logs */}
      <div className="mt-6 w-full max-w-md bg-gray-800 p-4 rounded-lg text-sm">
        <h2 className="font-semibold mb-2">Log</h2>
        <ul>
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
