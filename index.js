import { Octokit } from "@octokit/core";
import fetch from "node-fetch";
import fs from "fs";
import OpenAIAssistant from "./gpt.js";

const generator = new OpenAIAssistant();

async function fetchAndProcessFiles() {
  try {
    const octokit = new Octokit({
      auth: process.env.INPUT_TOKEN,
      request: {
        fetch,
      },
    });

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

    const files = response.data;

    // Define the list of allowed file extensions
    const allowedExtensions = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];

    for (const file of files) {
      // Check if the file has an allowed extension
      const fileExtension = file.filename.slice(file.filename.lastIndexOf("."));
      if (allowedExtensions.includes(fileExtension) && (file.status != 'removed')) {

        try {

          // Fetch the content of the file from GitHub
          const fileContentResponse = await octokit.request("GET " + file.raw_url);

          let fileContent = fileContentResponse.data;

          // Split the content into lines
          const lines = fileContent.split("\n");

          // Find the first non-blank line containing "generate" and "testcase"
          const firstMatchingLine = lines.find((line) => {
            const trimmedLine = line.trim();
            return trimmedLine.length > 0 && trimmedLine.includes("generate") && trimmedLine.includes("testcase");
          });

          if (firstMatchingLine) {
            // Log the entire content of the file
            // console.log('File Content:', fileContent);
            let fileContents = 'I want you to act like a senior testcase code developer. I will give you code, and you will write the testcases. Do not provide any explanations. Do not respond with anything except of the code. Also include import packages in the code. The code is:' + fileContent;

            const response = await generator.generate(fileContents);

            let responsevalidation = fileContent + 'This is the code.' + response + 'This are the testcases for the code. Reply as true if all test cases pass and false even if the one the testcases fails.  Do not provide any explanations. Do not respond with anything except the true or false.';

            const validation = await generator.generate(responsevalidation);

            console.log('valdation', validation);

            if (validation == 'true') {
              // Name the file with a ".test" suffix
              const newFileName = file.filename.replace(fileExtension, ".test" + fileExtension);

              // Write the response data to the new file
              fs.writeFileSync(newFileName, response);
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

// Call the async function to start execution
fetchAndProcessFiles();
