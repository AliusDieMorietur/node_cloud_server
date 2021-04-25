const { zip } = require(path.join(libPath, 'utils'));

test(
  zip,
  [
    {
      args: [
        [1, 2, 3],
        [4, 5, 6],
      ],
      expectedResult: [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
    },
    {
      args: [
        [1, 2, 3],
        [4, 5],
      ],
      expectedResult: [
        [1, 4],
        [2, 5],
        [3, null],
      ],
    },
    {
      args: [
        [1, 2],
        [4, 5, 6],
      ],
      expectedResult: [
        [1, 4],
        [2, 5],
        [null, 6],
      ],
    },
    {
      args: [[], []],
      expectedResult: [],
    },
    {
      args: [[1, 2, 3], []],
      expectedResult: [
        [1, null],
        [2, null],
        [3, null],
      ],
    },
  ],
);