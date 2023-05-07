import * as vscode from "vscode";

export function complain(errorText: string)
{
    const fullError = `Meticulai: ${errorText}`;
    vscode.window.showErrorMessage(fullError);
    return new Error(fullError);
}