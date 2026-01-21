import * as vscode from 'vscode';
import { DependencySidebar, DependencyItem } from './ui/DependencySidebar';
import { Logger } from './utils/Logger';

export function activate(context: vscode.ExtensionContext) {
    Logger.log('Congratulations, your extension "field-cleaner" is now active!');

    const sidebarProvider = new DependencySidebar();
    vscode.window.registerTreeDataProvider('fieldDependencies', sidebarProvider);

    let searchCommand = vscode.commands.registerCommand('field-cleaner.searchField', async () => {
        const fieldName = await vscode.window.showInputBox({
            placeHolder: 'Enter Field Name (e.g. Account.MyField__c)',
            prompt: 'Scan for field usage'
        });
        if (fieldName) {
            await sidebarProvider.searchField(fieldName);
        }
    });

    let removeCommand = vscode.commands.registerCommand('field-cleaner.removeDependency', async (item: DependencyItem) => {
        await sidebarProvider.removeDependency(item);
    });

    let removeAllCommand = vscode.commands.registerCommand('field-cleaner.removeAll', async () => {
        await sidebarProvider.removeAllDependencies();
    });

    let openFileCommand = vscode.commands.registerCommand('field-cleaner.openFile', (filePath: string) => {
        vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    });

    context.subscriptions.push(searchCommand);
    context.subscriptions.push(removeCommand);
    context.subscriptions.push(removeAllCommand);
    context.subscriptions.push(openFileCommand);
}

export function deactivate() { }
