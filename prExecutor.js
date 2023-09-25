import { Octokit } from "@octokit/core";
// import { Octokit  } from "@octokit/rest";
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
            const accessToken = core.getInput('PAT');
            const octokit = new Octokit({ auth: `token ${accessToken}`, request: { fetch } });

            const files = await this.getPullRequestFiles(octokit);

            for (const file of files) {
                const fileExtension = path.extname(file.filename);
                if (this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed') {
                    try {
                        const fileContent = await this.getFileContent(octokit, file.raw_url);
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
                            else {
                                console.log('failed testcase:', testcases);
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

    // async getFileContent(octokit, rawUrl) {
    //     const accesstoken = core.getInput('PAT');
    //     let githubRawUrl = rawUrl.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/raw/','/')
    //     githubRawUrl = githubRawUrl +'?token='+accesstoken
    //     console.log('new url',githubRawUrl);


    //     const headers = {
    //         "Authorization": `token ${accesstoken}`
    //       };

    //       fetch(githubRawUrl, { headers })
    //         .then(response => {
    //           if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //           }
    //           return response.text();
    //         })
    //         .then(data => {
    //           // `data` contains the content of the file
    //           console.log('data:',data);
    //           return data
    //         })
    //         .catch(error => {
    //           console.error("Error fetching the file:", error);
    //         });

    //     // try {
    //     //     const fileContentResponse = await octokit.request("GET " + rawUrl, {
    //     //         headers: {
    //     //             Authorization: `token ${accesstoken}`,
    //     //         },
    //     //     });
    //     //     return fileContentResponse.data;
    //     // } catch (error) {
    //     //     console.error("Error fetching file content:", error);
    //     //     throw error;
    //     // }
    // }

    async getFileContent(octokit, rawUrl) {
        const accesstoken = core.getInput('PAT');
        let githubRawUrl = rawUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/raw/', '/');
        githubRawUrl = githubRawUrl + '?token=' + accesstoken;
        console.log('new url', githubRawUrl);

        const headers = {
            "Authorization": `token ${accesstoken}`
        };

        try {
            const response = await fetch(githubRawUrl, { headers });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.text();
            return data; 
        } catch (error) {
            console.error("Error fetching the file:", error);
            throw error; // Rethrow the error
        }
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