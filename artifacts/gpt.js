var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from "node-fetch";
import * as core from "@actions/core";
// const fetch = require('node-fetch');
// const core  = require('@actions/core');
class OpenAIAssistant {
    /**
     * Initializes a new instance of the OpenAIAssistant class.
     * @param {string} api_key - OpenAI API key.
     */
    constructor() {
        this.api_key = core.getInput("api_key");
        this.api_url = "https://api.openai.com/v1/chat/completions";
    }
    /**
     * Generates a response from the OpenAI API based on the provided prompt.
     * @param {string} prompt - The prompt to be used for generating a response.
     * @returns {Promise<{ assistantReply: string }>} An object containing the assistant's reply.
     */
    generate(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            let assistantReply = '';
            try {
                // Make a request to the OpenAI API
                const response = yield fetch(this.api_url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + this.api_key,
                    },
                    body: JSON.stringify({
                        messages: [{ role: "system", content: prompt }],
                        max_tokens: 1000,
                        model: "gpt-3.5-turbo"
                    })
                });
                // Parse the API response as JSON
                const responseData = yield response.json();
                if (Array.isArray(responseData.choices) && responseData.choices.length > 0) {
                    assistantReply = responseData.choices[0].message.content;
                    core.setOutput("body", assistantReply);
                }
                else {
                    console.log("No valid response from the assistant.");
                }
                return { assistantReply };
            }
            catch (error) {
                console.error('Error:', error);
                throw error; // Optionally rethrow the error for further handling in the workflow
            }
        });
    }
}
export default OpenAIAssistant;
