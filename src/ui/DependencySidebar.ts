import * as vscode from 'vscode';
import { DependencyFinder, Dependency } from '../scanner/DependencyFinder';
import { XmlModifier } from '../remover/XmlModifier';

export class DependencySidebar implements vscode.TreeDataProvider<DependencyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DependencyItem | undefined | null | void> = new vscode.EventEmitter<DependencyItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DependencyItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private finder: DependencyFinder;
    private modifier: XmlModifier;
    private currentField: string = '';
    private dependencies: Dependency[] = [];

    constructor() {
        this.finder = new DependencyFinder();
        this.modifier = new XmlModifier();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    // Command to set the field to search for
    async searchField(fieldName: string) {
        this.currentField = fieldName;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Scanning for usage of ${fieldName}...`,
            cancellable: true
        }, async (progress, token) => {
            this.dependencies = await this.finder.findDependencies(fieldName, token);
            this.refresh();
        });
    }

    async removeDependency(item: DependencyItem) {
        if (!item.dependency) {
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to remove field "${this.currentField}" from ${item.dependency.fileName}?`,
            'Yes', 'No'
        );

        if (confirm === 'Yes') {
            const success = await this.modifier.removeFieldDependency(item.dependency.filePath, this.currentField);
            if (success) {
                vscode.window.showInformationMessage(`Removed dependency from ${item.dependency.fileName}`);
                // Refresh list
                await this.searchField(this.currentField);
            } else {
                vscode.window.showErrorMessage(`Failed to remove dependency from ${item.dependency.fileName}. Check console for details.`);
            }
        }
    }

    async removeAllDependencies() {
        if (this.dependencies.length === 0) {
            vscode.window.showInformationMessage('No dependencies to remove.');
            return;
        }

        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to remove field "${this.currentField}" from ALL ${this.dependencies.length} files?`,
            'Yes', 'No'
        );

        if (confirm !== 'Yes') {
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Removing ${this.currentField} from ${this.dependencies.length} files...`,
            cancellable: true
        }, async (progress, token) => {
            let successCount = 0;
            let failCount = 0;
            const total = this.dependencies.length;

            for (let i = 0; i < total; i++) {
                if (token.isCancellationRequested) {
                    break;
                }
                const dep = this.dependencies[i];
                progress.report({ message: `Processing ${dep.fileName}`, increment: (1 / total) * 100 });

                const success = await this.modifier.removeFieldDependency(dep.filePath, this.currentField);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            vscode.window.showInformationMessage(`Finished. Removed: ${successCount}. Failed: ${failCount}.`);
            await this.searchField(this.currentField);
        });
    }

    getTreeItem(element: DependencyItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DependencyItem): Thenable<DependencyItem[]> {
        if (!this.currentField) {
            return Promise.resolve([new DependencyItem('No field selected. Run "Find Field Dependencies" command.', vscode.TreeItemCollapsibleState.None)]);
        }

        if (element) {
            return Promise.resolve([]); // No nesting for now
        } else {
            if (this.dependencies.length === 0) {
                return Promise.resolve([new DependencyItem(`No dependencies found for ${this.currentField}`, vscode.TreeItemCollapsibleState.None)]);
            }
            return Promise.resolve(this.dependencies.map(dep => {
                return new DependencyItem(
                    dep.fileName,
                    vscode.TreeItemCollapsibleState.None,
                    dep,
                    {
                        command: 'field-cleaner.openFile',
                        title: 'Open File',
                        arguments: [dep.filePath]
                    }
                );
            }));
        }
    }
}

export class DependencyItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly dependency?: Dependency,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = dependency ? `Found in ${dependency.filePath}` : label;
        this.description = dependency ? dependency.type : '';

        if (dependency) {
            // Only allow automated removal for supported types
            if (dependency.type === 'Layout' || dependency.type === 'Flexipage') {
                this.contextValue = 'dependencyItem'; // Enables "Remove" action
            } else {
                this.contextValue = 'manualDependencyItem'; // No removal action
            }
        }
    }
}
