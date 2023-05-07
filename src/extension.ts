// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AIRefactorizer } from './ai-suggestion-provider';
import { getApiKey, setApiKey } from './settingsUtil';
import { complain } from './errors';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const apiKey = getApiKey();
	if (apiKey === "" || apiKey === undefined)
	{
		const newApiKey = await vscode.window.showInputBox({
			placeHolder: "",
			prompt: "Set your OpenAI Api Key",
			value: ""
		  });
		
		  if (newApiKey === "" || newApiKey === undefined)
		  {
			complain("No API Key set");
			return;
		  }

		  setApiKey(newApiKey);
	}
	
	const meticulaiDiagnostics = vscode.languages.createDiagnosticCollection("meticulai");
	context.subscriptions.push(meticulaiDiagnostics);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('*', new AIRefactorizer(meticulaiDiagnostics), {
			providedCodeActionKinds: AIRefactorizer.providedCodeActionKinds
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
