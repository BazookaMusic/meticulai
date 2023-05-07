import * as vscode from 'vscode';
import * as settings from '../settingsUtil';

import { Configuration, OpenAIApi } from 'openai';

export class OpenAIProvider
{
    private readonly apiKey: string;
    private readonly model: string; 

    private readonly api: OpenAIApi;

    constructor()
    {
        this.apiKey = vscode.workspace.getConfiguration(settings.meticulaiSection).get<string>(settings.apiKeySetting)!;
        this.model = vscode.workspace.getConfiguration(settings.meticulaiSection).get<string>(settings.modelSetting)!;

        if (this.apiKey === undefined || this.apiKey === "")
        {
            throw new Error("Undefined API Key.");
        }

        const configuration = new Configuration({
            apiKey: this.apiKey,

          });

          this.api = new OpenAIApi(configuration);
    }

    public async getCompletion(prompt: string) : Promise<string>
    {
        try
        {
            const completion = await this.api.createCompletion({
                model: this.model,
                prompt: "Hello world",
                });
    
            return completion.data?.choices[0].text ?? "";
        }
        catch (e)
        {
            console.error(e);
            throw e;
        }
    }
}