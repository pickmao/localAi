import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';

export class MainViewItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        if (command) {
            this.command = command;
        }
        if (contextValue) {
            this.contextValue = contextValue;
        }
    }
}

export class MainViewProvider implements vscode.TreeDataProvider<MainViewItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MainViewItem | undefined | null | void> = new vscode.EventEmitter<MainViewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MainViewItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private ollamaService: OllamaService) {}

    dispose() {
        this._onDidChangeTreeData.dispose();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MainViewItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: MainViewItem): Promise<MainViewItem[]> {
        if (element) {
            if (element.contextValue === 'settings') {
                const config = vscode.workspace.getConfiguration('localai');
                return [
                    new MainViewItem(
                        `Ollama URL: ${config.get('ollamaUrl', 'http://localhost:11434')}`,
                        vscode.TreeItemCollapsibleState.None,
                        'setting-item',
                        {
                            command: 'localai.editSetting',
                            title: 'Edit Setting',
                            arguments: ['ollamaUrl']
                        }
                    ),
                    new MainViewItem(
                        `Model: ${config.get('model', 'codellama')}`,
                        vscode.TreeItemCollapsibleState.None,
                        'setting-item',
                        {
                            command: 'localai.editSetting',
                            title: 'Edit Setting',
                            arguments: ['model']
                        }
                    ),
                    new MainViewItem(
                        `Max Tokens: ${config.get('maxTokens', '2048')}`,
                        vscode.TreeItemCollapsibleState.None,
                        'setting-item',
                        {
                            command: 'localai.editSetting',
                            title: 'Edit Setting',
                            arguments: ['maxTokens']
                        }
                    ),
                    new MainViewItem(
                        `Temperature: ${config.get('temperature', '0.7')}`,
                        vscode.TreeItemCollapsibleState.None,
                        'setting-item',
                        {
                            command: 'localai.editSetting',
                            title: 'Edit Setting',
                            arguments: ['temperature']
                        }
                    )
                ];
            } else if (element.contextValue === 'models') {
                try {
                    const models = await this.ollamaService.listModels();
                    return models.map(model => new MainViewItem(
                        model.name,
                        vscode.TreeItemCollapsibleState.None,
                        'model-item',
                        {
                            command: 'localai.selectModel',
                            title: 'Select Model',
                            arguments: [model.name]
                        }
                    ));
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to fetch models from Ollama');
                    return [];
                }
            }
            return [];
        }

        // 顶级项目
        const navigationButtons = [
            new MainViewItem(
                '⚙️ Settings',
                vscode.TreeItemCollapsibleState.Expanded,
                'settings'
            ),
            new MainViewItem(
                '🤖 Models',
                vscode.TreeItemCollapsibleState.Expanded,
                'models'
            )
        ];

        return navigationButtons;
    }
}
