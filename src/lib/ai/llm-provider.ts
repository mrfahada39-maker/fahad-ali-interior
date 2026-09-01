export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class MultiProviderLlm {
  static async generateCompletion(
    systemPrompt: string,
    messages: LlmMessage[]
  ): Promise<{ text: string; provider: string } | null> {
    const conciseSystemPrompt = `${systemPrompt}\n\nCRITICAL OUTPUT REQUIREMENT:\n- Always give SHORT, CONCISE, ELEGANT, and ULTRA-CLEAR answers.\n- NEVER write long boring essays or repetitive text.\n- Use bold text and short bullet points to explain product details, price, material, and site pages clearly!`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 1. Try Official Google Gemini API
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
        for (const model of models) {
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
              systemInstruction: { parts: [{ text: conciseSystemPrompt }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return { text, provider: `Google Gemini (${model})` };
            }
          }
        }
      } catch (e) {
        console.warn('Gemini API call failed', e);
      }
    }

    // 2. Try OpenAI API
    if (openAiKey && !openAiKey.startsWith('AQ.') && openAiKey.trim().length > 10) {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const formattedMessages = [{ role: 'system', content: conciseSystemPrompt }, ...messages];

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
            max_tokens: 600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return { text, provider: `OpenAI (${model})` };
          }
        }
      } catch (e) {
        console.warn('OpenAI API call failed', e);
      }
    }

    // 3. Try Groq Cloud API
    if (groqKey && groqKey.trim().length > 10) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: conciseSystemPrompt }, ...messages],
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return { text, provider: 'Groq Llama 3.3 70B' };
          }
        }
      } catch (e) {
        console.warn('Groq API call failed', e);
      }
    }

    // 4. Try Keyless Real LLM Inference (ChatGPT GPT-4o / Llama 3.3)
    try {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Hello';
      const promptParam = encodeURIComponent(lastUserMsg);
      const systemParam = encodeURIComponent(conciseSystemPrompt);
      const pollUrl = `https://text.pollinations.ai/${promptParam}?model=openai&system=${systemParam}&seed=${Math.floor(Math.random() * 1000)}`;

      const pollRes = await fetch(pollUrl, {
        method: 'GET',
        cache: 'no-store',
      });

      if (pollRes.ok) {
        const text = await pollRes.text();
        if (text && text.trim().length > 5 && !text.includes('<!DOCTYPE html>')) {
          return { text: text.trim(), provider: 'ChatGPT GPT-4o (Live LLM)' };
        }
      }
    } catch (e) {
      console.warn('Keyless LLM call failed', e);
    }

    return null;
  }
}
