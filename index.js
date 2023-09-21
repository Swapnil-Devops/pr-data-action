import { Octokit } from "@octokit/core";
import github from "@actions/github";
import fetch from "node-fetch";
import fs from "fs";
import core from "@actions/core";
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
            const testcases = await this.generateTestCases(fileContent, file.filename);
            console.log('testcases', testcases);
            const validation = await this.generateValidationCode(fileContent, testcases);

            console.log('validation', validation);
            // console.log('path',github.workspace);
            core.setOutput('data', testcases);

            const fileName = this.generateTestFileName(file.filename, fileExtension);

            core.setOutput('fileName',fileName);

            // const token = process.env.INPUT_TOKEN; // The GitHub token is automatically provided by GitHub Actions
            // const octokits = github.getOctokit(token);

            // const owner = github.context.repo.owner;
            // const repo = github.context.repo.repo;
            // const branch = 'dev'; // Change to your repository's default branch
            // // Write data to a file
            // fs.writeFileSync(fileName, testcases);

            // // Read the content of the file
            // const testcaseFileContent = fs.readFileSync(fileName, 'utf8');

            // // Create or update the file in the repository
            // await octokits.repos.createOrUpdateFileContents({
            //   owner,
            //   repo,
            //   path: fileName,
            //   message: `Update ${fileName}`,
            //   content: Buffer.from(testcaseFileContent).toString('base64'),
            //   branch,
            // });

            // console.log(`File '${fileName}' pushed successfully`);

            



            // if (validation == 'True') {
            //   // Name the file with a ".test" suffix
            //   const newFileName = file.filename.replace(fileExtension, ".test" + fileExtension);
            //   console.log('filename:', newFileName);
            //   const workspaceDirectory = process.env.GITHUB_WORKSPACE;

            //   // Define the target path within the workspace
            //   const newFilePath = path.join(workspaceDirectory, newFileName);

            //   // Write the testcases data to the new file
            //   fs.writeFileSync(newFilePath, testcases);
            //   console.log('created testcase file successfully.');
            // }

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
    const fileContents = 'I want you to act like a senior testcase code developer. I will give you code, and you will write the testcases. Do not provide any explanations. Do not respond with anything except of the code. Also include import packages in the code. Give me the complete testcase code file. The name of file which has code is ' + filename + ' The code is:' + fileContent;
    return this.generator.generate(fileContents);
  }

  async generateValidationCode(fileContent, testcases) {
    const testcasevalidation = fileContent + 'This is the code.' + testcases + 'These are the testcases for the code. Validate those and return as "True" if testcases are passed and return "False" if any testcase fails. Do not provide any explanations. Do not respond with anything except the true or false.';
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
