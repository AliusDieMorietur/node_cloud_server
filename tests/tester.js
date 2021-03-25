const fs = require('fs');
const util = require('util');
const assert = require('assert').strict;

// const zip = (arr1, arr2) => {
//   const [longest, shortest] = arr1.length < arr2.length
//     ? [arr2, arr1]
//     : [arr1, arr2];
  
//   return longest.map((item, index) => [
//     item, 
//     shortest[index] ? shortest[index] : null  
//   ]);
// }

const zip = (arr1, arr2) => 
  (arr1.length < arr2.length ? arr2 : arr1)
    .map((item, index) => [
      arr1[index] !== undefined ? arr1[index] : null, 
      arr2[index] !== undefined ? arr2[index] : null  
    ]);

const TEXTCOLORS = {
  info: '\u001b[37m',
  error: '\u001b[31m',
  // success: '\u001b[32m',
  success: '\x1b[38;2;26;188;156m',
  ext: '\x1b[38;2;94;136;255m'
};

class Logger {
  constructor() {
    this.stream = fs.createWriteStream('./tests/log.txt', { flags: 'a' })
  }

  write(level, ...args) {
    const s = util.format(...args);
    const color = TEXTCOLORS[level];
    const line = `${color}${s}`;
    console.log(line + '\x1b[0m');
    this.stream.write(`${s}\n`);
  }

  log(...args) {
    this.write('info', ...args);
  }

  error(...args) {
    this.write('error', ...args);
  }

  success(...args) {
    this.write('success', ...args);
  }
}

class Tester {
  constructor() {
    this.failedTestscounter = 0;
    this.passedTestscounter = 0;
    this.logger = new Logger();
  }

  async start(lambda) {
    const tests = await lambda(this.test.bind(this));
    Promise.all(tests)
      .then(this.analysis.bind(this));
  }

  async test(testName, testable) {
    const { 
      context,
      fn, 
      fnArgs, 
      expectedResults,
      specialRules
    } = testable;   

    const zipped = expectedResults
      ? zip(fnArgs, expectedResults)
      : zip(fnArgs, []);

    for (const [arg, expectedResult] of zipped) {
      try {
        const fnWithContext = context ? fn.bind(context) : fn;
        const asyncified = fn instanceof (async () => {}).constructor
          ? fnWithContext
          : async (...args) => fnWithContext(...args)
        const start = new Date().getTime();
        const result = await asyncified(...arg);
        const end = new Date().getTime();

        // const result = fn instanceof (async () => {}).constructor 
        //   ? await fnWithContext(...arg)
        //   : fnWithContext(...arg);

        const error = specialRules 
          ? specialRules(context, result, arg) 
          : null;
          
        if (
          expectedResult !== undefined && 
          expectedResult !== null 
        ) assert.deepEqual(result, expectedResult);
        
        if (error) {
          this.failedTestscounter++;
          const line = `\n✗ Test failed on: ` +
                        TEXTCOLORS['ext'] +
                      `${testName}\n` +
                        TEXTCOLORS['error'] + 
                      `\nWith args: ${util.inspect(arg, { depth: null })}\n` +
                      `\n${error}`;
          this.logger.error(line);
        } else {
          this.passedTestscounter++;
          const line = `✓ Test passed on: ` +
                        TEXTCOLORS['ext'] +
                        testName + 
                        TEXTCOLORS['info'] + 
                        ` [${end - start} ms]`;
          this.logger.success(line);
        };
      } catch (error) {
        this.failedTestscounter++;
        const line = `\n✗ Test failed on: ` +
                      TEXTCOLORS['ext'] +
                    `${testName}\n` +
                      TEXTCOLORS['error'] + 
                    `\nWith args: ${util.inspect(arg, { depth: null })}\n` +
                    `\n${error}`;
        this.logger.error(line);
      }
    }
  }

  analysis() { 
    this.logger.log(
      `\n` + 
      `  Tests passed: ${this.passedTestscounter}\n` + 
      `  Tests failed: ${this.failedTestscounter}\n` +
      `  Tests total: ${this.failedTestscounter + this.passedTestscounter}\n`
    ) 
  }
}

module.exports = new Tester();
