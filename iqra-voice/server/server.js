import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/session', async (req, res) => {
  try {
    const voice = req.body.voice || 'verse';
    const model = req.body.model || 'gpt-4o-realtime-preview-2024-12-17';

    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        instructions: `You are Iqra — a friendly, fast, VAPI-style voice AI. Keep answers concise, helpful, and take initiative.`,
        voice,
        modalities: ['audio', 'text'],
        turn_detection: { type: 'server_vad' }
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const data = await r.json();
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to create session' });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Iqra server running on http://localhost:${PORT}`));
