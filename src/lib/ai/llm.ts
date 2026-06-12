export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMOptions = {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
};

export async function invokeLLM(options: LLMOptions): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY || (globalThis as any).process?.env?.OPENAI_API_KEY;

  if (geminiKey) {
    // Standard Gemini 2.5 Flash API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    
    // Map system, user, assistant messages to Gemini's content format
    const systemInstruction = options.messages.find(m => m.role === "system")?.content;
    const contents = options.messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents,
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2048,
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini LLM Call failed: ${response.statusText} - ${err}`);
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(`Invalid response structure from Gemini API: ${JSON.stringify(data)}`);
    }
    return text;
  }

  if (openAIKey) {
    // Standard OpenAI API endpoint
    const url = "https://api.openai.com/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI LLM Call failed: ${response.statusText} - ${err}`);
    }

    const data = await response.json() as any;
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`Invalid response structure from OpenAI API: ${JSON.stringify(data)}`);
    }
    return text;
  }

  throw new Error("Missing AI Credentials. Please set GEMINI_API_KEY or OPENAI_API_KEY in your env configuration.");
}
