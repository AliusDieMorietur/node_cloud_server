const tester = require('./tester');

const { zip, Validator } = require('../target/lib/utils');
const { Storage } = require('../target/lib/storage');
const { Channel } = require('../target/lib/channel');

tester.start(test => [

  test('asyncFunctionExample', {
    context: {
      fnContext: null,
      fn: async () => new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(1);
        }, Math.floor(Math.random() * 500));
      }),
    },
    assertions: [
      {
        args: [],
        expectedResult: 1
      }
    ],
    specialRules: (context, fnConext, result, args) => {}
  }),

  test('Storage.buildStructure', {
    context: {
      fnContext: new Storage('./testPath'),
      fn: new Storage('./testPath').buildStructure,
    },
    assertions: [
      {
        args: [
          [
            {
              id: 162,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: 'New Folder/',
              fakename: 'folder',
              size: 0
            },
            {
              id: 163,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: '1.sm',
              fakename: 'vlVvqH4AQMCiC31I2NJ7c9VE02Pj7fZa',
              size: 19194
            },
            {
              id: 164,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: '2.sm',
              fakename: 'IP3Sfd2Kk3nAfWKnfnBfpzKP3slVBTYC',
              size: 4697
            },
            {
              id: 165,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: 'New Folder/sons2.docx',
              fakename: 'tMSnHsXlnZJSK1Xlf80OFkoyW0Be5HXD',
              size: 382829
            },
            {
              id: 166,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: 'New Folder/sons2.pptx',
              fakename: '3eWVqLDnxAkMmdET9CUoUsHYjggRbJq9',
              size: 11141537
            }
          ]
        ],
        expectedResult: [
          {
            name: 'New Folder',
            childs: [
              { name: 'sons2.docx', childs: null, capacity: 382829 },       
              { name: 'sons2.pptx', childs: null, capacity: 11141537 }      
            ],
            capacity: 11524366
          },
          { name: '1.sm', childs: null, capacity: 19194 },
          { name: '2.sm', childs: null, capacity: 4697 }
        ]
      },
      {
        args: [
          [
            {
              id: 162,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: 'New Folder/',
              fakename: 'folder',
              size: 0
            },
            {
              id: 166,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: 'New Folder/sons2.pptx',
              fakename: '3eWVqLDnxAkMmdET9CUoUsHYjggRbJq9',
              size: 11141537
            }
          ]
        ],
        expectedResult: [
          {
            name: 'New Folder',
            childs: [
              { name: 'sons2.pptx', childs: null, capacity: 11141537 }      
            ],
            capacity: 11141537
          }
        ]
      },
      {
        args: [
          [
            {
              id: 162,
              token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
              name: 'New Folder/',
              fakename: 'folder',
              size: 0
            }
          ]
        ],
        expectedResult: [
          {
            name: 'New Folder',
            childs: [],
            capacity: 0
          }
        ]
      },
      {
        args: [
          []
        ],
        expectedResult: []
      }
    ]
  }),

  test('Storage.findPlace', {
    context: {
      fnConext: new Storage('./testPath'),
      fn: new Storage('./testPath').findPlace
    },
    assertions: [
      {
        args: [
          [
            {
              name: 'New Folder',
              childs: [
                { name: 'sons2.docx', childs: null, capacity: 382829 },       
                { name: 'sons2.pptx', childs: null, capacity: 11141537 }      
              ],
              capacity: 11524366
            },
            { name: '1.sm', childs: null, capacity: 19194 },
            { name: '2.sm', childs: null, capacity: 4697 }
          ],
          'New Folder/'
        ],
        expectedResult: [
          { name: 'sons2.docx', childs: null, capacity: 382829 },       
          { name: 'sons2.pptx', childs: null, capacity: 11141537 }      
        ]
      }
    ]
  }),



  test('Channel.commands.upload', {
    context: {
      fnContext: {},
      fn: async messages => {
        for (const message of messages) 
          await channel.message(message);

      },
      channel: new Channel(
        { sent: [], send: msg => { channel.connection.sent = [ ...channel.connection.sent, msg] } },
        '127.0.0.1', 
        {
          validator: new Validator(),
          storage: {
            storagePath: './testPath',
            tokenLifeTime: 1000,
            files: {},
            recalculate: currentFolder => { }, 
            findPlace: (departureFolder, currentPath) => { }, 
            buildStructure: rows => { }, 
            upload: async (dirPath, filename, buffer) => { 
              channel.application.storage.files[dirPath + '\\' + filename] = buffer
            }, 
            createFolder: async () => {}, 
            download: async (dirPath, fileNames, connection) => { },        
            deleteFolder: async dirPath => { },
            delete: async (dirPath, fileNames) => {}
          },
          db: { 
            tables: {},
            insert: async (table, data) => { 
              channel.application.db.tables[table] = 
                channel.application.db.tables[table] 
                  ? [...channel.application.db.tables[table], data] 
                  : [data] 
            },
            delete: async (table, where) => {}, 
            select: async (table, select, where) => { 
              console.log(channel.application.db.tables);
              return channel.application.db.tables[table] 
                ? channel.application.db.tables[table] 
                  .filter(item => select[0] === '*' ? true : false) 
                  .filter(item => {
                    const [field, value] = where.split(" = ");
                    
                    return item[field] === value;
                  })
                : [];
            }, 
            update: async () => {} 
          }, 
          logger: { 
            log: () => {},
            error: (...args) => console.log(args), 
            success: () => {}, 
          }  
        }
      ),

    },

    assertions: [
      {
        args: [[
            JSON.stringify({
              callid: 0,
              msg: 'upload',
              args: {
                fileList: [
                  "2"
                ], 
                storage: 'tmp' 
              }
            }),
            Buffer.from("1"),
          ]
        ],
      }
    ],
    specialRules: (context, fnConext, result, args) => {
      console.log(context.channel.application.storage);
    }
  }),
  
]);

