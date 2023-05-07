import * as vscode from 'vscode';
import * as settings from '../settingsUtil';

import { Configuration, OpenAIApi } from 'openai';
import { complain } from '../errors';

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
           throw complain("Undefined API Key.");
        }

        const configuration = new Configuration({
            apiKey: this.apiKey,

          });

          this.api = new OpenAIApi(configuration);
    }

    public async getCompletion(prompt: string, systemPrompt: string) : Promise<string>
    {
        try
        {
            if (OpenAIProvider.isChatModel(this.model))
            {
                const response = await this.api.createChatCompletion({
                    model: this.model,
                    messages: [
                        {role: "system", content: systemPrompt},
                        {role: "user", content: prompt}],
                  });
                
                  return response.data.choices[0].message?.content ?? "";
            }
            else
            {
                const completion = await this.api.createCompletion({
                    model: this.model,
                    prompt: systemPrompt + prompt
                  });
              
                  return completion.data.choices[0].text ?? "";
            }
        }
        catch (e : any)
        {
            complain(e.message);
            throw e;
        }
    }

    private static isChatModel(model: string)
    {
        if (model.startsWith("gpt-3.5-turbo"))
        {
            return true;
        }

        if (model.startsWith("gpt-4"))
        {
            return true;
        }

        return false;
    }
}