const tester = require('./tester');

const { zip, Validator } = require('../lib/utils');
const Storage = require('../lib/storage');
const Channel = require('../lib/channel');

tester.start(test => [
  test(
    'name', 
    {
      
  
    }, 
    () => {

    }
  )
  // test('asyncFunctionExample', {
  //   context: {
  //     fnContext: null,
  //     fn: async () =>
  //       new Promise(resolve => {
  //         setTimeout(() => {
  //           resolve(1);
  //         }, Math.floor(Math.random() * 500));
  //       }),
  //   },
  //   assertions: [
  //     {
  //       args: [],
  //       expectedResult: 1,
  //     },
  //   ],
  // }),

  // test('Storage.buildStructure', {
  //   context: {
  //     fnContext: new Storage('./testPath'),
  //     fn: new Storage('./testPath').buildStructure,
  //   },
  //   assertions: [
  //     {
  //       args: [
  //         [
  //           {
  //             id: 162,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: 'New Folder/',
  //             fakename: 'folder',
  //             size: 0,
  //           },
  //           {
  //             id: 163,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: '1.sm',
  //             fakename: 'vlVvqH4AQMCiC31I2NJ7c9VE02Pj7fZa',
  //             size: 19194,
  //           },
  //           {
  //             id: 164,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: '2.sm',
  //             fakename: 'IP3Sfd2Kk3nAfWKnfnBfpzKP3slVBTYC',
  //             size: 4697,
  //           },
  //           {
  //             id: 165,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: 'New Folder/sons2.docx',
  //             fakename: 'tMSnHsXlnZJSK1Xlf80OFkoyW0Be5HXD',
  //             size: 382829,
  //           },
  //           {
  //             id: 166,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: 'New Folder/sons2.pptx',
  //             fakename: '3eWVqLDnxAkMmdET9CUoUsHYjggRbJq9',
  //             size: 11141537,
  //           },
  //         ],
  //       ],
  //       expectedResult: [
  //         {
  //           name: 'New Folder',
  //           children: [
  //             { name: 'sons2.docx', children: null, capacity: 382829 },
  //             { name: 'sons2.pptx', children: null, capacity: 11141537 },
  //           ],
  //           capacity: 11524366,
  //         },
  //         { name: '1.sm', children: null, capacity: 19194 },
  //         { name: '2.sm', children: null, capacity: 4697 },
  //       ],
  //     },
  //     {
  //       args: [
  //         [
  //           {
  //             id: 162,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: 'New Folder/',
  //             fakename: 'folder',
  //             size: 0,
  //           },
  //           {
  //             id: 166,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: 'New Folder/sons2.pptx',
  //             fakename: '3eWVqLDnxAkMmdET9CUoUsHYjggRbJq9',
  //             size: 11141537,
  //           },
  //         ],
  //       ],
  //       expectedResult: [
  //         {
  //           name: 'New Folder',
  //           children: [{ name: 'sons2.pptx', children: null, capacity: 11141537 }],
  //           capacity: 11141537,
  //         },
  //       ],
  //     },
  //     {
  //       args: [
  //         [
  //           {
  //             id: 162,
  //             token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
  //             name: 'New Folder/',
  //             fakename: 'folder',
  //             size: 0,
  //           },
  //         ],
  //       ],
  //       expectedResult: [
  //         {
  //           name: 'New Folder',
  //           children: [],
  //           capacity: 0,
  //         },
  //       ],
  //     },
  //     {
  //       args: [[]],
  //       expectedResult: [],
  //     },
  //   ],
  // }),

  // test('Storage.findPlace', {
  //   context: {
  //     fnConext: new Storage('./testPath'),
  //     fn: new Storage('./testPath').findPlace,
  //   },
  //   assertions: [
  //     {
  //       args: [
  //         [
  //           {
  //             name: 'New Folder',
  //             children: [
  //               { name: 'sons2.docx', children: null, capacity: 382829 },
  //               { name: 'sons2.pptx', children: null, capacity: 11141537 },
  //             ],
  //             capacity: 11524366,
  //           },
  //           { name: '1.sm', children: null, capacity: 19194 },
  //           { name: '2.sm', children: null, capacity: 4697 },
  //         ],
  //         'New Folder/',
  //       ],
  //       expectedResult: [
  //         { name: 'sons2.docx', children: null, capacity: 382829 },
  //         { name: 'sons2.pptx', children: null, capacity: 11141537 },
  //       ],
  //     },
  //   ],
  // }),

  // test("zip", {
  //   context: {
  //     fnContext: null,
  //     fn: zip
  //   },
  //   assertions: [
  //     {
  //       args: [
  //         [1, 2, 3],
  //         [4, 5, 6],
  //       ],
  //       expectedResult: [
  //         [1, 4],
  //         [2, 5],
  //         [3, 6],
  //       ],
  //     },
  //     {
  //       args: [
  //         [1, 2, 3],
  //         [4, 5],
  //       ],
  //       expectedResult: [
  //         [1, 4],
  //         [2, 5],
  //         [3, null],
  //       ],
  //     },
  //     {
  //       args: [
  //         [1, 2],
  //         [4, 5, 6],
  //       ],
  //       expectedResult: [
  //         [1, 4],
  //         [2, 5],
  //         [null, 6],
  //       ],
  //     },
  //     {
  //       args: [[], []],
  //       expectedResult: [],
  //     },
  //     {
  //       args: [[1, 2, 3], []],
  //       expectedResult: [
  //         [1, null],
  //         [2, null],
  //         [3, null],
  //       ],
  //     },
  //   ],
  // }),

  // test("Validate.password", {
  //   context: {
  //     fnContext: new Validator({select: () => [0]}),
  //     fn: validate.login
  //   },
  //   assertions: [
  //     {
  //       args: ["Ab0oihf_."],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["Ab0_.oihfasudhbfuasasdfojnasfjuasas"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["weq"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: [""],
  //       expectedResult: false,
  //     },
  //   ],
  // }),

  // test("validate.password", {
  //   context: {
  //     fnContext:null,
  //     fn: validate.password
  //   },
  //   assertions: [
  //     {
  //       args: ["normalPassword"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["normal Password"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["weq"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: [""],
  //       expectedResult: false,
  //     },
  //   ],
  // }),

  // test("validate.token", {
  //   context: {
  //     fnConext: null,
  //     fn: validate.token,
  //   },
  //   assertions: [
  //     {
  //       args: ["6p7wQaZxNXfPYncUXrM0QshaIwkBdswz"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["mFtnBJIIba8H1HEmGfucVshUIjKBZD2c"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["6ELwoCSq9UPv$246Rp/b8J:7KSNCrAmx"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmxasds"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["weq"],
  //       expectedResult: false,
  //     },
  //   ],
  // }),

  // test("validate.name", {
  //   context: {
  //     fnConext: null,
  //     fn: validate.name,
  //   },
  //   assertions: [
  //     {
  //       args: ["[DnB] - Tristam - Moonlight.mp3"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: [
  //         "[Glitch Hop ⁄ 110BPM] - Pegboard Nerds & Tristam - Razor Sharp [Monstercat Release]",
  //       ],
  //       expectedResult: true,
  //     },
  //     {
  //       args: [
  //         "[Hardcore] - Stonebank - Stronger (feat. EMEL) [Monstercat Release]",
  //       ],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["«Король и Шут» - «Кукла Колдуна» HD"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["Folder or File name"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["File (1).js"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["1-kek.ts"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["1_kek.rs"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["Folder/1_kek.rs"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["folder/folder/Folder/1_kek.rs"],
  //       expectedResult: true,
  //     },
  //     {
  //       args: [
  //         "6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx6ELwoCSq9UPvo246Rp2b8JO7KSNCrA",
  //       ],
  //       expectedResult: true,
  //     },
  //     {
  //       args: ["folder/folder//file"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["folder//folder/"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["folder////folder/"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["folder///////folder/"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["/"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["/folder/folder1/"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: ["/folder/file"],
  //       expectedResult: false,
  //     },
  //     {
  //       args: [""],
  //       expectedResult: false,
  //     },
  //     {
  //       args: [":/wq#@$"],
  //       expectedResult: false,
  //     },
  //   ],
  // }),

  // test('Channel.commands.upload', {
  //   context: {
  //     fnContext: {},
  //     fn: async messages => {
  //       for (const message of messages) await channel.message(message);
  //     },
  //     channel: new Channel(
  //       {
  //         sent: [],
  //         send: msg => {
  //           channel.connection.sent = [...channel.connection.sent, msg];
  //         },
  //       },
  //       '127.0.0.1',
  //       {
  //         validator: new Validator(),
  //         storage: {
  //           storagePath: './testPath',
  //           tokenLifeTime: 1000,
  //           files: {},
  //           recalculate: () => {},
  //           findPlace: () => {},
  //           buildStructure: () => {},
  //           upload: async (dirPath, filename, buffer) => {
  //             console.log(buffer);
  //             channel.application.storage.files[dirPath + filename] = buffer;
  //           },
  //           createFolder: async () => {},
  //           download: async () => {},
  //           deleteFolder: async () => {},
  //           delete: async () => {},
  //         },
  //         db: {
  //           tables: {},
  //           insert: async (table, data) => {
  //             channel.application.db.tables[table] = channel.application.db
  //               .tables[table]
  //               ? [...channel.application.db.tables[table], data]
  //               : [data];
  //           },
  //           delete: async () => {},
  //           select: async (table, select, where) => {
  //             console.log(channel.application.db.tables);
  //             return channel.application.db.tables[table]
  //               ? channel.application.db.tables[table]
  //                   .filter(() => select[0] === '*')
  //                   .filter(item => {
  //                     const [field, value] = where.split(' = ');

  //                     return item[field] === value;
  //                   })
  //               : [];
  //           },
  //           update: async () => {},
  //         },
  //         logger: {
  //           log: () => {},
  //           error: (...args) => console.log(args),
  //           success: () => {},
  //         },
  //       }
  //     ),
  //   },

  //   assertions: [
  //     {
  //       args: [
  //         [
  //           JSON.stringify({
  //             callid: 0,
  //             msg: 'upload',
  //             args: {
  //               fileList: ['2'],
  //               storage: 'tmp',
  //             },
  //           }),
  //           Buffer.from('1'),
  //         ],
  //       ],
  //     },
  //   ],
  //   specialRules: (context) => {
  //     console.log(context.channel.application.storage);
  //   },
  // }),
]);
