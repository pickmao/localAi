import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { CodeAnalysisService } from '../services/codeAnalysisService';

export class CodeCompletionCommand {
    constructor(
        private ollamaService: OllamaService,
        private codeAnalysisService: CodeAnalysisService
    ) {}

    public async provideCompletion() {
        console.log('Starting code completion...');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.log('No active editor found');
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;
        console.log('Current position:', position);

        try {
            // 获取代码上下文
            const context = await this.codeAnalysisService.getContextualCode(document, position);
            const imports = await this.codeAnalysisService.getImports(document);

            // 构建提示词
            const prompt = `Given the following code context and imports:

Imports:
${imports}

Context:
${context}

Please provide a completion for the next line of code.`;

            // 显示进度提示
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating code completion...",
                cancellable: true
            }, async (progress, token) => {
                // 调用Ollama服务获取补全
                const completion = await this.ollamaService.generateCompletion(prompt);

                // 插入补全内容
                editor.edit(editBuilder => {
                    editBuilder.insert(position, completion);
                });
            });

        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate code completion');
            console.error(error);
        }
    }
}
