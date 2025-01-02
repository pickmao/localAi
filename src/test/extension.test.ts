import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Extension Test Suite', () => {
    beforeAll(async () => {
        await vscode.extensions.getExtension('yourusername.localai')?.activate();
    });

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('yourusername.localai'));
    });

    test('Should register all commands', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('localai.generateCompletion'));
        assert.ok(commands.includes('localai.selectModel'));
    });

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
});
