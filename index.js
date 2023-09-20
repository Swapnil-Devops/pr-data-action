import { Octokit } from "@octokit/core";
import github from "@actions/github";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import OpenAIAssistant from "./gpt.js";

class CodeProcessor {
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


      for (const file of files) {
        const fileExtension = path.extname(file.filename);
        if (this.isFileExtensionAllowed(fileExtension) && file.status !== 'removed') {
          try {
            const fileContent = await this.getFileContent(octokit, file.raw_url);
            console.log('filecontent:', fileContent);
            const testcases = await this.generateTestCases(fileContent);
            console.log('testcases',testcases);
            const validation = await this.generateValidationCode(fileContent, testcases);

            console.log('validation', validation);
            console.log('path',github.context.workspace);

            // The following code to write the testcases to a new file if validation is 'True'.
            if (validation === 'True') {
              const newFileName = this.generateTestFileName(file.filename, fileExtension);
              const filepath = `${github.context.workspace}/${newFileName}`;
              const fileExists = fs.existsSync(filepath);
              if (fileExists){
                fs.appendFileSync(filepath, testcases);
              }
              else{
                fs.writeFileSync(filepath, testcases);
              }
              // const newFilePath = path.join(workspaceDirectory, newFileName);
              // this.writeTestCasesToFile(newFilePath, testcases);
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

  async generateTestCases(fileContent) {
    const fileContents = 'I want you to act like a senior testcase code developer. I will give you code, and you will write the testcases. Do not provide any explanations. Do not respond with anything except of the code. Also include import packages in the code. The code is:' + fileContent;
    return this.generator.generate(fileContents);
  }

  async generateValidationCode(fileContent, testcases) {
    const testcasevalidation = fileContent + 'This is the code.' + testcases + 'This are the testcases for the code. Reply as "True" if all test cases pass and "False" even if the one the testcases fails.  Do not provide any explanations. Do not respond with anything except the true or false.';
    return this.generator.generate(testcasevalidation);
  }

  generateTestFileName(originalFileName, fileExtension) {
    return originalFileName.replace(fileExtension, ".test" + fileExtension);
  }

  // writeTestCasesToFile(filePath, testcases) {
  //   fs.writeFileSync(filePath, testcases);
  //   console.log('Created testcase file successfully.');
  // }
}

async function main() {
  const codeProcessor = new CodeProcessor();
  await codeProcessor.processFiles();
}

// Call the async function to start execution
main();
