import * as vscode from 'vscode';
import * as fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

export class MetadataParser {
    private parser: XMLParser;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true
        });
    }

    public async parseFile(filePath: string): Promise<any> {
        try {
            const fileContent = await fs.promises.readFile(filePath, 'utf-8');
            return this.parser.parse(fileContent);
        } catch (error) {
            console.error(`Error parsing file ${filePath}:`, error);
            return null;
        }
    }
}
