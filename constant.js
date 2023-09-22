let filename;
let fileContent;
let testcases;

export const generate_testcase_prompt = `I want you to act like a senior testcase code developer. I will give you code, and you will write the testcases. Do not provide any explanations. Do not respond with anything except the code. Also include import packages in the code. Give me the complete testcase code file. The name of the file which has code is ${filename}. The code is:\n${fileContent}`;

export const validate_testcase_prompt = `${fileContent} This is the code.\n${testcases} These are the testcases for the code. Validate those and return "true" if testcases are passed and return "false" if any testcase fails. Do not provide any explanations. Do not respond with anything except "true" or "false".`;