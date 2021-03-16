const fs = require('fs');
const { format } = require('util');

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

  async test(testName, testable) {
    const { 
      fn, 
      fnArgs, 
      context,
      entityInspector 
    } = testable;   

    try {
      const fnWithContext = fn.bind(context);
      const asyncified = fn instanceof (async () => {}).constructor
        ? fnWithContext
        : async (...args) => fnWithContext(...args)
      const result = await asyncified(...fnArgs);
      const error = entityInspector(context, result);
      if (error) {
        this.failedTestscounter++;
        this.logger.error(`✘ Test failed on: ${testName} Error: ${error}`)
      } else {
        this.passedTestscounter++;
        this.logger.success(`✔ Test passed on: ${testName} `);
      };
    } catch (error) {
      this.logger.error(`✘ Test failed on: ${testName} Error: ${error}`);
    }
  }

  analysis() { 
    this.logger.log(
      `\n` + 
      ` Tests passed: ${this.passedTestscounter}\n` + 
      ` Tests failed: ${this.failedTestscounter}\n` +
      ` Generally: ${this.failedTestscounter + this.passedTestscounter}`
    ) 
  }
}

module.exports = new Tester();
