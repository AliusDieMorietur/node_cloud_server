const fs = require('fs');
const { format } = require('util');
const assert = require('assert').strict;

const zip = (arr1, arr2) => {
  const [longest, shortest] = arr1.length < arr2.length
  ? [arr2, arr1]
  : [arr1, arr2];
  
  return longest.map((item, index) => [
    item, 
    shortest[index] ? shortest[index] : null  
  ]);
}

const TEXTCOLORS = {
  info: '\u001b[37m',
  error: '\u001b[31m',
  success: '\u001b[32m',
};

class Logger {
  constructor() {
    this.stream = fs.createWriteStream('./tests/log.txt', { flags: 'a' })
  }

  write(level, ...args) {
    const s = format('', ...args);
    const color = TEXTCOLORS[level];
    const line = `${color}${s}`;
    console.log(line + '\x1b[0m');
    this.stream.write(`${s}` + '\n');
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
        const result = await asyncified(...arg);

        // const result = fn instanceof (async () => {}).constructor 
        //   ? await fnWithContext(...arg)
        //   : fnWithContext(...arg);

        if (expectedResult) assert.deepEqual(result, expectedResult);

        const error = specialRules 
          ? specialRules(context, result) 
          : null;

        if (error) {
          this.failedTestscounter++;
          this.logger.error(`✗ Test failed on: ${testName} Error: ${error}\n   With args: [${JSON.stringify(arg, null, 2)}] `)
        } else {
          this.passedTestscounter++;
          this.logger.success(`✓ Test passed on: ${testName}`);
        };
      } catch (error) {
        this.failedTestscounter++;
        this.logger.error(`✗ Test failed on: ${testName} Error: ${error}\n   With args: [${JSON.stringify(arg, null, 2)}]`);
      }
    }
  }

  analysis() { 
    this.logger.log(
      `\n` + 
      ` Tests passed: ${this.passedTestscounter}\n` + 
      ` Tests failed: ${this.failedTestscounter}\n` +
      ` Tests total: ${this.failedTestscounter + this.passedTestscounter}`
    ) 
  }
}

module.exports = new Tester();
