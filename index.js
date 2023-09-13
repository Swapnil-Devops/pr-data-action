const { Octokit } = require("@octokit/core");

try {
  const octokit = new Octokit({
    auth: process.env.INPUT_TOKEN,
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
