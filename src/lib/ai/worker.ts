import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser and want to download it from HuggingFace
env.allowLocalModels = false;

// We use the Singleton pattern so that the pipeline is only loaded once.
class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: any = null;

    static async getInstance(progress_callback?: Function) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    // We expect the message to have a `text` property
    const { text, type } = event.data;

    // Load the pipeline
    const extractor = await PipelineSingleton.getInstance((x: any) => {
        // We also send a progress message to update the UI
        self.postMessage({ status: x.status, name: x.name, file: x.file, progress: x.progress, type: 'progress' });
    });

    if (type === 'embed') {
        // Generate the embeddings
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        // Send the output back to the main thread
        self.postMessage({
            status: 'complete',
            output: Array.from(output.data),
            text: text,
            type: 'result'
        });
    }
});
