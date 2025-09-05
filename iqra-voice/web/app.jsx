import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const pcRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [model, setModel] = useState('gpt-4o-realtime-preview-2024-12-17');
  const [voice, setVoice] = useState('verse');

  function pushLog(x) {
    setLog(prev => [x, ...prev].slice(0, 200));
  }

  async function start() {
    if (connected) return;
    pushLog('Starting Iqra…');

    const sessionRes = await fetch('http://localhost:8787/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, voice })
    });
    const { client_secret, id } = await sessionRes.json();

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const audioEl = audioRef.current;
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current.getTracks().forEach(t => pc.addTrack(t, micStreamRef.current));

    const dc = pc.createDataChannel('oai-events');
    dc.onopen = () => pushLog('Data channel open');
    dc.onmessage = (e) => pushLog(e.data);

    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    const baseUrl = 'https://api.openai.com/v1/realtime';
    const sdpRes = await fetch(`${baseUrl}?model=${encodeURIComponent(model)}`, {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Content-Type': 'application/sdp',
        'Authorization': `Bearer ${client_secret?.value}`,
      },
    });

    const answer = { type: 'answer', sdp: await sdpRes.text() };
    await pc.setRemoteDescription(answer);

    setConnected(true);
  }

  function stop() {
    try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    setConnected(false);
    pushLog('Stopped');
  }

  return (
    <div>
      <h1>Iqra — Voice AI</h1>
      <button onClick={connected ? stop : start}>
        {connected ? 'Stop' : 'Start Iqra'}
      </button>
      <div>
        <textarea value={transcript} readOnly rows={10} cols={50}></textarea>
      </div>
      <audio ref={audioRef} autoPlay></audio>
      <div>
        <h3>Log</h3>
        <pre>{log.join("\n")}</pre>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
