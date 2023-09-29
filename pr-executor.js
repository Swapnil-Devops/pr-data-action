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
var core_1 = require("@octokit/core");
var node_fetch_1 = require("node-fetch");
var fs_1 = require("fs");
var core_2 = require("@actions/core");
var path_1 = require("path");
var gpt_1 = require("./fullfilments/gpt");
// Initialize the variables
var generateTestcasePrompt;
var validateTestcasePrompt;
// Specify the full path to the 'prompts.pmt' file
var promptsFilePath = path_1.join(__dirname, 'prompts.pmt');
// Read the content of the custom extension text file
var fileContent = fs_1.readFileSync(promptsFilePath, 'utf-8');
// Parse the content into JavaScript variables
eval("(function() {".concat(fileContent, "})()"));
// Define a class named PullRequestProcessor
var PullRequestProcessor = /** @class */ (function () {
    function PullRequestProcessor() {
        // Initialize an instance of the OpenAIAssistant class
        this.generator = new gpt_1.default();
    }
    PullRequestProcessor.prototype.processFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, octokit, files, _i, files_1, file, fileExtension, fileContent_1, lines, firstNonBlankLine, containsGenerateAndTestcase, testcases, validation, newFileName, workspaceDirectory, newFilePath, error_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 12, , 13]);
                        accessToken = core_2.getInput('PAT');
                        octokit = new core_1.Octokit({ auth: "token ".concat(accessToken), request: { fetch: node_fetch_1.default } });
                        return [4 /*yield*/, this.getPullRequestFiles(octokit)];
                    case 1:
                        files = _a.sent();
                        _i = 0, files_1 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_1.length)) return [3 /*break*/, 11];
                        file = files_1[_i];
                        fileExtension = path_1.extname(file.filename);
                        if (!(this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed')) return [3 /*break*/, 10];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 9, , 10]);
                        return [4 /*yield*/, this.getFileContent(file.raw_url)];
                    case 4:
                        fileContent_1 = _a.sent();
                        lines = fileContent_1.split("\n");
                        firstNonBlankLine = lines.find(function (line) { return line.trim().length > 0; });
                        containsGenerateAndTestcase = !!(firstNonBlankLine &&
                            firstNonBlankLine.includes("generate") &&
                            firstNonBlankLine.includes("testcase"));
                        if (!containsGenerateAndTestcase) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.generateTestCases(fileContent_1, file.filename)];
                    case 5:
                        testcases = _a.sent();
                        return [4 /*yield*/, this.generateValidationCode(fileContent_1, testcases)];
                    case 6:
                        validation = _a.sent();
                        console.log('validation', validation);
                        return [4 /*yield*/, this.generateTestFileName(file.filename, fileExtension)];
                    case 7:
                        newFileName = _a.sent();
                        workspaceDirectory = process.env.GITHUB_WORKSPACE;
                        if (workspaceDirectory) {
                            newFilePath = path_1.join(workspaceDirectory, newFileName);
                            if (validation === 'true') {
                                // Write the testcases data to the new file
                                fs_1.writeFileSync(newFilePath, testcases);
                                console.log('created testcase file successfully.');
                            }
                            else {
                                console.log('failed testcase:', testcases);
                            }
                        }
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_1 = _a.sent();
                        console.error("Error fetching or processing file content:", error_1);
                        return [3 /*break*/, 10];
                    case 10:
                        _i++;
                        return [3 /*break*/, 2];
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_2 = _a.sent();
                        console.error("Error:", error_2);
                        process.exit(1);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    // Method to get the list of files in the pull request
    PullRequestProcessor.prototype.getPullRequestFiles = function (octokit) {
        return __awaiter(this, void 0, void 0, function () {
            var owner, repo, pull_number, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        owner = core_2.getInput('owner');
                        repo = core_2.getInput('repo');
                        pull_number = parseInt(core_2.getInput('pull_number'), 10);
                        return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
                                owner: owner,
                                repo: repo,
                                pull_number: pull_number,
                                headers: {
                                    "X-GitHub-Api-Version": "2022-11-28",
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    // Method to check if a file extension is allowed for processing
    PullRequestProcessor.prototype.isFileExtensionAllowed = function (fileExtension) {
        var allowedExtensions = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];
        return allowedExtensions.includes(fileExtension);
    };
    // Method to get the content of a file
    PullRequestProcessor.prototype.getFileContent = function (rawUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var accesstoken, githubRawUrl, headers, response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accesstoken = core_2.getInput('PAT');
                        githubRawUrl = rawUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/raw/', '/');
                        githubRawUrl = githubRawUrl + '?token=' + accesstoken;
                        headers = {
                            "Authorization": "token ".concat(accesstoken)
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, (0, node_fetch_1.default)(githubRawUrl, { headers: headers })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("HTTP error! Status: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.text()];
                    case 3:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Error fetching the file:", error_3);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PullRequestProcessor.prototype.generateTestCases = function (fileContent, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = generateTestcasePrompt + filename + '. The code is:\n' + fileContent;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.generator.generate(prompt)];
                    case 2:
                        response = _a.sent();
                        // Access the assistant's reply property and return it as a string
                        if (response && response.assistantReply) {
                            return [2 /*return*/, response.assistantReply];
                        }
                        else {
                            throw new Error('Assistant response is missing or invalid.');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Error:', error_4);
                        throw error_4; // Optionally rethrow the error for further handling in the workflow
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PullRequestProcessor.prototype.generateValidationCode = function (fileContent, testcases) {
        return __awaiter(this, void 0, void 0, function () {
            var testcasevalidation, response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testcasevalidation = fileContent + 'This is the code.\n' + testcases + validateTestcasePrompt;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.generator.generate(testcasevalidation)];
                    case 2:
                        response = _a.sent();
                        // Access the assistant's reply property and return it as a string
                        if (response && response.assistantReply) {
                            return [2 /*return*/, response.assistantReply];
                        }
                        else {
                            throw new Error('Assistant response is missing or invalid.');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Error:', error_5);
                        throw error_5; // Optionally rethrow the error for further handling in the workflow
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Method to generate a new file name for test cases
    PullRequestProcessor.prototype.generateTestFileName = function (originalFileName, fileExtension) {
        return originalFileName.replace(fileExtension, ".test" + fileExtension);
    };
    return PullRequestProcessor;
}());
// Export the PullRequestProcessor class
exports.default = PullRequestProcessor;
