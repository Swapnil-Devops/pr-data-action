import PullRequestProcessor from './prExecutor.js';

async function main() {
    try {

      const prProcessor = new PullRequestProcessor();
      await prProcessor.processFiles();

    } 
    catch (error) {
        console.error('An error occurred:', error);
    }
}

// Run the main function
main();