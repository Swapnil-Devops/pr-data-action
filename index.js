const { Octokit } = require("@octokit/core");
const fetch = require("node-fetch"); // Import the fetch implementation

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

    // Set the 'files' output
    process.stdout.write(JSON.stringify({ files }));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Call the async function to start execution
fetchPullRequestFiles();
