"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
var core = require("@actions/core");
// const fetch = require('node-fetch');
// const core  = require('@actions/core');
var OpenAIAssistant = /** @class */ (function () {
    /**
     * Initializes a new instance of the OpenAIAssistant class.
     * @param {string} api_key - OpenAI API key.
     */
    function OpenAIAssistant() {
        this.api_key = core.getInput("api_key");
        this.api_url = "https://api.openai.com/v1/chat/completions";
    }
    /**
     * Generates a response from the OpenAI API based on the provided prompt.
     * @param {string} prompt - The prompt to be used for generating a response.
     * @returns {Promise<{ assistantReply: string }>} An object containing the assistant's reply.
     */
    OpenAIAssistant.prototype.generate = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var assistantReply, response, responseData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assistantReply = '';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, (0, node_fetch_1.default)(this.api_url, {
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
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        responseData = _a.sent();
                        if (Array.isArray(responseData.choices) && responseData.choices.length > 0) {
                            assistantReply = responseData.choices[0].message.content;
                            core.setOutput("body", assistantReply);
                        }
                        else {
                            console.log("No valid response from the assistant.");
                        }
                        return [2 /*return*/, { assistantReply: assistantReply }];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Error:', error_1);
                        throw error_1; // Optionally rethrow the error for further handling in the workflow
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return OpenAIAssistant;
}());
exports.default = OpenAIAssistant;
