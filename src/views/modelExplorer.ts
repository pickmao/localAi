import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';

export class ModelTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}

export class ModelExplorerProvider implements vscode.TreeDataProvider<ModelTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ModelTreeItem | undefined | null | void> = new vscode.EventEmitter<ModelTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ModelTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private ollamaService: OllamaService) {}

    dispose() {
        this._onDidChangeTreeData.dispose();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ModelTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ModelTreeItem): Promise<ModelTreeItem[]> {
        if (element) {
            return [];
        }

        try {
            const models = await this.ollamaService.listModels();
            return models.map(model => new ModelTreeItem(
                model.name,
                vscode.TreeItemCollapsibleState.None,
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
}
