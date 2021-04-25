const metatests = require('metatests');
const path = require('path');
const AsyncQueue = require('../lib/queue');
const Api = require('../lib/api');
const API_PATH = path.join(process.cwd(), './tests/api');

metatests.test('Api test', async (test) => {
  const app = { c: 2 };
  const api = new Api(API_PATH, app);
  await api.loadDirectory();
  test.strictSame(api.has('add'), true);
  const { field, method } = api.get('add');
  test.strictSame(field, 'value');
  test.strictSame(await method(3, 5), 10);
  test.end();
});

metatests.test('AsyncQueue test', async (test) => {
  const sleep = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 300));
  const queue = new AsyncQueue(1);
  let counter = 0;
  for (let i = 0; i < 5; i++) {
    await queue.add(async () => {
      await sleep();
      counter += i;
    });
  }
  test.strictSame(counter, 10);
  test.end();
});


