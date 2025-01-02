import * as vscode from 'vscode';
import { OllamaService } from './services/ollamaService';
import { CodeAnalysisService } from './services/codeAnalysisService';
import { CodeCompletionCommand } from './commands/codeCompletion';
import { ModelSelectionCommand } from './commands/modelSelection';
import { MainWebviewProvider } from './views/mainWebviewProvider';

// 插件激活时调用
export function activate(context: vscode.ExtensionContext) {
    console.log('Activating LocalAI extension...');
    
    // 初始化服务
    const ollamaService = new OllamaService();
    const codeAnalysisService = new CodeAnalysisService();
    
    // 初始化命令
    const codeCompletionCommand = new CodeCompletionCommand(ollamaService, codeAnalysisService);
    const modelSelectionCommand = new ModelSelectionCommand(ollamaService);

    // 注册主视图
    const mainViewProvider = new MainWebviewProvider(context.extensionUri, ollamaService);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('localai-main', mainViewProvider)
    );

    // 注册设置编辑命令
    let editSettingCommand = vscode.commands.registerCommand('localai.editSetting', async (setting: string) => {
        const config = vscode.workspace.getConfiguration('localai');
        const currentValue = config.get(setting);
        const newValue = await vscode.window.showInputBox({
            prompt: `Enter new value for ${setting}`,
            value: currentValue?.toString()
        });
        
        if (newValue !== undefined) {
            await config.update(setting, newValue, vscode.ConfigurationTarget.Global);
            mainViewProvider.refresh();
        }
    });

    // 注册命令
    let completionDisposable = vscode.commands.registerCommand(
        'localai.generateCompletion',
        () => {
            console.log('Executing generateCompletion command...');
            return codeCompletionCommand.provideCompletion();
        }
    );

    let modelSelectionDisposable = vscode.commands.registerCommand(
        'localai.selectModel',
        async (modelName: string) => {
            console.log('Executing selectModel command...');
            const config = vscode.workspace.getConfiguration('localai');
            await config.update('model', modelName, vscode.ConfigurationTarget.Global);
            mainViewProvider.refresh();
            vscode.window.showInformationMessage(`Selected model: ${modelName}`);
        }
    );

    // 创建状态栏项
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "$(symbol-keyword) LocalAI";
    statusBarItem.tooltip = "Click to generate code completion";
    statusBarItem.command = 'localai.generateCompletion';
    statusBarItem.show();

    // 添加到订阅列表
    context.subscriptions.push(completionDisposable);
    context.subscriptions.push(modelSelectionDisposable);
    context.subscriptions.push(editSettingCommand);
    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(mainViewProvider);
}

// 插件停用时调用
export function deactivate() {}