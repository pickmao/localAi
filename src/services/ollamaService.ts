import * as vscode from 'vscode';
import axios from 'axios';

export interface OllamaConfig {
    baseUrl: string;
    model: string;
}

export interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
    digest: string;
}

export class OllamaService {
    private config: OllamaConfig;

    constructor() {
        this.config = {
            baseUrl: vscode.workspace.getConfiguration('localai').get('ollamaUrl', 'http://localhost:11434'),
            model: 'codellama'
        };
    }

    private getBaseUrl(): string {
        return vscode.workspace.getConfiguration('localai').get('ollamaUrl', 'http://localhost:11434');
    }

    public async listModels(): Promise<{ name: string; size?: number; modified_at?: string }[]> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json() as { models: { name: string; size?: number; modified_at?: string }[] };
            return data.models || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }

    public async listModelsOld(): Promise<OllamaModel[]> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/api/tags`);
            return response.data.models;
        } catch (error) {
            console.error('Error fetching models:', error);
            throw new Error('Failed to fetch models from Ollama');
        }
    }

    public async generateCompletion(prompt: string): Promise<string> {
        try {
            const response = await axios.post(`${this.config.baseUrl}/api/generate`, {
                model: this.config.model,
                prompt: prompt,
                stream: false
            });

            return response.data.response;
        } catch (error) {
            console.error('Error calling Ollama API:', error);
            throw new Error('Failed to generate completion from Ollama');
        }
    }

    public async streamCompletion(
        prompt: string,
        onToken: (token: string) => void
    ): Promise<void> {
        try {
            const response = await axios.post(
                `${this.config.baseUrl}/api/generate`,
                {
                    model: this.config.model,
                    prompt: prompt,
                    stream: true
                },
                {
                    responseType: 'stream'
                }
            );

            for await (const chunk of response.data) {
                const data = JSON.parse(chunk.toString());
                if (data.response) {
                    onToken(data.response);
                }
            }
        } catch (error) {
            console.error('Error in stream completion:', error);
            throw new Error('Failed to stream completion from Ollama');
        }
    }

    public async chat(prompt: string, model: string): Promise<string> {
        try {
            const response = await axios.post(`${this.getBaseUrl()}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: false
            });
            return response.data.response;
        } catch (error) {
            console.error('Error in chat:', error);
            throw error;
        }
    }

    public updateConfig(config: Partial<OllamaConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
