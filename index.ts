import PullRequestProcessor from './pr-executor';
import fixPath from 'fix-path';
fixPath();
async function main(): Promise<void> 
{
    try 
    {
        const prProcessor: PullRequestProcessor = new PullRequestProcessor();
        await prProcessor.processFiles();
    } 
    catch (error: any) 
    {
        console.error('An error occurred:', error);
    }
}

// Run the main function
main();
