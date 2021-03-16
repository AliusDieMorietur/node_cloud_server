const tester = require('./tester');

const { TemporaryStorage } = require('../target/lib/TemporaryStorage');

(async () => {
  await tester.test('TemporaryStorage.saveBuffer', {
    fn: new TemporaryStorage().saveBuffer,
    context: new TemporaryStorage('../target/storage', 600, { send(buffer) { return buffer; } }),
    fnArgs: [Buffer.from([1, 2, 3])],
    entityInspector: (context, result) => {
      // console.log(context, result);
      if (!(context.buffers[0] instanceof Buffer)) return 'Missed buffer';
    }
  })
  
  await tester.test('TemporaryStorage.download', {
    fn: new TemporaryStorage().download,
    context: new TemporaryStorage('./tests/test_storage', 600, { send(buffer) { return buffer; } }),
    fnArgs: [{ token: 'test', files: ['Screenshot_2 (1).png'] }],
    entityInspector: (context, result) => {
      // console.log(context, result);
      if (!result) return 'Missed result';
    }
  })
  
  tester.analysis();
})();