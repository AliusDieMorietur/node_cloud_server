const util = require('util');
const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const CLEAR = '\x1b[0m';

const TEXTCOLORS = {
  info: '\u001b[37m',
  error: '\u001b[31m',
  success: '\x1b[38;2;26;188;156m',
  ext: '\x1b[38;2;94;136;255m',
};

class Tester {
  constructor() {
    this.failedTests = 0;
    this.passedTests = 0;
  }

  loadCases(testsPath) {
    const dirPath = path.join(process.cwd(), testsPath);
    const tests = fs.readdirSync(dirPath)
      .map(testName => {
        const filePath = path.join(dirPath, testName);
        const content = fs.readFileSync(filePath, 'utf-8');
        return [testName.substring(0, testName.length - 3), content];
      });
    return tests;
  }

  async start(testsPath, libPath) {
    process.on('unhandledRejection', this.unhandledRejection);
    const cases = this.loadCases(testsPath);
    const tests = cases.map(async ([testName, content]) => new Promise((resolve) => {
      const context = {
        libPath: path.join(process.cwd(), libPath),
        Buffer,
        console,
        path,
        require,
        setTimeout,
        assert,
        test: this.test.bind(this, resolve, testName)
      };
      const script = new vm.Script(content);
      const sandbox = vm.createContext(context);
      script.runInNewContext(sandbox);
    }));
    await Promise.all(tests);
    this.analysis();
  }

  async test(resolve, testName, fn, assertions) {
    for (const { args = [], expectedResult, shouldFail } of assertions) {
      let start = new Date().getTime();
      try {        
        const result = await fn(...args);
        const end = new Date().getTime();
        if (expectedResult !== undefined) assert.deepEqual(result, expectedResult);
        this.success(testName, end - start);
      } catch (error) {
        const end = new Date().getTime();
        if (shouldFail) this.success(testName, end - start)
        else this.error(testName, error, args);
      }
    }
    resolve();
  }

  unhandledRejection(reason, promise) {
    console.clear();
    const errorMessage = 
      TEXTCOLORS['error'] +  
      '\nUnhandled Rejection at:\n' +
      CLEAR; 
    const reasonMessage = 
      TEXTCOLORS['error'] +  
      '\nReason:\n' +
      CLEAR;
    console.log(
      errorMessage,
      promise,
      reasonMessage, 
      reason, 
    );
    process.exit(0);
  }

  success(name, time) {
    this.passedTests++;
    const line =
      TEXTCOLORS['success'] +
      `✓ Test passed on: ` +
      TEXTCOLORS['ext'] +
      name +
      TEXTCOLORS['info'] +
      ` [${time} ms]` + 
      CLEAR;
    console.log(line);
  }

  error(name, error, args) {
    this.failedTests++;
    const line =
      TEXTCOLORS['error'] +
      `✗ Test failed on: ` +
      TEXTCOLORS['ext'] +
      `${name}\n` +
      TEXTCOLORS['error'] +
      `With args: ${util.inspect(args, { depth: null })}\n` +
      `${error.stack}` + 
      CLEAR;
    console.log(line);
  }

  analysis() {
    console.log(
      `\n` +
      `  Tests passed: ${this.passedTests}\n` +
      `  Tests failed: ${this.failedTests}\n` +
      `  Tests total: ${this.failedTests + this.passedTests}\n`
    );
  }
}

module.exports = new Tester();