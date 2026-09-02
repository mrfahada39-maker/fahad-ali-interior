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

## UNIVERSAL SUPER-INTELLIGENT AI IDENTITY (ChatGPT / Claude / DeepSeek / Groq Level):
- You are a world-class, super-intelligent AI endowed with comprehensive universal knowledge across ALL domains (Science, Technology, History, Mathematics, Medicine, Coding, Literature, World Geopolitics, Art, Philosophy, Daily Life Advice, Poetry, etc.).
- You are ALSO the Executive AI Ambassador for **FAHAD ALI INTERIOR** (Lahore, Pakistan).
- You speak fluent, natural, respectful **Roman Urdu, Urdu script, English, and any language the user speaks**.
- **UNIVERSAL CAPABILITY:** You can answer ANY question about anything in the world with high intelligence, nuance, and clarity.
- **FURNITURE & STORE CONTEXT:** When the user asks about furniture, interior design, prices, materials, or room decoration, you seamlessly use your specialized knowledge of 100% Solid Seasoned Sheesham Wood (8-12% moisture kiln-dried, lifetime anti-termite guarantee), room layouts, custom sizing, and promo code **LUXURY10** (10% instant discount).
- Always deliver clear, helpful, well-structured answers with markdown bolding and bullet points. Never refuse to answer legitimate general knowledge queries!`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // ── 1. Priority 1: High-Speed Groq Cloud LLMs (GPT-OSS-120B / Qwen-27B / GPT-OSS-20B) ──
    if (groqKey && groqKey.trim().length > 10) {
      const groqModels = [
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.6-27b',
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
              temperature: 0.6,
              max_tokens: 380,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text && text.trim().length > 5) {
              return { text: text.trim(), provider: `Groq (${model})` };
            }
          }
        } catch (e) {
          console.warn(`Groq ${model} attempt error:`, e);
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
              generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
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
          console.warn(`Gemini ${model} attempt error:`, e);
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
            max_tokens: 800,
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
        console.warn('OpenAI attempt error:', e);
      }
    }

    // ── 4. Priority 4: Direct Fallback Live LLM Inference ──
    try {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Hello';
      const promptParam = encodeURIComponent(lastUserMsg);
      const systemParam = encodeURIComponent(enrichedSystemPrompt);
      const pollUrl = `https://text.pollinations.ai/${promptParam}?model=openai&system=${systemParam}&seed=${Math.floor(Math.random() * 1000)}`;

      const pollRes = await fetch(pollUrl, {
        method: 'GET',
        cache: 'no-store',
      });

      if (pollRes.ok) {
        const text = await pollRes.text();
        if (text && text.trim().length > 5 && !text.includes('<!DOCTYPE html>')) {
          return { text: text.trim(), provider: 'ChatGPT GPT-4o (Live LLM Engine)' };
        }
      }
    } catch (e) {
      console.warn('Direct LLM fallback error:', e);
    }

    return null;
  }
}
