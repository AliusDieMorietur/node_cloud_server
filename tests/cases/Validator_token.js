const { Validator } = require(path.join(libPath, 'utils'));

const v = new Validator();

test(
  v.token,
  [
    {
      args: ["6p7wQaZxNXfPYncUXrM0QshaIwkBdswz"]
    },
    {
      args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx"]
    },
    {
      args: ["mFtnBJIIba8H1HEmGfucVshUIjKBZD2c"]
    },
    {
      args: ["6ELwoCSq9UPv$246Rp/b8J:7KSNCrAmx"],
      shouldFail: true
    },
    {
      args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmxasds"],
      shouldFail: true
    },
    {
      args: ["weq"],
      shouldFail: true
    },
  ]
);