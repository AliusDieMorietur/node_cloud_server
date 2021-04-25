const Loader = require('./loader');
const fs = require('fs');
const fsp = fs.promises;
const vm = require('vm');
const path = require('path');
const utils = require('./utils');
const { toUnix } = utils;

const COMMON_CONTEXT = Object.freeze({
  path,
  utils,
  Buffer,
  URL,
  URLSearchParams,
  TextDecoder,
  TextEncoder,
  console,
  queueMicrotask,
  setTimeout,
  setImmediate,
  setInterval,
  clearTimeout,
  clearImmediate,
  clearInterval,
});

const createContext = context =>
  vm.createContext({ ...COMMON_CONTEXT, ...context });

class Api extends Loader {
  constructor(dirPath, application) {
    super(dirPath, application);
  }

  async load(filePath) {
    const code = await fsp.readFile(filePath);
    const script = new vm.Script(code);
    const context = createContext({ application: this.application });
    const exported = script.runInContext(context);
    this.collection.set(path.posix.basename(toUnix(filePath), '.js'), exported);
  }
}

module.exports = Api;
