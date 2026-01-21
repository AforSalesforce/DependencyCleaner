import * as vscode from 'vscode';

export class Logger {
    private static _outputChannel: vscode.OutputChannel;

    public static get outputChannel(): vscode.OutputChannel {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel("Field Cleaner");
        }
        return this._outputChannel;
    }

    public static log(message: string) {
        this.outputChannel.appendLine(`[INFO] ${message}`);
    }

    public static error(message: string, error?: any) {
        this.outputChannel.appendLine(`[ERROR] ${message}`);
        if (error) {
            this.outputChannel.appendLine(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        }
        this.outputChannel.show(true); // Bring to front on error
    }
}
