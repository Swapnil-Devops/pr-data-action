import { Octokit } from "@octokit/core";
import fetch from "node-fetch"; // Import the fetch implementation
import fs from "fs";

async function fetchPullRequestFiles() {
  try {
    const octokit = new Octokit({
      auth: process.env.INPUT_TOKEN,
      request: {
        fetch, // Pass the fetch implementation here
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
    console.log("Fetched files:", files);

    // Define the list of allowed file extensions
    const allowedExtensions = [".js", ".ts", ".py", ".rs", ".cpp", ".cxs", ".hpp"];

    // Filter the files based on the allowed extensions
    const filteredFiles = files.filter(file => {
      const fileExtension = file.filename.slice(file.filename.lastIndexOf("."));
      return allowedExtensions.includes(fileExtension);
    });

    const matchingFilenames = [];
    for (const file of filteredFiles) {
      const content = fs.readFileSync(file.filename, "utf-8");
      const lines = content.split("\n");
      let firstNonBlankLine = null;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          firstNonBlankLine = trimmedLine;
          break;
        }
      }

      // Check if the first non-blank line contains "generate" and "testcase"
      if (firstNonBlankLine && firstNonBlankLine.includes("generate") && firstNonBlankLine.includes("testcase")) {
        console.log('File:', file.filename);
        console.log('First non-blank line:', firstNonBlankLine);

        // Add the filename to the matchingFilenames array
        matchingFilenames.push(file.filename);
      }
    }

    // Print the matching filenames
    console.log('Matching Filenames:', matchingFilenames);
    // Set the 'files' output
    // process.stdout.write(JSON.stringify({ files }));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Call the async function to start execution
fetchPullRequestFiles();
