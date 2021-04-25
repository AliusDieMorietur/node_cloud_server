const metatests = require('metatests');
const Transport = require('../lib/socket');
const serverConfig = require('../config/server');

metatests.test('Temporary upload/download/available', async (test) => {
  const buffers = [];
  const transport = new Transport(
    () => {}, 
    (buffer) => {
      buffers.push(buffer);
    }, 
    `${serverConfig.host}:${serverConfig.ports[0]}`
  );
  await transport.ready();
  const fileList = ['1', '2'];
  const files = [Buffer.from('1'), Buffer.from('2')]
  const result = await transport.socketCall('tmpUploadStart', { fileList })
  test.strictSame(result, 'ok');

  for (const file of files) await transport.bufferCall(file);
  const token = await transport.socketCall('tmpUploadEnd', { fileList });
  const available = await transport.socketCall('tmpAvailableFiles', { token });
  test.strictSame(fileList, available);

  await transport.socketCall('tmpDownload', { token, fileList })
  test.strictSame(buffers, [Buffer.from('1'), Buffer.from('2')]);

  try {
    await transport.socketCall('tmpAvailableFiles', { token: '12345678901234567890123456789012' });
  } catch (error) {
    test.strictSame(error.message, 'No such token');
  }

  const sessionToken = await transport.socketCall('authUser', { user: { login: 'admin', password: 'admin'} });
  test.strictSame(sessionToken.length, 32);

  const logOut = await transport.socketCall('logOut', {});
  test.strictSame(logOut, 'ok');

  transport.close();
  test.end();
});



