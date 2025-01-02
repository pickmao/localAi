import * as vscode from 'vscode';

export class CodeAnalysisService {
    constructor() {}

    public async getContextualCode(document: vscode.TextDocument, position: vscode.Position): Promise<string> {
        // 获取当前文件内容
        const text = document.getText();
        
        // 获取当前行
        const line = document.lineAt(position.line);
        
        // 获取当前函数或类的上下文
        const context = await this.getCurrentContext(document, position);
        
        return context;
    }

    private async getCurrentContext(document: vscode.TextDocument, position: vscode.Position): Promise<string> {
        try {
            // 获取当前位置的符号信息
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (!symbols) {
                return '';
            }

            // 查找包含当前位置的符号
            const containingSymbol = this.findContainingSymbol(symbols, position);
            if (containingSymbol) {
                const start = containingSymbol.range.start;
                const end = containingSymbol.range.end;
                return document.getText(new vscode.Range(start, end));
            }

            return '';
        } catch (error) {
            console.error('Error getting current context:', error);
            return '';
        }
    }

    private findContainingSymbol(symbols: vscode.DocumentSymbol[], position: vscode.Position): vscode.DocumentSymbol | undefined {
        for (const symbol of symbols) {
            if (symbol.range.contains(position)) {
                // 递归检查子符号
                const childSymbol = symbol.children && this.findContainingSymbol(symbol.children, position);
                return childSymbol || symbol;
            }
        }
        return undefined;
    }

    public async getImports(document: vscode.TextDocument): Promise<string> {
        const text = document.getText();
        const lines = text.split('\n');
        const imports: string[] = [];

        for (const line of lines) {
            if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
                imports.push(line.trim());
            }
        }

        return imports.join('\n');
    }
}
