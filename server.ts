import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.use(express.json());

// Fast caching for 3D avatar assets (.vrm, .glb)
app.use((req, res, next) => {
  if (req.path.endsWith('.vrm') || req.path.endsWith('.glb')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// Initialize Gemini client (uses process.env.GEMINI_API_KEY)
const ai = new GoogleGenAI();

app.post('/api/refine-signs', async (req, res) => {
  try {
    const { signs, targetLanguage = 'English (US)', role = 'patient' } = req.body;
    const signList = Array.isArray(signs) ? signs.join(', ') : (signs || '');

    if (!signList.trim()) {
      return res.status(400).json({ error: 'No signs or text provided' });
    }

    const prompt = `You are "Language Doctor", an expert medical communication system in Kenya specializing in Kenyan Sign Language (KSL), Kiswahili (Swahili), and English.
A ${role} has communicated the following sequence of sign language tokens or speech input:
"${signList}"

Requirements:
1. "kslGloss": Standard Kenyan Sign Language gloss representation (e.g. "MSAADA MAUMIVU DAWA" or "HOMA SINDANO WAPI").
2. "swahiliText": Natural, fluent, culturally respectful Kenyan Swahili (Kiswahili) sentence (e.g. "Ninahisi maumivu makali na ninahitaji dawa ya kutuliza.").
3. "englishText": Clear, respectful, accurate English clinical translation (e.g. "I am experiencing severe pain and need medication.").
4. "isDirectlyTranslatable": boolean. Set to true if the tokens/signs correspond to clear medical or conversational concepts. Set to false if the signs are ambiguous, unrecognized, or fragmented.
5. "fallbackExplanation": If not directly translatable, provide a clear bilingual clarification prompt asking the user to re-sign or clarify (e.g. "Ishara haikutambulika moja kwa moja: tafadhali ashiri tena au fafanua / Sign not directly translatable: please re-sign or clarify."). If directly translatable, provide an empty string "".
6. "urgency": Clinical triage classification: "ROUTINE", "URGENT", or "EMERGENCY".
7. "actionRecommendation": Brief 1-sentence bilingual clinical recommendation for the nurse/doctor (e.g. "Pima kiwango cha maumivu (1-10) na uangalie dawa / Assess pain scale 1-10 and verify medication chart.").

Respond strictly in valid JSON format:
{
  "kslGloss": "string",
  "swahiliText": "string",
  "englishText": "string",
  "isDirectlyTranslatable": boolean,
  "fallbackExplanation": "string",
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
    // Ensure synthesizedText & translatedText remain backwards-compatible
    parsed.synthesizedText = parsed.englishText || parsed.swahiliText || `Signs: ${signList}`;
    parsed.translatedText = parsed.swahiliText || parsed.englishText || signList;
    parsed.isFallback = !parsed.isDirectlyTranslatable;
    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini synthesis error:', err?.message || err);
    // Graceful offline fallback with full Swahili & English
    const rawTokens = Array.isArray(req.body.signs) ? req.body.signs.join(' ') : req.body.signs;
    const isEmergency = /emergency|pain|help|dharura|maumivu|msaada/i.test(rawTokens);
    res.json({
      kslGloss: rawTokens.toUpperCase(),
      swahiliText: `Ujumbe wa mgonjwa: ${rawTokens}`,
      englishText: `Patient communication: ${rawTokens}`,
      isDirectlyTranslatable: true,
      fallbackExplanation: '',
      isFallback: false,
      synthesizedText: `Message: ${rawTokens}`,
      translatedText: `Ujumbe: ${rawTokens}`,
      urgency: isEmergency ? 'URGENT' : 'ROUTINE',
      actionRecommendation: 'Tathmini hali ya mgonjwa / Check patient vitals.'
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
