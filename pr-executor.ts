import { Octokit } from "@octokit/core";
// const { Octokit } = require("@octokit/core");
import fetch from "node-fetch";
// const fetch = require("node-fetch");
import * as fs from "fs";
// const fs = require('fs');
import * as core from "@actions/core";
// const core = require("@actions/core");
import path from "path";
// const path = require("path");
import OpenAIAssistant from "./fullfillmet/gpt";
import { generateTestcasePrompt, validateTestcasePrompt } from "./constant";

import fixPath from 'fix-path';
fixPath();

interface PullRequestFile 
{
    filename: string;
    status: string;
    raw_url: string;
}

class PullRequestProcessor 
{
    private generator: OpenAIAssistant;

    constructor() 
    {
        this.generator = new OpenAIAssistant();
    }

    async processFiles(): Promise<void> 
    {
        try 
        {
            const accessToken: string = core.getInput('PAT');
            const octokit: Octokit = new Octokit({ auth: `token ${accessToken}`, request: { fetch } });

            const files: PullRequestFile[] = await this.getPullRequestFiles(octokit);

            for (const file of files) 
            {
                const fileExtension: string = path.extname(file.filename);
                if (this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed') 
                {
                    try 
                    {
                        const fileContent: string = await this.getFileContent(octokit, file.raw_url);
                        const newFileName: string = await this.generateTestFileName(file.filename, fileExtension);

                        // Split the content into lines
                        const lines: string[] = fileContent.split("\n");

                        // Find the first non-blank line containing "generate" and "testcase"
                        const firstMatchingLine: string | undefined = lines.find((line: string) => 
                        {
                            const trimmedLine: string = line.trim();
                            return trimmedLine.length > 0 && trimmedLine.includes("generate") && trimmedLine.includes("testcase");
                        });

                        if (firstMatchingLine) 
                        {
                            const testcases: string = await this.generateTestCases(fileContent, file.filename);
                            // console.log('testcases', testcases);
                            const validation: string = await this.generateValidationCode(fileContent, testcases);

                            console.log('validation', validation);

                            const workspaceDirectory: string | undefined = process.env.GITHUB_WORKSPACE;
                            if (workspaceDirectory) 
                            {
                                const newFilePath: string = path.join(workspaceDirectory, newFileName);

                                if (validation == 'true') 
                                {
                                    // Write the testcases data to the new file
                                    fs.writeFileSync(newFilePath, testcases);
                                    console.log('created testcase file successfully.');
                                } 
                                else 
                                {
                                    console.log('failed testcase:', testcases);
                                }
                            }
                        }
                    } 
                    catch (error) 
                    {
                        console.error("Error fetching or processing file content:", error);
                    }
                }
            }
        } 
        catch (error) 
        {
            console.error("Error:", error);
            process.exit(1);
        }
    }

    async getPullRequestFiles(octokit: Octokit): Promise<PullRequestFile[]> 
    {
        const owner: string = core.getInput('owner');
        const repo: string = core.getInput('owner');
        const pull_number: number = parseInt(core.getInput('pull_number'), 10);
        const response = await octokit.request(
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
            {
                owner,
                repo,
                pull_number,
                headers: 
                {
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            }
        );
        return response.data;
    }

    isFileExtensionAllowed(fileExtension: string): boolean 
    {
        const allowedExtensions: string[] = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];
        return allowedExtensions.includes(fileExtension);
    }

    async getFileContent(octokit: Octokit, rawUrl: string): Promise<string> 
    {
        const accessToken: string = core.getInput('PAT');
        let githubRawUrl: string = rawUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/raw/', '/');
        githubRawUrl = githubRawUrl + '?token=' + accessToken;
        const headers = {
            "Authorization": `token ${accessToken}`
        };

        try 
        {
            const response = await fetch(githubRawUrl, { headers });

            if (!response.ok) 
            {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: string = await response.text();
            return data;
        } 
        catch (error) 
        {
            console.error("Error fetching the file:", error);
            throw error; // Rethrow the error
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


    generateTestFileName(originalFileName: string, fileExtension: string): string 
    {
        return originalFileName.replace(fileExtension, ".test" + fileExtension);
    }
}



export default PullRequestProcessor;
