const { Validator } = require(path.join(libPath, 'utils'));

const v = new Validator();

test(
  v.password,
  [
    {
      args: ["normalPassword"]
    },
    {
      args: ["normal Password"],
      shouldFail: true
    },
    {
      args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx"],
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