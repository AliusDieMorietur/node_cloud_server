const { Validator } = require(path.join(libPath, 'utils'));

const v = new Validator();
test(
  v.login,
  [
    {
      args: ["Ab0oihf_."]
    },
    {
      args: ["Ab0_.oihfasudhbfuasasdfojnasfjuasas"],
      shouldFail: true
    },
    {
      args: ["weq"],
      shouldFail: true
    },
    {
      args: [""],
      shouldFail: true
    },
  ]
);