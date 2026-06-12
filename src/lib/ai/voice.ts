export type TranscribeOptions = {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
  prompt?: string;
};

export async function transcribeAudio(options: TranscribeOptions): Promise<{ text: string; language?: string }> {
  const geminiKey = process.env.GEMINI_API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY || (globalThis as any).process?.env?.OPENAI_API_KEY;

  if (geminiKey) {
    // Gemini 2.5 Flash supports native audio ingestion via inlineData!
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const base64Data = options.audioBuffer.toString("base64");

    const promptText = options.prompt 
      ? `${options.prompt}. Transcribe the audio.`
      : "Transcribe the user's voice message. Transcribe exactly what is spoken. If it is in Moroccan Arabic (Darija), French, or English, transcribe it correctly in that language. Output ONLY the transcription, nothing else.";

    const payload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: options.mimeType,
                data: base64Data
              }
            },
            {
              text: promptText
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.0 // Low temperature for highly deterministic transcription
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Audio Transcription failed: ${response.statusText} - ${err}`);
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error(`Invalid response structure from Gemini Audio API: ${JSON.stringify(data)}`);
    }

    return { text };
  }

  if (openAIKey) {
    // OpenAI Whisper API endpoint
    const url = "https://api.openai.com/v1/audio/transcriptions";
    const formData = new FormData();
    
    // Create a blob from buffer
    const filename = `audio.${getFileExtension(options.mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(options.audioBuffer)], { type: options.mimeType });
    formData.append("file", audioBlob, filename);
    formData.append("model", "whisper-1");
    if (options.language) {
      formData.append("language", options.language);
    }
    if (options.prompt) {
      formData.append("prompt", options.prompt);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Whisper Transcription failed: ${response.statusText} - ${err}`);
    }

    const data = await response.json() as any;
    return {
      text: data.text,
      language: data.language
    };
  }

  throw new Error("Missing AI Credentials for Audio Transcription. Please set GEMINI_API_KEY or OPENAI_API_KEY.");
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
  };
  return mimeToExt[mimeType] || 'audio';
}
