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
// const { Octokit } = require("@octokit/core");
var node_fetch_1 = require("node-fetch");
// const fetch = require("node-fetch");
var fs = require("fs");
// const fs = require('fs');
var core = require("@actions/core");
// const core = require("@actions/core");
var path_1 = require("path");
// const path = require("path");
var gpt_1 = require("./fullfillmet/gpt");
var constant_1 = require("./constant");
var PullRequestProcessor = /** @class */ (function () {
    function PullRequestProcessor() {
        this.generator = new gpt_1.default();
    }
    PullRequestProcessor.prototype.processFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, octokit, files, _i, files_1, file, fileExtension, fileContent, newFileName, lines, firstMatchingLine, testcases, validation, workspaceDirectory, newFilePath, error_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 12, , 13]);
                        accessToken = core.getInput('PAT');
                        octokit = new core_1.Octokit({ auth: "token ".concat(accessToken), request: { fetch: node_fetch_1.default } });
                        return [4 /*yield*/, this.getPullRequestFiles(octokit)];
                    case 1:
                        files = _a.sent();
                        _i = 0, files_1 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_1.length)) return [3 /*break*/, 11];
                        file = files_1[_i];
                        fileExtension = path_1.default.extname(file.filename);
                        if (!(this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed')) return [3 /*break*/, 10];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 9, , 10]);
                        return [4 /*yield*/, this.getFileContent(octokit, file.raw_url)];
                    case 4:
                        fileContent = _a.sent();
                        return [4 /*yield*/, this.generateTestFileName(file.filename, fileExtension)];
                    case 5:
                        newFileName = _a.sent();
                        lines = fileContent.split("\n");
                        firstMatchingLine = lines.find(function (line) {
                            var trimmedLine = line.trim();
                            return trimmedLine.length > 0 && trimmedLine.includes("generate") && trimmedLine.includes("testcase");
                        });
                        if (!firstMatchingLine) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.generateTestCases(fileContent, file.filename)];
                    case 6:
                        testcases = _a.sent();
                        return [4 /*yield*/, this.generateValidationCode(fileContent, testcases)];
                    case 7:
                        validation = _a.sent();
                        console.log('validation', validation);
                        workspaceDirectory = process.env.GITHUB_WORKSPACE;
                        if (workspaceDirectory) {
                            newFilePath = path_1.default.join(workspaceDirectory, newFileName);
                            if (validation == 'true') {
                                // Write the testcases data to the new file
                                fs.writeFileSync(newFilePath, testcases);
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
    PullRequestProcessor.prototype.getPullRequestFiles = function (octokit) {
        return __awaiter(this, void 0, void 0, function () {
            var owner, repo, pull_number, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        owner = core.getInput('owner');
                        repo = core.getInput('repo');
                        pull_number = parseInt(core.getInput('pull_number'), 10);
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
    PullRequestProcessor.prototype.isFileExtensionAllowed = function (fileExtension) {
        var allowedExtensions = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];
        return allowedExtensions.includes(fileExtension);
    };
    PullRequestProcessor.prototype.getFileContent = function (octokit, rawUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, githubRawUrl, headers, response, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = core.getInput('PAT');
                        githubRawUrl = rawUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/raw/', '/');
                        githubRawUrl = githubRawUrl + '?token=' + accessToken;
                        headers = {
                            "Authorization": "token ".concat(accessToken)
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
                        throw error_3; // Rethrow the error
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
                        prompt = constant_1.generateTestcasePrompt + filename + '. The code is:\n' + fileContent;
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
                        testcasevalidation = fileContent + 'This is the code.\n' + testcases + constant_1.validateTestcasePrompt;
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
    PullRequestProcessor.prototype.generateTestFileName = function (originalFileName, fileExtension) {
        return originalFileName.replace(fileExtension, ".test" + fileExtension);
    };
    return PullRequestProcessor;
}());
exports.default = PullRequestProcessor;
