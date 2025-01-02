import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';

export class MainWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly ollamaService: OllamaService
    ) {}

    public refresh() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    public dispose() {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 处理来自 WebView 的消息
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'loadModels':
                    try {
                        const models = await this.ollamaService.listModels();
                        const currentModel = vscode.workspace.getConfiguration('localai').get('model', '');
                        webviewView.webview.postMessage({ 
                            type: 'modelsLoaded', 
                            models: models,
                            currentModel: currentModel
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({ 
                            type: 'error', 
                            message: 'Failed to load models' 
                        });
                    }
                    break;
                case 'selectModel':
                    try {
                        await vscode.workspace.getConfiguration('localai').update(
                            'model',
                            message.model,
                            vscode.ConfigurationTarget.Global
                        );
                        webviewView.webview.postMessage({ 
                            type: 'modelSelected', 
                            model: message.model 
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({ 
                            type: 'error', 
                            message: 'Failed to select model' 
                        });
                    }
                    break;
                case 'chat':
                    try {
                        const model = vscode.workspace.getConfiguration('localai').get('model', '');
                        if (!model) {
                            throw new Error('No model selected');
                        }
                        const response = await this.ollamaService.chat(message.prompt, model);
                        webviewView.webview.postMessage({ 
                            type: 'chatResponse', 
                            response: response 
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({ 
                            type: 'error', 
                            message: 'Failed to get response' 
                        });
                    }
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <style>
                body {
                    padding: 0;
                    margin: 0;
                }
                .tab-container {
                    display: flex;
                    padding: 8px;
                    gap: 8px;
                    border-bottom: 1px solid var(--vscode-tab-border);
                }
                .tab {
                    padding: 6px 12px;
                    cursor: pointer;
                    border: none;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border-radius: 3px;
                }
                .tab.active {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .tab:hover:not(.active) {
                    background: var(--vscode-button-hoverBackground);
                }
                .tab-content {
                    display: none;
                    padding: 16px;
                }
                .tab-content.active {
                    display: block;
                }
                .model-list {
                    margin: 16px 0;
                }
                .model-item {
                    padding: 8px;
                    margin: 4px 0;
                    cursor: pointer;
                    border-radius: 3px;
                    background: var(--vscode-list-inactiveSelectionBackground);
                }
                .model-item:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                .model-item.selected {
                    background: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                }
                .button {
                    padding: 6px 12px;
                    cursor: pointer;
                    border: none;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border-radius: 3px;
                }
                .button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .error {
                    color: var(--vscode-errorForeground);
                    margin: 8px 0;
                }
                .settings-actions {
                    margin-top: 16px;
                }
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 120px);
                }
                .messages {
                    flex-grow: 1;
                    overflow-y: auto;
                    margin-bottom: 16px;
                    padding: 8px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                }
                .message {
                    margin: 8px 0;
                    padding: 8px;
                    border-radius: 3px;
                }
                .message.user {
                    background: var(--vscode-editor-lineHighlightBackground);
                    margin-left: 20%;
                }
                .message.assistant {
                    background: var(--vscode-editor-selectionBackground);
                    margin-right: 20%;
                }
                .input-container {
                    display: flex;
                    gap: 8px;
                }
                .chat-input {
                    flex-grow: 1;
                    padding: 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                }
                .chat-input:focus {
                    outline: none;
                    border-color: var(--vscode-focusBorder);
                }
            </style>
        </head>
        <body>
            <div class="tab-container">
                <button class="tab active" data-tab="settings">Settings</button>
                <button class="tab" data-tab="chat">Chat</button>
                <button class="tab" data-tab="models">Models</button>
            </div>
            <div class="content">
                <div id="settings" class="tab-content active">
                    <div>Please select a model to continue:</div>
                    <div id="error" class="error" style="display: none;"></div>
                    <div id="modelList" class="model-list">Loading available models...</div>
                    <div class="settings-actions">
                        <button class="button" id="doneBtn" disabled>Done</button>
                    </div>
                </div>
                <div id="chat" class="tab-content">
                    <div class="chat-container">
                        <div id="messages" class="messages"></div>
                        <div class="input-container">
                            <input type="text" id="chatInput" class="chat-input" placeholder="Type your message here...">
                            <button class="button" id="sendBtn">Send</button>
                        </div>
                    </div>
                </div>
                <div id="models" class="tab-content">Models Page</div>
            </div>
            <script nonce="${nonce}">
                (function() {
                    const vscode = acquireVsCodeApi();
                    const tabs = document.querySelectorAll('.tab');
                    const contents = document.querySelectorAll('.tab-content');
                    const modelList = document.getElementById('modelList');
                    const errorDiv = document.getElementById('error');
                    const doneBtn = document.getElementById('doneBtn');
                    const chatInput = document.getElementById('chatInput');
                    const sendBtn = document.getElementById('sendBtn');
                    const messages = document.getElementById('messages');
                    let selectedModel = null;

                    // 标签切换函数
                    function switchToTab(tabId) {
                        tabs.forEach(t => t.classList.remove('active'));
                        contents.forEach(c => c.classList.remove('active'));
                        document.querySelector(\`[data-tab="\${tabId}"]\`).classList.add('active');
                        document.getElementById(tabId).classList.add('active');
                        if (tabId === 'chat') {
                            chatInput.focus();
                        }
                    }

                    // 添加消息到聊天界面
                    function addMessage(content, isUser) {
                        const div = document.createElement('div');
                        div.className = \`message \${isUser ? 'user' : 'assistant'}\`;
                        div.textContent = content;
                        messages.appendChild(div);
                        messages.scrollTop = messages.scrollHeight;
                    }

                    // 发送消息
                    function sendMessage() {
                        const message = chatInput.value.trim();
                        if (message) {
                            addMessage(message, true);
                            chatInput.value = '';
                            chatInput.focus();
                            vscode.postMessage({ 
                                type: 'chat', 
                                prompt: message 
                            });
                        }
                    }

                    // 标签切换事件
                    tabs.forEach(tab => {
                        tab.addEventListener('click', () => {
                            switchToTab(tab.getAttribute('data-tab'));
                        });
                    });

                    // Done 按钮事件
                    doneBtn.addEventListener('click', () => {
                        if (selectedModel) {
                            switchToTab('chat');
                        }
                    });

                    // 发送按钮事件
                    sendBtn.addEventListener('click', sendMessage);

                    // 输入框回车事件
                    chatInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });

                    // 自动加载模型
                    vscode.postMessage({ type: 'loadModels' });

                    // 处理来自扩展的消息
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'modelsLoaded':
                                modelList.innerHTML = message.models.map(model => {
                                    const isSelected = model.name === message.currentModel;
                                    if (isSelected) {
                                        selectedModel = model.name;
                                        doneBtn.disabled = false;
                                    }
                                    return \`<div class="model-item \${isSelected ? 'selected' : ''}" data-model="\${model.name}">\${model.name}</div>\`;
                                }).join('');

                                document.querySelectorAll('.model-item').forEach(item => {
                                    item.addEventListener('click', () => {
                                        document.querySelectorAll('.model-item').forEach(m => 
                                            m.classList.remove('selected')
                                        );
                                        item.classList.add('selected');
                                        selectedModel = item.dataset.model;
                                        doneBtn.disabled = false;
                                        vscode.postMessage({ 
                                            type: 'selectModel', 
                                            model: selectedModel 
                                        });
                                    });
                                });
                                break;

                            case 'chatResponse':
                                addMessage(message.response, false);
                                break;

                            case 'error':
                                errorDiv.textContent = message.message;
                                errorDiv.style.display = 'block';
                                if (message.type === 'error' && message.message.includes('models')) {
                                    modelList.innerHTML = '';
                                    doneBtn.disabled = true;
                                }
                                break;
                        }
                    });
                })();
            </script>
        </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
