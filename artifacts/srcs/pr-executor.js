var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Octokit } from "@octokit/core";
import fetch from "node-fetch";
import fs from "fs";
import * as core from "@actions/core";
import * as path from "path";
import OpenAIAssistant from "./fullfilments/gpt";
// Initialize the variables
let generateTestcasePrompt;
let validateTestcasePrompt;
// Specify the full paths to the files inside the 'prompts' folder
const generateTestcasePromptFilePath = path.join(__dirname, 'prompts', 'generateTestcasePrompt.pmt');
const validateTestcasePromptFilePath = path.join(__dirname, 'prompts', 'validateTestcasePrompt.pmt');
// Read the content of the 'generateTestcasePrompt.pmt' file
generateTestcasePrompt = fs.readFileSync(generateTestcasePromptFilePath, 'utf-8');
// Read the content of the 'validateTestcasePrompt.pmt' file
validateTestcasePrompt = fs.readFileSync(validateTestcasePromptFilePath, 'utf-8');
// Define a class named PullRequestProcessor
class PullRequestProcessor {
    constructor() {
        // Initialize an instance of the OpenAIAssistant class
        this.generator = new OpenAIAssistant();
    }
    processFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the personal access token from GitHub Actions input
                const accessToken = core.getInput('PAT');
                // Create an Octokit instance with the provided access token
                const octokit = new Octokit({ auth: `token ${accessToken}`, request: { fetch } });
                // Get a list of files in the pull request
                const files = yield this.getPullRequestFiles(octokit);
                // Loop through the files in the pull request
                for (const file of files) {
                    // Get the file extension
                    const fileExtension = path.extname(file.filename);
                    // Check if the file extension is allowed for processing
                    if (this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed') {
                        try {
                            // Get the content of the file
                            const fileContent = yield this.getFileContent(file.raw_url);
                            // Split the content into lines
                            const lines = fileContent.split("\n");
                            // Find the first non-blank line
                            const firstNonBlankLine = lines.find((line) => line.trim().length > 0);
                            // Check if the first non-blank line contains both "generate" and "testcase"
                            const containsGenerateAndTestcase = !!(firstNonBlankLine &&
                                firstNonBlankLine.includes("generate") &&
                                firstNonBlankLine.includes("testcase"));
                            if (containsGenerateAndTestcase) {
                                // Generate test cases based on the file content
                                const testcases = yield this.generateTestCases(fileContent, file.filename);
                                // Generate validation code for the test cases
                                const validation = yield this.generateValidationCode(fileContent, testcases);
                                console.log('validation', validation);
                                // Generate a new file name for the test cases
                                const newFileName = yield this.generateTestFileName(file.filename, fileExtension);
                                // Get the workspace directory path
                                const workspaceDirectory = process.env.GITHUB_WORKSPACE;
                                if (workspaceDirectory) {
                                    // Create the full path for the new test file
                                    const newFilePath = path.join(workspaceDirectory, newFileName);
                                    if (validation === 'true') {
                                        // Write the testcases data to the new file
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
    // Method to get the list of files in the pull request
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
    // Method to check if a file extension is allowed for processing
    isFileExtensionAllowed(fileExtension) {
        const allowedExtensions = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];
        return allowedExtensions.includes(fileExtension);
    }
    // Method to get the content of a file
    getFileContent(rawUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const accesstoken = core.getInput('PAT');
            let githubRawUrl = rawUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/raw/', '/');
            githubRawUrl = githubRawUrl + '?token=' + accesstoken;
            const headers = {
                "Authorization": `token ${accesstoken}`
            };
            try {
                const response = yield fetch(githubRawUrl, { headers });
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
                // Call the generate method to get the assistant's reply
                const response = yield this.generator.generate(prompt);
                // Access the assistant's reply property and return it as a string
                if (response && response.assistantReply) {
                    return response.assistantReply;
                }
                else {
                    throw new Error('Assistant response is missing or invalid.');
                }
            }
            catch (error) {
                console.error('Error:', error);
                throw error; // Optionally rethrow the error for further handling in the workflow
            }
        });
    }
    generateValidationCode(fileContent, testcases) {
        return __awaiter(this, void 0, void 0, function* () {
            const testcasevalidation = fileContent + 'This is the code.\n' + testcases + validateTestcasePrompt;
            try {
                // Call the generate method to get the assistant's reply
                const response = yield this.generator.generate(testcasevalidation);
                // Access the assistant's reply property and return it as a string
                if (response && response.assistantReply) {
                    return response.assistantReply;
                }
                else {
                    throw new Error('Assistant response is missing or invalid.');
                }
            }
            catch (error) {
                console.error('Error:', error);
                throw error; // Optionally rethrow the error for further handling in the workflow
            }
        });
    }
    // Method to generate a new file name for test cases
    generateTestFileName(originalFileName, fileExtension) {
        return originalFileName.replace(fileExtension, ".test" + fileExtension);
    }
}
// Export the PullRequestProcessor class
export default PullRequestProcessor;
