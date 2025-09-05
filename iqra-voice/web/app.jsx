import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const App = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("iqra_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [listening, setListening] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [iqraMood, setIqraMood] = useState("cheerful");
  const synthRef = useRef(window.speechSynthesis);

  const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";

  const toggleListening = () => {
    if (!recognition) return alert("Speech Recognition not supported.");
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
    }
  };

  useEffect(() => {
    if (!recognition) return;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      addMessage("User", transcript);
      getGPTResponse(transcript);
    };

    recognition.onerror = (e) => console.error("Speech recognition error:", e);
  }, []);

  useEffect(() => {
    localStorage.setItem("iqra_messages", JSON.stringify(messages));
  }, [messages]);

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  // Adjust mood based on keywords
  const adjustMood = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("sad") || lower.includes("unhappy") || lower.includes("tired")) setIqraMood("empathetic");
    else if (lower.includes("happy") || lower.includes("great") || lower.includes("awesome")) setIqraMood("cheerful");
    else setIqraMood("neutral");
  };

  const getGPTResponse = async (text) => {
    adjustMood(text);

    const systemMessage = {
      role: "system",
      content: `You are Iqra, a friendly AI assistant with personality quirks. 
      Current mood: ${iqraMood}. 
      Use cheerful or empathetic expressions depending on mood. 
      Remember recent messages for context. 
      Use short interjections and small talk like "Absolutely!", "No worries!", "You got it, champ!".`
    };

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [systemMessage, { role: "user", content: text }],
          temperature: 0.8,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const gptText = response.data.choices[0].message.content;
      addMessage("Iqra", gptText);
      speakText(gptText);
    } catch (error) {
      console.error("GPT API error:", error);
      const fallback = "Oops! Something went wrong, but I’m here to help!";
      addMessage("Iqra", fallback);
      speakText(fallback);
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    // Mood-based pitch
    utterance.pitch = iqraMood === "cheerful" ? 1.1 : iqraMood === "empathetic" ? 0.9 : 1;
    utterance.rate = 1;
    synthRef.current.speak(utterance);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput) return;
    addMessage("User", userInput);
    getGPTResponse(userInput);
    setUserInput("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Iqra Realtime Voice AI</h1>
      <p>Mood: <strong>{iqraMood}</strong></p>
      <button onClick={toggleListening} style={{ marginBottom: 10 }}>
        {listening ? "Stop Listening 🎤" : "Start Listening 🎤"}
      </button>

      <div style={{ border: "1px solid #ccc", padding: 10, height: 400, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.sender === "Iqra" ? "left" : "right", margin: "5px 0" }}>
            <strong>{msg.sender}: </strong> {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          style={{ width: "80%", padding: 8 }}
        />
        <button type="submit" style={{ padding: 8, marginLeft: 5 }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default App;
