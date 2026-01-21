import * as vscode from 'vscode';
import { MetadataParser } from './MetadataParser';
import * as path from 'path';
import { Logger } from '../utils/Logger';

export interface Dependency {
    filePath: string;
    fileName: string;
    type: string;
    locations: string[]; // For now just storing "found" validation
}

export class DependencyFinder {
    private parser: MetadataParser;

    constructor() {
        this.parser = new MetadataParser();
    }

    public async findDependencies(fieldName: string, token?: vscode.CancellationToken): Promise<Dependency[]> {
        const dependencies: Dependency[] = [];

        // Updated glob to include:
        // - Apex: .cls
        // - LWC: .js, .html
        // - Validation Rules: .validationRule-meta.xml
        // - Flows: .flow-meta.xml
        // - Fields (formulas): .field-meta.xml
        // - Objects (containing validation rules/formulas): .object-meta.xml
        const pattern = '**/*.{layout-meta.xml,flexipage-meta.xml,cls,js,html,validationRule-meta.xml,flow-meta.xml,field-meta.xml,object-meta.xml}';
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

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
                        type: this.determineType(uri.fsPath),
                        locations: ['Found in file']
                    });
                }
            } catch (e) {
                Logger.error(`Failed to read file ${uri.fsPath}`, e);
            }
        }

        return dependencies;
    }

    private determineType(filePath: string): 'Layout' | 'Flexipage' | 'Apex Class' | 'LWC' | 'Validation Rule' | 'Flow' | 'Field' | 'Custom Object' | 'Other' {
        if (filePath.endsWith('layout-meta.xml')) return 'Layout';
        if (filePath.endsWith('flexipage-meta.xml')) return 'Flexipage';
        if (filePath.endsWith('.cls')) return 'Apex Class';
        if (filePath.endsWith('.js') || filePath.endsWith('.html')) return 'LWC';
        if (filePath.endsWith('validationRule-meta.xml')) return 'Validation Rule';
        if (filePath.endsWith('flow-meta.xml')) return 'Flow';
        if (filePath.endsWith('field-meta.xml')) return 'Field';
        if (filePath.endsWith('object-meta.xml')) return 'Custom Object';
        return 'Other';
    }
}
