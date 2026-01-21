# Field Cleaner

Field Cleaner is a VS Code extension designed for Salesforce developers to easily identify and remove field usages from metadata files (starting with Page Layouts and Flexipages).

It solves the common problem of "Canvas" errors or deployment failures caused by fields being present in metadata but deleted or deprecated in the object definition.

## Features

- **🔎 Find Dependencies**: Quickly search for any field (e.g., `Account.MyField__c`) to see where it is referenced in your local project.
- **🗑️ Remove Single Dependency**: Remove a field usage from a specific file with a single click.
- **⚡ Remove All Dependencies**: Batch remove a field from ALL found files in one go.
- **🛡️ Safe XML Modification**: Uses a proper XML parser to surgically remove only the relevant nodes, preserving the rest of your file structure and formatting.

## Installation

1. Download the `.vsix` file from the [Releases](https://github.com/AforSalesforce/DependencyCleaner/releases) or this repository.
2. In VS Code, go to the Extensions view (`Cmd+Shift+X`).
3. Click the "..." menu in the top-right corner.
4. Select **"Install from VSIX..."**.
5. Choose the downloaded file.

## How to Use

### 1. Find Field Usage
1. Open your Salesforce project in VS Code.
2. Open the **"Field Cleaner"** view in the Activity Bar (look for the list icon).
3. Click on the **"Find Field Dependencies"** command (or run it from the Command Palette `Cmd+Shift+P`).
4. Enter the API name of the field (e.g., `My_Custom_Field__c`).
5. The sidebar will populate with a list of all Layouts and Flexipages referencing that field.

### 2. Remove a Dependency
1. Hover over any file in the list.
2. Click the **Trash icon** (🗑️) next to the filename.
3. Confirm the removal when prompted.
4. The extension will modify the file and save the changes immediately.

### 3. Remove All Dependencies
1. If you want to clean up the field from **all** listed files, click the **"Remove All"** icon in the view title bar (top right of the Field Cleaner sidebar).
2. Confirm the action.
3. Watch the progress bar as the extension cleans up your metadata.

## Supported Metadata Types

### Automated Removal 🗑️
The extension can **find AND automatically remove** the field from:
- **Page Layouts** (`.layout-meta.xml`)
- **Flexipages** (`.flexipage-meta.xml`)

### Find Only 🔎
The extension can **find** usages in these files (click to open and edit manually):
- **Apex Classes** (`.cls`)
- **LWC** (`.js`, `.html`)
- **Validation Rules** (`.validationRule-meta.xml`)
- **Flows** (`.flow-meta.xml`)
- **Formula Fields** (`.field-meta.xml`)
- **Custom Objects** (`.object-meta.xml`)

> **Note**: Always ensure your work is committed to Git before running bulk removal operations, so you can easily revert if needed.