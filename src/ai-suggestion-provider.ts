import * as vscode from 'vscode';
import * as settings from './settingsUtil';
import { OpenAIProvider } from './openai/openai-provider';

const defaultFeedbackHint = "The message should concern any or all of the following topics, with their priority given by the following order: possible bug, performance, maintanability, code style.";

export class AIRefactorizer implements vscode.CodeActionProvider {
	private readonly diagnostics:  vscode.DiagnosticCollection;
	
	private readonly showDiagnosticsCommand : string = "FeedbackDiagnostics";

	private readonly openAIProvider: OpenAIProvider;

	constructor(diagnosticsCollection:  vscode.DiagnosticCollection)
	{
		this.diagnostics = diagnosticsCollection;

		this.openAIProvider = new OpenAIProvider();

		vscode.commands.registerCommand(this.showDiagnosticsCommand, async (document, range) =>
		{
			const feedbackHintValue : string | undefined = vscode.workspace.getConfiguration(settings.meticulaiSection).get<string>(settings.feedbackHintSetting);
			const feedbackHint = feedbackHintValue === undefined || feedbackHintValue === "" ? defaultFeedbackHint : feedbackHintValue;

			const llmPrompt = `You will be provided with a snippet of code.Pretend you are an IDE and provide a useful diagnostic message for this snippet. ${feedbackHint} Your answer should only contain the diagnostic message. The snippet is: ${""}`;
			try
			{
				const suggestion = await this.openAIProvider.getCompletion(llmPrompt);
				const diagnostic = new vscode.Diagnostic(range, suggestion, vscode.DiagnosticSeverity.Information);
	
				this.diagnostics.set(document.uri, [diagnostic]);
			}
			catch
			{
				// Ignore errors
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

		const getFeedbackCommand = this.getFeedback(document, range);
		getFeedbackCommand.isPreferred = true;

		return [
			getFeedbackCommand
		];
	}

	private getFeedback(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
		const getFeedbackCommand = new vscode.CodeAction(`Get feedback`, vscode.CodeActionKind.Empty);
		getFeedbackCommand.command = { command: this.showDiagnosticsCommand, title: "Show feedback", tooltip: "Shows feedback on the given range.", arguments: [document, range]};
		return getFeedbackCommand;
	}
}