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
const core_1 = require("@octokit/core");
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const gpt_1 = __importDefault(require("./gpt"));
let generateTestcasePrompt;
let validateTestcasePrompt;
const generateTestcasePromptFilePath = path.join(__dirname, 'prompts', 'generateTestcasePrompt.pmt');
const validateTestcasePromptFilePath = path.join(__dirname, 'prompts', 'validateTestcasePrompt.pmt');
generateTestcasePrompt = fs.readFileSync(generateTestcasePromptFilePath, 'utf-8');
validateTestcasePrompt = fs.readFileSync(validateTestcasePromptFilePath, 'utf-8');
class PullRequestProcessor {
    constructor() {
        this.generator = new gpt_1.default();
    }
    processFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const accessToken = core.getInput('PAT');
                const octokit = new core_1.Octokit({ auth: `token ${accessToken}`, request: { fetch: node_fetch_1.default } });
                const files = yield this.getPullRequestFiles(octokit);
                for (const file of files) {
                    const fileExtension = path.extname(file.filename);
                    if (this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed') {
                        try {
                            const fileContent = yield this.getFileContent(file.raw_url);
                            const lines = fileContent.split("\n");
                            const firstNonBlankLine = lines.find((line) => line.trim().length > 0);
                            const containsGenerateAndTestcase = !!(firstNonBlankLine &&
                                firstNonBlankLine.includes("generate") &&
                                firstNonBlankLine.includes("testcase"));
                            if (containsGenerateAndTestcase) {
                                const testcases = yield this.generateTestCases(fileContent, file.filename);
                                const validation = yield this.generateValidationCode(fileContent, testcases);
                                console.log('validation', validation);
                                const newFileName = yield this.generateTestFileName(file.filename, fileExtension);
                                const workspaceDirectory = process.env.GITHUB_WORKSPACE;
                                if (workspaceDirectory) {
                                    const newFilePath = path.join(workspaceDirectory, newFileName);
                                    if (validation === 'true') {
                                        fs.writeFileSync(newFilePath, testcases);
                                        console.log('created testcase file successfully.');
                                    }
                                    else {
                                        console.log('failed testcase:', testcases);
                                    }
                                }
                            }
                        }
                        catch (error) {
                            console.error("Error fetching or processing file content:", error);
                        }
                    }
                }
            }
            catch (error) {
                console.error("Error:", error);
                process.exit(1);
            }
        });
    }
    getPullRequestFiles(octokit) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = core.getInput('owner');
            const repo = core.getInput('repo');
            const pull_number = parseInt(core.getInput('pull_number'), 10);
            const response = yield octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
                owner,
                repo,
                pull_number,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });
            return response.data;
        });
    }
    isFileExtensionAllowed(fileExtension) {
        const allowedExtensions = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];
        return allowedExtensions.includes(fileExtension);
    }
    getFileContent(rawUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const accesstoken = core.getInput('PAT');
            let githubRawUrl = rawUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/raw/', '/');
            githubRawUrl = githubRawUrl + '?token=' + accesstoken;
            const headers = {
                "Authorization": `token ${accesstoken}`
            };
            try {
                const response = yield (0, node_fetch_1.default)(githubRawUrl, { headers });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = yield response.text();
                return data;
            }
            catch (error) {
                console.error("Error fetching the file:", error);
            }
        });
    }
    generateTestCases(fileContent, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = generateTestcasePrompt + filename + '. The code is:\n' + fileContent;
            try {
                const response = yield this.generator.generate(prompt);
                if (response && response.assistantReply) {
                    return response.assistantReply;
                }
                else {
                    throw new Error('Assistant response is missing or invalid.');
                }
            }
            catch (error) {
                console.error('Error:', error);
                throw error;
            }
        });
    }
    generateValidationCode(fileContent, testcases) {
        return __awaiter(this, void 0, void 0, function* () {
            const testcasevalidation = fileContent + 'This is the code.\n' + testcases + validateTestcasePrompt;
            try {
                const response = yield this.generator.generate(testcasevalidation);
                if (response && response.assistantReply) {
                    return response.assistantReply;
                }
                else {
                    throw new Error('Assistant response is missing or invalid.');
                }
            }
            catch (error) {
                console.error('Error:', error);
                throw error;
            }
        });
    }
    generateTestFileName(originalFileName, fileExtension) {
        return originalFileName.replace(fileExtension, ".test" + fileExtension);
    }
}
exports.default = PullRequestProcessor;
