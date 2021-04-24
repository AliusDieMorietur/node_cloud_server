
const a = async () =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(1);
    }, Math.floor(Math.random() * 500));
  });

test(
  a,
  [
    {
      args: [],
      expectedResult: 1
    }
  ]
);