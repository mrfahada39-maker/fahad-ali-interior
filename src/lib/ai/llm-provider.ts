import { logger } from '@/lib/logger';
export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class MultiProviderLlm {
  static async generateCompletion(
    systemPrompt: string,
    messages: LlmMessage[]
  ): Promise<{ text: string; provider: string } | null> {
    const enrichedSystemPrompt = `${systemPrompt}

## COMPREHENSIVE AI INTELLIGENCE & COMMUNICATION EXCELLENCE (ChatGPT / Gemini / Groq Level):
- You are a world-class, super-intelligent AI endowed with comprehensive universal knowledge across ALL domains (Interior Architecture, Fine Woodworking, Furniture Design, Color Theory, Room Acoustics, Materials, Pricing, and Worldwide General Knowledge).
- You are ALSO the Senior Executive AI Concierge & Ambassador for **FAHAD ALI INTERIOR** (Chiniot & Lahore, Pakistan).
- You speak fluent, natural, respectful **Roman Urdu, Urdu script, English, and any language the user speaks**.
- **COMPREHENSIVE ANSWERS:** Deliver full, articulate, deeply helpful answers like ChatGPT and Gemini. Provide structured markdown headings (###), comparison tables for products/prices, and bullet points. Never provide cut-off, lazy, or truncated one-sentence answers!
- **FURNITURE & STORE CONTEXT:** When answering furniture or interior queries, seamlessly use your deep knowledge of 100% Solid Seasoned Sheesham Wood (8–12% moisture kiln-dried, official 10-year anti-termite guarantee), room layouts, custom dimensions, and any active promo vouchers.
- **DOMAIN BOUNDARY:** Stay focused on Interior Architecture, Furniture Design, Room Planning, Woodcraft, Home Styling, Order Assistance, and Fahad Ali Interior services. Politely redirect unrelated coding, homework, or off-topic requests back to interior design and furniture assistance.`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // ── 1. Priority 1: High-Speed Groq Cloud LLMs (Llama 3.3 70B & Llama 3.1 8B) ──
    if (groqKey && groqKey.trim().length > 10) {
      const groqModels = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
      ];

      for (const model of groqModels) {
        try {
          const formattedMessages = [{ role: 'system', content: enrichedSystemPrompt }, ...messages];
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey.trim()}`,
            },
            body: JSON.stringify({
              model,
              messages: formattedMessages,
              temperature: 0.7,
              max_tokens: 2048,
            }),
            signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(6000) : undefined,
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text && text.trim().length > 5) {
              return { text: text.trim(), provider: `Groq (${model})` };
            }
          }
        } catch (e) {
          logger.warn(`Groq ${model} attempt error:`, { detail: String(e) });
        }
      }
    }

    // ── 2. Priority 2: Official Google Gemini ──
    if (geminiKey && !geminiKey.startsWith('AQ.') && geminiKey.trim().length > 10) {
      const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      for (const model of geminiModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`;
          const contents = messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: { parts: [{ text: enrichedSystemPrompt }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim().length > 5) {
              return { text: text.trim(), provider: `Google Gemini (${model})` };
            }
          }
        } catch (e) {
          logger.warn(`Gemini ${model} attempt error:`, { detail: String(e) });
        }
      }
    }

    // ── 3. Priority 3: OpenAI (GPT-4o / GPT-4o-mini) ──
    if (openAiKey && openAiKey.startsWith('sk-') && openAiKey.trim().length > 10) {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const formattedMessages = [{ role: 'system', content: enrichedSystemPrompt }, ...messages];

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: 2500,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text && text.trim().length > 5) {
            return { text: text.trim(), provider: `OpenAI (${model})` };
          }
        }
      } catch (e) {
        logger.warn('OpenAI attempt error:', { detail: String(e) });
      }
    }

    // Note: External unauthenticated GET URL fallbacks (e.g. text.pollinations.ai) are intentionally
    // disabled so system prompts and customer messages are never leaked in third-party GET URLs.
    return null;
  }
}
