// A simple wrapper to interact with the Transformers.js Web Worker

export class AIEmbeddings {
    private static worker: Worker | null = null;
    private static callbacks: Map<string, (output: number[]) => void> = new Map();
    private static progressCallback: ((progress: any) => void) | null = null;

    static init(onProgress?: (progress: any) => void) {
        if (!this.worker) {
            this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module'
            });

            this.worker.addEventListener('message', (event) => {
                const data = event.data;
                if (data.type === 'progress' && this.progressCallback) {
                    this.progressCallback(data);
                } else if (data.type === 'result') {
                    const cb = this.callbacks.get(data.text);
                    if (cb) {
                        cb(data.output);
                        this.callbacks.delete(data.text);
                    }
                }
            });
        }
        if (onProgress) {
            this.progressCallback = onProgress;
        }
    }

    static async getEmbedding(text: string): Promise<number[]> {
        if (!this.worker) this.init();

        return new Promise((resolve) => {
            this.callbacks.set(text, resolve);
            this.worker!.postMessage({ text, type: 'embed' });
        });
    }

    // Compute cosine similarity between two vectors
    static cosineSimilarity(a: number[], b: number[]) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
