const Channel = require(path.join(libPath, 'channel'));  
const { Validator } = require(path.join(libPath, 'utils'));
  
const channel = new Channel(
  {
    sent: [],
    send: msg => {
      channel.connection.sent = [...channel.connection.sent, msg];
    },
  },
  '127.0.0.1',
  {
    sendStructure: () => {},
    validator: {
      names: () => {},
      name: () => {},
      login: () => {},
      password: () => {},
      token: () => {},
      tokenExistance: () => {}
    },
    storage: {
      storagePath: './testPath',
      tokenLifeTime: 1000,
      files: {},
      recalculate: () => {},
      findPlace: () => {},
      buildStructure: () => {},
      upload: async (dirPath, filename, buffer) => {
        channel.application.storage.files[path.join(dirPath, filename)] = buffer;
      },
      createFolder: async () => {},
      download: async () => {},
      deleteFolder: async () => {},
      delete: async () => {},
    },
    db: {
      size: 0,
      tables: {
        FileInfo: []
      },
      insert: async (table, data) => {
        channel.application.db.size = data.size;
        channel.application.db.tables[table].push(data);
      },
      delete: async () => {},
      select: async (table, select, where) => {
        return channel.application.db.tables[table];
      },
      update: async (table, delta, condition) => {
        const splitted = delta.split('=');
        const s = splitted[1];
        channel.application.db.size = Number(s.substring(2, s.length - 1));
      },
    },
    logger: {
      log: () => {},
      error: (error) => { throw error },
      success: () => {},
    },
  }
);

channel.user = { login: 'test', password: 'test', token: 'test' }

const testChannel = async (messages) => {
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (i === 0) await channel.message(message) 
    else await channel.buffer(message);
  }
}

const testPmtUploadInsert = [
  JSON.stringify({
    callid: 0,
    msg: 'pmtUpload',
    args: {
      fileList: ['testName']
    },
  }),
  Buffer.from('1')
];

const testPmtUploadUpdate = [
  JSON.stringify({
    callid: 0,
    msg: 'pmtUpload',
    args: {
      fileList: ['testName']
    },
  }),
  Buffer.from('12345')
];

const testPmtUploadMultipleFiles = [
  JSON.stringify({
    callid: 0,
    msg: 'pmtUpload',
    args: {
      fileList: ['testName1', 'testName2', 'testName3' ]
    },
  }),
  Buffer.from('123'),
  Buffer.from('456'),
  Buffer.from('789')
];

test(
  async () => {
    await testChannel(testPmtUploadInsert);
    if (Buffer.compare(Object.values(channel.application.storage.files)[0], Buffer.from('1')) !== 0) {
      throw new Error('Buffer corrupted while loading');
    }
    if (channel.application.db.tables['FileInfo'][0].token !== 'test') {
      throw new Error('Token corrupted while loading');
    }
    if (channel.application.db.tables['FileInfo'][0].name !== 'testName') {
      throw new Error('Name corrupted while loading');
    }
    if (channel.application.db.tables['FileInfo'][0].size !== 1) {
      throw new Error('Size corrupted while loading');
    }
    await testChannel(testPmtUploadUpdate);
    if (Buffer.compare(Object.values(channel.application.storage.files)[0], Buffer.from('12345')) !== 0) {
      throw new Error('Buffer corrupted while updating');
    }
    if (channel.application.db.tables['FileInfo'][0].name !== 'testName') {
      throw new Error('Name corrupted while updating');
    }
    if (channel.application.db.size !== 5) {
      throw new Error('Size corrupted while updating');
    }
    channel.application.db.size = 0;
    channel.application.db.tables = { FileInfo: [] };
    channel.application.storage.files = {};
    await testChannel(testPmtUploadMultipleFiles);
    // console.log(channel.application.storage, channel.application.db.tables, channel.application.db.size);
  }, 
  [{}]
);
