import { Octokit } from "@octokit/core";
import github from "@actions/github";
import fetch from "node-fetch";
import fs from "fs";
import core from "@actions/core";
import path from "path";
import OpenAIAssistant from "./fullfillmet/gpt.js";

class PullRequestProcessor {
    constructor() {
        this.generator = new OpenAIAssistant();
    }

    async processFiles() {
        try {
            // const workspaceDirectory = process.env.GITHUB_WORKSPACE;
            const octokit = new Octokit({
                auth: process.env.INPUT_TOKEN,
                request: {
                    fetch,
                },
            });

            const files = await this.getPullRequestFiles(octokit);
            console.log('Files from pull request:',files);


            for (const file of files) {
                const fileExtension = path.extname(file.filename);
                console.log('file extension',fileExtension);
                if (this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed') {
                    console.log("Inside 1st if block ");
                    try {
                        const fileContent = await this.getFileContent(octokit, file.raw_url);
                        console.log('filecontent:', fileContent);
                        const newFileName = await this.generateTestFileName(file.filename, fileExtension);

                        // Split the content into lines
                        const lines = fileContent.split("\n");

                        // Find the first non-blank line containing "generate" and "testcase"
                        const firstMatchingLine = lines.find((line) => {
                            const trimmedLine = line.trim();
                            return trimmedLine.length > 0 && trimmedLine.includes("generate") && trimmedLine.includes("testcase");
                        });

                        if (firstMatchingLine) {
                            const testcases = await this.generateTestCases(fileContent, file.filename);
                            // console.log('testcases', testcases);
                            const validation = await this.generateValidationCode(fileContent, testcases);

                            console.log('validation', validation);

                            const workspaceDirectory = process.env.GITHUB_WORKSPACE;
                            const newFilePath = path.join(workspaceDirectory, newFileName);

                            if (validation == 'true') {
                                // Write the testcases data to the new file
                                fs.writeFileSync(newFilePath, testcases);
                                console.log('created testcase file successfully.');
                            }
                            else{
                                console.log('failed testcase:',testcases);
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

    async getPullRequestFiles(octokit) {
        const response = await octokit.request(
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
            {
                owner: process.env.INPUT_OWNER,
                repo: process.env.INPUT_REPO,
                pull_number: process.env.INPUT_PULL_NUMBER,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            }
        );
        return response.data;
    }

    isFileExtensionAllowed(fileExtension) {
        const allowedExtensions = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];
        return allowedExtensions.includes(fileExtension);
    }

    async getFileContent(octokit, rawUrl) {
        const fileContentResponse = await octokit.request("GET " + rawUrl);
        return fileContentResponse.data;
    }

    async generateTestCases(fileContent, filename) {
        const fileContents = `I want you to act like a senior testcase code developer. I will give you code, and you will write the testcases. Do not provide any explanations. Do not respond with anything except the code. Also include import packages in the code. Give me the complete testcase code file. Make sure that all testcases gets passed. The name of the file which has code is ${filename}. The code is:\n${fileContent}`;
        // console.log('gpt prompt',fileContents);
        return this.generator.generate(fileContents);
    }

    async generateValidationCode(fileContent, testcases) {
        const testcasevalidation = `${fileContent} This is the code.\n${testcases} These are the testcases for the code. Validate those and return "true" if testcases are passed and return "false" if any testcase fails. Do not provide any explanations. Do not respond with anything except "true" or "false".`;
        // console.log('testcase prompt',testcasevalidation);
        return this.generator.generate(testcasevalidation);
    }

    generateTestFileName(originalFileName, fileExtension) {
        return originalFileName.replace(fileExtension, ".test" + fileExtension);
    }

}

export default PullRequestProcessor;