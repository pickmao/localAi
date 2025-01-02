import * as vscode from 'vscode';

export class SettingItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly value: string,
        public readonly command?: vscode.Command
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = value;
        if (command) {
            this.command = command;
        }
    }
}

export class SettingsProvider implements vscode.TreeDataProvider<SettingItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SettingItem | undefined | null | void> = new vscode.EventEmitter<SettingItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SettingItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    dispose() {
        this._onDidChangeTreeData.dispose();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SettingItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SettingItem): Promise<SettingItem[]> {
        if (element) {
            return [];
        }

        const config = vscode.workspace.getConfiguration('localai');
        return [
            new SettingItem(
                'Ollama URL',
                config.get('ollamaUrl', 'http://localhost:11434'),
                {
                    command: 'localai.editSetting',
                    title: 'Edit Setting',
                    arguments: ['ollamaUrl']
                }
            ),
            new SettingItem(
                'Model',
                config.get('model', 'codellama'),
                {
                    command: 'localai.editSetting',
                    title: 'Edit Setting',
                    arguments: ['model']
                }
            ),
            new SettingItem(
                'Max Tokens',
                config.get('maxTokens', '2048').toString(),
                {
                    command: 'localai.editSetting',
                    title: 'Edit Setting',
                    arguments: ['maxTokens']
                }
            ),
            new SettingItem(
                'Temperature',
                config.get('temperature', '0.7').toString(),
                {
                    command: 'localai.editSetting',
                    title: 'Edit Setting',
                    arguments: ['temperature']
                }
            )
        ];
    }
}
