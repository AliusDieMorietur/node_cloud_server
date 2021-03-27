const tester = require('./vmTester');

const { zip, validate } = require('../target/lib/utils');
const { Storage } = require('../target/lib/storage');
const { Channel } = require("../target/lib/channel")
const assert = require('assert').strict;

tester.start(async test => [

  test('asyncFunctionExample', {
    contexts: [
      {
        fnContext: null
      }
    ],
    fn: async () => new Promise((resolve, reject) => {
        setTimeout(() => {
        resolve(1);
        }, Math.floor(Math.random() * 500));
    }),
    assertions: [
      {
        args: [],
        expectedResult: 1
      }
    ],
    specialRules: (context, fnConext, result, args) => {}
  }),

  test('der`mo', {
    contexts: [
      {
        fnContext: {},
        channel: new Channel(
          { sent: [], send: msg => { sent = [...sent, msg]} },
          '127.0.0.1', 
          {
            db: { 
              tables: {},
              insert: (table, data) => { tables[table] = tables[table] ? [...tables[table], data] : [data] },
              delete: (table, where) => {
                tables[table]
                  .filter(item => {
                    const [field, value] = where.split(" = ");
                    
                    return item[field] === value;
                  })
                  .for_each(item => {
                    tables[table] = tables[table].splice(tables[table].indexOf(item), 1);
                  });
              }, 
              select: (table, select, where) => { 
                return tables[table]
                  .filter(item => select[0] === '*' ? true : false) 
                  .filter(item => {
                    const [field, value] = where.split(" = ");
                    
                    return item[field] === value;
                  });
              }, 
              update: () => {} 
            }, 
            logger: { 
              log: () => {},
              error: () => {}, 
              success: () => {}, 
            }  
          }
        ),
        _files: {},
        fsp: {
          mkdir: () => {}
        },
        Storage: {
          recalculate: (currentFolder) => { }, 
          findPlace: (departureFolder, currentPath) => { }, 
          buildStructure: rows => { }, 
          upload: async (dirPath, filename, buffer) => { files[dirPath + filename] = buffer }, 
          download: async (dirPath, fileNames, connection) => { },        
          deleteFolder: async dirPath => { },
          delete: async (dirPath, fileNames) => { for (const filename of fileNames) delete files[dirPath + filename] }
        }
      }
    ],
    fn: messages => {
      for (const msg of messages) channel.message(msg);
    },
    assertions: [
      {
        args: [[
            {
              callid: 0,
              msg: 'upload',
              args: [{
                fileList: [
                  "2"
                ], 
                storage: 'tmp' 
              }]
            },
            Buffer.from("1"),
          ]
        ],
      }
    ],
    specialRules: (context, fnConext, result, args) => {
      console.log(context);
    }
  }),
  
]);