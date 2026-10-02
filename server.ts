import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.use(express.json());

// Initialize Gemini client (uses process.env.GEMINI_API_KEY)
const ai = new GoogleGenAI();

app.post('/api/refine-signs', async (req, res) => {
  try {
    const { signs, targetLanguage = 'English', role = 'patient' } = req.body;
    const signList = Array.isArray(signs) ? signs.join(', ') : (signs || '');

    if (!signList.trim()) {
      return res.status(400).json({ error: 'No signs or text provided' });
    }

    const prompt = `You are "Language Doctor", an AI medical communication system.
A ${role} has communicated the following sequence of recognized sign language tokens or speech input:
"${signList}"

Target output language: "${targetLanguage}"

Perform the following tasks:
1. "synthesizedText": Translate the raw tokens into a natural, respectful, and clinically clear sentence in English (e.g. if tokens are "HELP PAIN MEDICINE", convert to "I need help with my pain medication").
2. "translatedText": Translate the synthesized sentence into the requested target language ("${targetLanguage}"). If target language is English, keep it in English.
3. "urgency": Classify clinical priority as one of: "ROUTINE", "URGENT", "EMERGENCY".
4. "actionRecommendation": Provide a concise 1-sentence prompt for the attending nurse or clinician (e.g., "Assess pain scale 1-10 and verify prescription chart.").

Respond strictly in valid JSON format:
{
  "synthesizedText": "string",
  "translatedText": "string",
  "urgency": "ROUTINE" | "URGENT" | "EMERGENCY",
  "actionRecommendation": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini synthesis error:', err?.message || err);
    // Graceful offline fallback
    const rawTokens = Array.isArray(req.body.signs) ? req.body.signs.join(' ') : req.body.signs;
    const isEmergency = /emergency|pain|help/i.test(rawTokens);
    res.json({
      synthesizedText: `Message: ${rawTokens}`,
      translatedText: rawTokens,
      urgency: isEmergency ? 'URGENT' : 'ROUTINE',
      actionRecommendation: 'Check patient vitals and communication board.'
    });
  }
});

// Voice / Text to Kenyan Sign Language (KSL) Gloss & Animation Sequence
app.post('/api/voice-to-ksl', async (req, res) => {
  try {
    const { speechText } = req.body;
    if (!speechText || !speechText.trim()) {
      return res.status(400).json({ error: 'No speech text provided' });
    }

    const prompt = `You are an expert linguist and translator in Kenyan Sign Language (KSL / Lugha ya Ishara ya Kenya) for medical healthcare settings.
A clinician spoke or typed:
"${speechText}"

Translate this into authentic Kenyan Sign Language (KSL) gloss syntax.
Available standard KSL animated lexicon signs:
[MSAADA, DAKTARI, MAUMIVU, MAJI, DAWA, DHARURA, NDIYO, HAPANA, WAPI, ASANTE, HOSPITALI, SINDANO, HOMA, DAMU, CHAKULA, WEWE, MIMI, SASA, JINSI, UTULIVU]

Rules:
1. KSL has topic-comment structure. Wh-questions (Wapi / Where, Nani / Who, Lini / When) typically go at the end of the sentence.
2. Map concepts to the closest standard KSL sign. If a specific proper noun or medication name is not in the list, represent it with "SPELL:<WORD>" for fingerspelling.
3. Determine facial non-manual marker: "question_brows_up", "pain_grimace", "affirmative_nod", "negative_headshake", or "neutral".
4. Provide both Kenyan Swahili and English translations.

Respond strictly in valid JSON format:
{
  "kslGloss": ["SIGN1", "SIGN2", ...],
  "swahiliText": "string in Kiswahili",
  "englishText": "string in English",
  "facialExpression": "question_brows_up" | "pain_grimace" | "affirmative_nod" | "negative_headshake" | "neutral",
  "clinicalIntent": "string explaining what is being conveyed to the Deaf patient"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('KSL Gloss error:', err?.message || err);
    // Reliable heuristic fallback for KSL
    const text = (req.body.speechText || '').toUpperCase();
    const gloss: string[] = [];
    if (/DOCTOR|DAKTARI/i.test(text)) gloss.push('DAKTARI');
    if (/HELP|MSAADA/i.test(text)) gloss.push('MSAADA');
    if (/PAIN|HURT|MAUMIVU/i.test(text)) gloss.push('MAUMIVU');
    if (/WATER|MAJI/i.test(text)) gloss.push('MAJI');
    if (/MEDICINE|DRUG|PILL|DAWA/i.test(text)) gloss.push('DAWA');
    if (/HOSPITAL|HOSPITALI/i.test(text)) gloss.push('HOSPITALI');
    if (/INJECTION|SYRINGE|SINDANO/i.test(text)) gloss.push('SINDANO');
    if (/EMERGENCY|DHARURA/i.test(text)) gloss.push('DHARURA');
    if (/WHERE|WAPI/i.test(text)) gloss.push('WAPI');
    if (/THANK|ASANTE/i.test(text)) gloss.push('ASANTE');
    if (/YES|NDIYO/i.test(text)) gloss.push('NDIYO');
    if (/NO|HAPANA/i.test(text)) gloss.push('HAPANA');

    if (gloss.length === 0) {
      // Default to fingerspelling first word
      const firstWord = (req.body.speechText || '').split(' ')[0] || 'HELLO';
      gloss.push(`SPELL:${firstWord}`);
    }

    res.json({
      kslGloss: gloss,
      swahiliText: req.body.speechText,
      englishText: req.body.speechText,
      facialExpression: text.includes('?') || /WHERE|WAPI/i.test(text) ? 'question_brows_up' : 'neutral',
      clinicalIntent: 'Communicated to patient in KSL'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Language Doctor Server' });
});

async function main() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Language Doctor running on http://0.0.0.0:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
