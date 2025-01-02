import * as vscode from 'vscode';
import { OllamaService, OllamaModel } from '../services/ollamaService';
import { ConfigUtils } from '../utils/configUtils';

export class ModelSelectionCommand {
    constructor(private ollamaService: OllamaService) {}

    public async showModelPicker() {
        try {
            // 显示加载提示
            const models = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Fetching available models...",
                cancellable: false
            }, async () => {
                return await this.ollamaService.listModels();
            });

            // 准备快速选择项
            const quickPickItems = models.map(model => ({
                label: this.formatModelDetails(model),
                description: '',
                detail: '',
                model: model
            }));

            // 显示模型选择界面
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select a model to use',
                matchOnDescription: true,
                matchOnDetail: true
            });

            if (selectedItem) {
                // 更新配置
                await ConfigUtils.updateConfig({
                    model: selectedItem.model.name
                });

                // 更新服务配置
                this.ollamaService.updateConfig({
                    model: selectedItem.model.name
                });

                vscode.window.showInformationMessage(`Model switched to ${selectedItem.model.name}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch models. Please check if Ollama is running.');
        }
    }

    private formatModelDetails(model: { name: string; size?: number; modified_at?: string }): string {
        const name = model.name;
        let details = '';
        
        if (model.size !== undefined) {
            details += ` (${this.formatSize(model.size)})`;
        }
        
        if (model.modified_at) {
            details += ` - Modified: ${new Date(model.modified_at).toLocaleDateString()}`;
        }
        
        return `${name}${details}`;
    }

    private formatSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}
