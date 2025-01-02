import * as vscode from 'vscode';

export class NavigationItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly command: vscode.Command,
        public readonly icon: string,
        public readonly isContainer: boolean = false
    ) {
        super(label, isContainer ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon(icon);
        this.command = command;
    }
}

export class NavigationProvider implements vscode.TreeDataProvider<NavigationItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<NavigationItem | undefined | null | void> = new vscode.EventEmitter<NavigationItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<NavigationItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    dispose() {
        this._onDidChangeTreeData.dispose();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: NavigationItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: NavigationItem): Promise<NavigationItem[]> {
        if (element) {
            return [];
        }

        // 创建一个容器项
        const container = new NavigationItem(
            'Navigation',
            {
                command: '',
                title: ''
            },
            'list-flat',
            true
        );

        // 在容器中添加横向排列的按钮
        const buttons = [
            new NavigationItem(
                'Settings',
                {
                    command: 'localai.openSettings',
                    title: 'Open Settings',
                    arguments: []
                },
                'gear'
            ),
            new NavigationItem(
                'Chat',
                {
                    command: 'localai.openChat',
                    title: 'Open Chat',
                    arguments: []
                },
                'comment-discussion'
            )
        ];

        // 为每个按钮添加特殊样式
        buttons.forEach((button, index) => {
            button.tooltip = button.label;
            // 添加自定义 CSS 类
            (button as any).className = 'navigation-button';
            // 使用内联样式控制布局
            if (index > 0) {
                (button as any).description = '  '; // 添加间距
            }
        });

        return buttons;
    }
}
