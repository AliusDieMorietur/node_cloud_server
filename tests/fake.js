const metatests = require('metatests');
const Transport = require('../lib/socket');

metatests.test('Temporary upload/download/available', async (test) => {
  const buffers = [];
  const transport = new Transport(
    () => {}, 
    (buffer) => {
      buffers.push(buffer);
    }, 
    'localhost:7000'
  );
  await transport.ready();
  const fileList = ['1', '2'];
  const files = [Buffer.from('1'), Buffer.from('2')]
  const result = await transport.socketCall("tmpUploadStart", { fileList })
  test.strictSame(result, 'ok');
  for (const file of files) await transport.bufferCall(file);
  const token = await transport.socketCall("tmpUploadEnd", { fileList });
  const available = await transport.socketCall("tmpAvailableFiles", { token });
  test.strictSame(fileList, available);
  await transport.socketCall("tmpDownload", { token, fileList })
  test.strictSame(buffers, [Buffer.from('1'), Buffer.from('2')]);
  transport.close();
  test.end();
});



