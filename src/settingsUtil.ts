import * as vscode from "vscode";

export const meticulaiSection = "meticulai";
export const feedbackHintSetting = "defaultFeedbackHint";
export const apiKeySetting = "openAIApiKey";
export const modelSetting = "model";

export function getApiKey()
{
    const apiKey = vscode.workspace.getConfiguration(meticulaiSection).get<string>(apiKeySetting) ?? "";
    return apiKey;
}

export function setApiKey(apiKey: string)
{
    return vscode.workspace.getConfiguration(meticulaiSection).update(apiKeySetting, apiKey);
}