import * as vscode from 'vscode';
import { MetadataParser } from './MetadataParser';
import * as path from 'path';
import { Logger } from '../utils/Logger';

export interface Dependency {
    filePath: string;
    fileName: string;
    type: 'Layout' | 'Flexipage' | 'Other';
    locations: string[]; // For now just storing "found" validation
}

export class DependencyFinder {
    private parser: MetadataParser;

    constructor() {
        this.parser = new MetadataParser();
    }

    public async findDependencies(fieldName: string, token?: vscode.CancellationToken): Promise<Dependency[]> {
        const dependencies: Dependency[] = [];

        // Use findFiles to respect .gitignore and use VS Code's optimized search
        const files = await vscode.workspace.findFiles('**/*.{layout-meta.xml,flexipage-meta.xml}', '**/node_modules/**');

        for (const uri of files) {
            if (token && token.isCancellationRequested) {
                return dependencies;
            }

            try {
                const content = await vscode.workspace.fs.readFile(uri);
                const textContent = Buffer.from(content).toString('utf-8');

                if (textContent.includes(fieldName)) {
                    dependencies.push({
                        filePath: uri.fsPath,
                        fileName: path.basename(uri.fsPath),
                        type: uri.fsPath.endsWith('layout-meta.xml') ? 'Layout' : 'Flexipage',
                        locations: ['Found in file']
                    });
                }
            } catch (e) {
                Logger.error(`Failed to read file ${uri.fsPath}`, e);
            }
        }

        return dependencies;
    }
}
