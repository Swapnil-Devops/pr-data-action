import { Octokit } from "@octokit/core";
import fetch from "node-fetch"; // Import the fetch implementation

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
                const fileExtension = file.filename.slice(((file.filename.lastIndexOf(".") - 1) >>> 0) + 2);
                return allowedExtensions.includes('.'+{ fileExtension });
            });
    
            // Extract and display the filtered file names
            const filteredFileNames = filteredFiles.map(file => file.filename);
            console.log("Filtered Files:", filteredFileNames);

    // Set the 'files' output
    process.stdout.write(JSON.stringify({ files }));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Call the async function to start execution
fetchPullRequestFiles();
