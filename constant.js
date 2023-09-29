"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTestcasePrompt = exports.generateTestcasePrompt = void 0;
exports.generateTestcasePrompt = 'I want you to act like a senior testcase code developer. I will give you code, and you will write the testcases. Do not provide any explanations. Do not respond with anything except the code. Also include import packages in the code. Give me the complete testcase code file. Make sure that all testcases get passed. The name of the file which has code is ';
exports.validateTestcasePrompt = 'These are the testcases for the code. Validate those and return "true" if testcases are passed and return "false" if any testcase fails. Do not provide any explanations. Do not respond with anything except "true" or "false".';
