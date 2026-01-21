import * as vscode from 'vscode';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { Logger } from '../utils/Logger';

export class XmlModifier {
    private parser: XMLParser;
    private builder: XMLBuilder;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true,
            preserveOrder: true // Important for rebuilding XML accurately
        });
        this.builder = new XMLBuilder({
            ignoreAttributes: false,
            // processEntities: false, // Default
            format: true,
            preserveOrder: true
        });
    }

    public async removeFieldDependency(filePath: string, fieldName: string): Promise<boolean> {
        try {
            const uri = vscode.Uri.file(filePath);
            const content = await vscode.workspace.fs.readFile(uri);
            const fileContent = Buffer.from(content).toString('utf-8');
            const data = this.parser.parse(fileContent);

            let modified = false;

            if (filePath.endsWith('layout-meta.xml')) {
                modified = this.processLayout(data, fieldName);
            } else if (filePath.endsWith('flexipage-meta.xml')) {
                modified = this.processFlexipage(data, fieldName);
            }

            if (modified) {
                const newXml = this.builder.build(data);
                const newContent = Buffer.from(newXml, 'utf-8');
                await vscode.workspace.fs.writeFile(uri, newContent as Uint8Array);
                return true;
            }
            return false;
        } catch (error) {
            Logger.error(`Error removing dependency from ${filePath}:`, error);
            return false;
        }
    }

    private processLayout(data: any[], fieldName: string): boolean {
        // Recursive search for layoutItems containing the field
        return this.recursiveRemove(data, (node: any) => {
            // Check if node is <layoutItems> and contains <field> == fieldName
            // With preserveOrder: true, structure is [{layoutItems: [{field: "name"}]}]
            if (node.layoutItems) {
                const items = node.layoutItems;
                // Items is likely an array of children.
                // We need to check if one of the children is <field> with value fieldName
                const fieldNode = items.find((child: any) => child.field && child.field[0]["#text"] === fieldName);
                if (fieldNode) {
                    return true; // Match found, remove this layoutItems node
                }
            }
            return false;
        });
    }

    private processFlexipage(data: any[], fieldName: string): boolean {
        // Flexipages are harder. Look for itemInstances with componentInstanceProperties having name=body/value=fieldName?
        // Logic depends heavily on flexipage type.
        // For now, let's look for simple text matches in values if possible, but structure prevents simple removal.
        // Let's defer strict Flexipage removal or try a generic approach:
        // Remove any <itemInstances> where a nested <value> equals fieldName.
        return this.recursiveRemove(data, (node: any) => {
            // This is a simplification. Real flexipages are complex.
            // Example: <componentInstanceProperties><name>...</name><value>FIELD_NAME</value></componentInstanceProperties>
            // If we find valid usage, we might want to remove the parent componentInstance or itemInstance.

            // Current strategy: Scan children. If any child has value == fieldName, we *might* want to remove this node.
            // But we must be careful not to remove the wrong thing.
            // Let's stick to Layouts for the safe implementation first, return false for flexipages unless we are sure.
            return false;
        });
    }

    // Helper to traverse and remove nodes from the array-based tree (preserveOrder=true)
    private recursiveRemove(nodes: any[], predicate: (node: any) => boolean): boolean {
        let modified = false;
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];

            // Check if this node matches the predicate to be removed
            // In preserveOrder, node is an object { tagName: [children] } usually, 
            // but actually fast-xml-parser preserveOrder structure is:
            // [ { "tagName": [ ...children... ] }, { ":@": attributes } ]
            // Wait, standard usage of preserveOrder gives objects like { "key": "value" } no?
            // "preserveOrder: true" returns:
            // [ { "layoutItems": [ { "behavior": ... }, { "field": ... } ] } ]

            const keys = Object.keys(node);
            const tagName = keys[0]; // e.g. "layoutItems"
            const content = node[tagName];

            if (predicate(node)) {
                // But wait, the predicate needs to inspect the content, not the wrapper
                // `processLayout` logic above assumes `node.layoutItems` existence.
                // If `node` is { layoutItems: [...] }, then node.layoutItems IS the content array.
                // The predicate logic `if (node.layoutItems)` is correct for identifying the wrapper.

                nodes.splice(i, 1);
                modified = true;
                continue;
            }

            // Recurse if content is array
            if (Array.isArray(content)) {
                if (this.recursiveRemove(content, predicate)) {
                    modified = true;
                }
            }
        }
        return modified;
    }
}
