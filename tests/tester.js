const fs = require('fs');
const util = require('util');
const assert = require('assert');
const vm = require('vm');

const TEXTCOLORS = {
  info: '\u001b[37m',
  error: '\u001b[31m',
  success: '\x1b[38;2;26;188;156m',
  ext: '\x1b[38;2;94;136;255m',
};

class Logger {
  constructor() {
    this.stream = fs.createWriteStream('./tests/log.txt', { flags: 'a' });
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
    const tests = lambda(this.test.bind(this));
    await Promise.all(tests);
    this.analysis();
  }

  async test(testName, testable) {
    const { context, assertions, specialRules } = testable;

    const createContext = (context, args, expectedResult) => ({
      result: null,
      assert,
      args,
      log: console.log,
      expectedResult,
      specialRules,
      ...context,
    });

    for (const { args, expectedResult } of assertions) {
      const newContext = createContext(context, args, expectedResult);
      const { fnContext } = newContext;
      Object.assign(global, newContext);
      try {
        const script = new vm.Script(`fn.bind(fnContext)(...args);`);
        const start = new Date().getTime();
        const result = await script.runInThisContext();
        const end = new Date().getTime();

        if (specialRules) specialRules(context, fnContext, result, args);

        if (expectedResult !== undefined && expectedResult !== null) {
          assert.deepStrictEqual(result, expectedResult);
        }

        this.passedTestscounter++;
        const line =
          `✓ Test passed on: ` +
          TEXTCOLORS['ext'] +
          testName +
          TEXTCOLORS['info'] +
          ` [${end - start} ms]`;
        this.logger.success(line);
      } catch (error) {
        this.failedTestscounter++;
        const line =
          `✗ Test failed on: ` +
          TEXTCOLORS['ext'] +
          `${testName}\n` +
          TEXTCOLORS['error'] +
          `\n${error}\n` +
          `\nWith args: ${util.inspect(args, { depth: null })}\n` +
          `${error.stack}`;
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
    );
  }
}

module.exports = new Tester();
