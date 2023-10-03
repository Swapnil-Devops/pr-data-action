"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const core = __importStar(require("@actions/core"));
class OpenAIAssistant {
    constructor() {
        this.api_key = core.getInput("api_key");
        this.api_url = "https://api.openai.com/v1/chat/completions";
    }
    generate(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            let assistantReply = '';
            try {
                const response = yield (0, node_fetch_1.default)(this.api_url, {
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
                throw error;
            }
        });
    }
}
exports.default = OpenAIAssistant;
