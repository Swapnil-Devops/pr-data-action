import { Octokit } from "@octokit/core";
import fetch from "node-fetch";
import fs from "fs";
import * as core from "@actions/core";
import * as path from "path";
import OpenAIAssistant from "./fullfilments/gpt";

// Initialize the variables
let generateTestcasePrompt: string;
let validateTestcasePrompt: string;

// Specify the full paths to the files inside the 'prompts' folder
const generateTestcasePromptFilePath: string  = path.join(__dirname, 'prompts', 'generateTestcasePrompt.pmt');

const validateTestcasePromptFilePath: string  = path.join(__dirname, 'prompts', 'validateTestcasePrompt.pmt');

// Read the content of the 'generateTestcasePrompt.pmt' file
generateTestcasePrompt = fs.readFileSync(generateTestcasePromptFilePath, 'utf-8');

// Read the content of the 'validateTestcasePrompt.pmt' file
validateTestcasePrompt = fs.readFileSync(validateTestcasePromptFilePath, 'utf-8');

// Define a class named PullRequestProcessor
class PullRequestProcessor {
    private generator: OpenAIAssistant;

    constructor() {
        // Initialize an instance of the OpenAIAssistant class
        this.generator = new OpenAIAssistant();
    }

    async processFiles(): Promise<void> {
        try {
            // Get the personal access token from GitHub Actions input
            const accessToken: string = core.getInput('PAT');
            // Create an Octokit instance with the provided access token
            const octokit: Octokit = new Octokit({ auth: `token ${accessToken}`, request: { fetch } });

            // Get a list of files in the pull request
            const files: any[] = await this.getPullRequestFiles(octokit);

            // Loop through the files in the pull request
            for (const file of files) {
                // Get the file extension
                const fileExtension: string = path.extname(file.filename);
                // Check if the file extension is allowed for processing
                if (this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed') {
                    try {
                        // Get the content of the file
                        const fileContent: string = await this.getFileContent(file.raw_url);

                        // Split the content into lines
                        const lines: string[] = fileContent.split("\n");

                        // Find the first non-blank line
                        const firstNonBlankLine: string | undefined = lines.find((line) => line.trim().length > 0);

                        // Check if the first non-blank line contains both "generate" and "testcase"
                        const containsGenerateAndTestcase: boolean = !!(
                            firstNonBlankLine &&
                            firstNonBlankLine.includes("generate") &&
                            firstNonBlankLine.includes("testcase")
                        );

                        if (containsGenerateAndTestcase) {
                            // Generate test cases based on the file content
                            const testcases: string = await this.generateTestCases(fileContent, file.filename);
                            // Generate validation code for the test cases
                            const validation: string = await this.generateValidationCode(fileContent, testcases);

                            console.log('validation', validation);
                            // Generate a new file name for the test cases
                            const newFileName: string = await this.generateTestFileName(file.filename, fileExtension);
                            // Get the workspace directory path
                            const workspaceDirectory: string | undefined = process.env.GITHUB_WORKSPACE;
                            if (workspaceDirectory) {
                                // Create the full path for the new test file
                                const newFilePath: string = path.join(workspaceDirectory, newFileName);

                                if (validation === 'true') {
                                    // Write the testcases data to the new file
                                    fs.writeFileSync(newFilePath, testcases);
                                    console.log('created testcase file successfully.');
                                } else {
                                    console.log('failed testcase:', testcases);
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching or processing file content:", error);
                    }
                }
            }
        } catch (error) {
            console.error("Error:", error);
            process.exit(1);
        }
    }

    // Method to get the list of files in the pull request
    async getPullRequestFiles(octokit: Octokit): Promise<any[]> {
        const owner: string = core.getInput('owner');
        const repo: string = core.getInput('repo');
        const pull_number: number = parseInt(core.getInput('pull_number'), 10);
        const response = await octokit.request(
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
            {
                owner,
                repo,
                pull_number,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            }
        );
        return response.data;
    }

    // Method to check if a file extension is allowed for processing
    isFileExtensionAllowed(fileExtension: string): boolean {
        const allowedExtensions: string[] = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];
        return allowedExtensions.includes(fileExtension);
    }

    // Method to get the content of a file
    async getFileContent(rawUrl: string): Promise<string> {
        const accesstoken: string = core.getInput('PAT');
        let githubRawUrl: string = rawUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/raw/', '/');
        githubRawUrl = githubRawUrl + '?token=' + accesstoken;
        const headers = {
            "Authorization": `token ${accesstoken}`
        };

        try {
            const response = await fetch(githubRawUrl, { headers });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: string = await response.text();
            return data;
        } catch (error) {
            console.error("Error fetching the file:", error);
        }
    }

    async generateTestCases(fileContent: string, filename: string): Promise<string> 
    {
        const prompt: string = generateTestcasePrompt + filename + '. The code is:\n' + fileContent;

        try 
        {
            // Call the generate method to get the assistant's reply
            const response = await this.generator.generate(prompt);

            // Access the assistant's reply property and return it as a string
            if (response && response.assistantReply) 
            {
                return response.assistantReply;
            } 
            else 
            {
                throw new Error('Assistant response is missing or invalid.');
            }
        } 
        catch (error) 
        {
            console.error('Error:', error);
            throw error; // Optionally rethrow the error for further handling in the workflow
        }
    }


    async generateValidationCode(fileContent: string, testcases: string): Promise<string> 
    {
        const testcasevalidation: string = fileContent + 'This is the code.\n' + testcases + validateTestcasePrompt;

        try 
        {
            // Call the generate method to get the assistant's reply
            const response = await this.generator.generate(testcasevalidation);
            // Access the assistant's reply property and return it as a string
            if (response && response.assistantReply) 
            {
                return response.assistantReply;
            } 
            else 
            {
                throw new Error('Assistant response is missing or invalid.');
            }
        } 
        catch (error) 
        {
            console.error('Error:', error);
            throw error; // Optionally rethrow the error for further handling in the workflow
        }
    }

    // Method to generate a new file name for test cases
    generateTestFileName(originalFileName: string, fileExtension: string): string {
        return originalFileName.replace(fileExtension, ".test" + fileExtension);
    }
}

// Export the PullRequestProcessor class
export default PullRequestProcessor;
