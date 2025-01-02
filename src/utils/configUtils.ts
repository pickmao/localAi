import * as vscode from 'vscode';

export interface LocalAIConfig {
    ollamaUrl: string;
    model: string;
    maxTokens: number;
    temperature: number;
}

export class ConfigUtils {
    private static readonly CONFIG_SECTION = 'localai';

    public static getConfig(): LocalAIConfig {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        
        return {
            ollamaUrl: config.get('ollamaUrl', 'http://localhost:11434'),
            model: config.get('model', 'codellama'),
            maxTokens: config.get('maxTokens', 2048),
            temperature: config.get('temperature', 0.7)
        };
    }

    public static async updateConfig(settings: Partial<LocalAIConfig>): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        
        for (const [key, value] of Object.entries(settings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
    }
}
