import * as vscode from 'vscode';
import * as settings from './settingsUtil';
import { OpenAIProvider } from './openai/openai-provider';

const defaultFeedbackHint = "The message should concern any or all of the following topics, with their priority given by the following order: possible bug, performance, maintanability, code style.";

const feedbackHintValue : string | undefined = vscode.workspace.getConfiguration(settings.meticulaiSection).get<string>(settings.feedbackHintSetting);
const systemPrompt = `You will be provided with a snippet of code.Pretend you are an IDE and provide a useful diagnostic message for this snippet.${feedbackHintValue}.Your answer be in the format Severity : Message, where severity can exclusively take the values: Error,Information,Warning and the message should be the raw message.`;

export class AIRefactorizer implements vscode.CodeActionProvider {
	private readonly diagnostics:  vscode.DiagnosticCollection;
	
	private readonly showDiagnosticsCommand : string = "FeedbackDiagnostics";

	private readonly openAIProvider: OpenAIProvider;

	constructor(diagnosticsCollection:  vscode.DiagnosticCollection)
	{
		this.diagnostics = diagnosticsCollection;

		this.openAIProvider = new OpenAIProvider();

		vscode.commands.registerCommand(this.showDiagnosticsCommand, async (document: vscode.TextDocument, range: vscode.Range, token: vscode.CancellationToken) =>
		{
			if (range.isEmpty)
			{
				return;
			}

			if (token.isCancellationRequested)
			{
				return;
			}

			const feedbackHint = feedbackHintValue === undefined || feedbackHintValue === "" ? defaultFeedbackHint : feedbackHintValue;

			const snippet = document.getText(range);
			if (snippet.length === 0)
			{
				return;
			}

			const llmPrompt = `You will be provided with a snippet of code.Pretend you are an IDE and provide a useful diagnostic message for this snippet. ${feedbackHint}  The snippet is: ${snippet}`;
			try
			{
				let suggestion: string;
				try
				{
					suggestion = await this.openAIProvider.getCompletion(llmPrompt, systemPrompt);
				}
				catch (e)
				{
					return;
				}
				
				const splitSuggestion = suggestion.split(":");

				let message: string;
				let severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Information;
				if (splitSuggestion.length === 0)
				{
					return;
				}
				else if (splitSuggestion.length === 2)
				{
					message = splitSuggestion[1];
					severity = AIRefactorizer.parseSeverity(splitSuggestion[0]);
				}
				else
				{
					message = splitSuggestion[0];
				}

				if (token.isCancellationRequested)
				{
					return;
				}

				const diagnostic = new vscode.Diagnostic(range, suggestion, severity);
				this.diagnostics.set(document.uri, [diagnostic]);
			}
			catch (e: any)
			{
				// Ignore errors
				console.error(e.message);
			}
		} );
	}

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] | undefined {
		if (token.isCancellationRequested)
		{
			return undefined;
		}

		const getFeedbackCommand = this.getFeedback(document, range, token);
		getFeedbackCommand.isPreferred = true;

		return [
			getFeedbackCommand
		];
	}

	private getFeedback(document: vscode.TextDocument, range: vscode.Range, token: vscode.CancellationToken): vscode.CodeAction {
		const getFeedbackCommand = new vscode.CodeAction(`Meticulai: AI Suggestion`, vscode.CodeActionKind.Empty);
		getFeedbackCommand.command = { command: this.showDiagnosticsCommand, title: "Meticulai: AI Diagnostic", tooltip: "Get an AI powered diagnostic for the highlighted code snippet.", arguments: [document, range, token]};
		return getFeedbackCommand;
	}

	private static parseSeverity(sevString: string) : vscode.DiagnosticSeverity
	{
		switch (sevString.toLowerCase()) {
			case "error":
				return vscode.DiagnosticSeverity.Error;
			case "hint":
				return vscode.DiagnosticSeverity.Hint;
			case "information":
				return vscode.DiagnosticSeverity.Information;
			case "warning":
				return vscode.DiagnosticSeverity.Warning;
			default:
				return vscode.DiagnosticSeverity.Information;
		}
	}
}