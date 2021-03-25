const tester = require('./tester');

const { zip, validate } = require('../target/lib/utils');
const { Storage } = require('../target/lib/storage');

tester.start(async test => [

  test('asyncFunctionExample', {
    context: null,
    fn: async () => new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(1);
      }, Math.floor(Math.random() * 500));
    }),
    fnArgs: [[]]
  }),

  test('Storage.buildStructure', {
    context: Storage,
    fn: Storage.buildStructure,
    fnArgs: [
      [
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
      [
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
      [
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
      [
        []
      ]
    ],
    expectedResults: [
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
      [
        {
          name: 'New Folder',
          childs: [
            { name: 'sons2.pptx', childs: null, capacity: 11141537 }      
          ],
          capacity: 11141537
        }
      ],
      [
        {
          name: 'New Folder',
          childs: [],
          capacity: 0
        }
      ],
      []
    ],
    specialRules: (context, result) => {
    }
  }),

  test('Storage.findPlace', {
    context: Storage,
    fn: Storage.findPlace,
    fnArgs: [
      [
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
      ]
    ],
    expectedResults: [
      [
        { name: 'sons2.docx', childs: null, capacity: 382829 },       
        { name: 'sons2.pptx', childs: null, capacity: 11141537 }      
      ]
    ]
  }),
  
  test('zip', {
    context: null,
    fn: zip,
    fnArgs: [
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      [
        [1, 2, 3],
        [4, 5],
      ],
      [
        [1, 2],
        [4, 5, 6],
      ],
      [
        [],
        []
      ],
      [
        [1, 2, 3],
        []
      ]
    ],
    expectedResults: [
      [
        [1, 4],
        [2, 5],
        [3, 6]
      ],
      [
        [1, 4],
        [2, 5],
        [3, null]
      ],
      [
        [1, 4],
        [2, 5],
        [null, 6]
      ],
      [],
      [
        [1, null],
        [2, null],
        [3, null]
      ]
    ]
  }),

  test('validate.login', {
    context: null,
    fn: validate.login,
    fnArgs: [
      ['Ab0oihf_.'],
      ['Ab0_.oihfasudhbfuasasdfojnasfjuasas'],
      ['weq'],
      ['']
    ],
    expectedResults: [
      true,
      false,
      false,
      false
    ],
    specialRules: (context, result, args) => {}
  }),

  test('validate.password', {
    context: null,
    fn: validate.password,
    fnArgs: [
      ['normalPassword'],
      ['normal Password'],
      ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx'],
      ['weq'],
      ['']
    ],
    expectedResults: [
      true,
      false,
      false,
      false,
      false
    ],
    specialRules: (context, result, args) => {}
  }),

  
  test('validate.token', {
    context: null,
    fn: validate.token,
    fnArgs: [
      ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx'],
      ['mFtnBJIIba8H1HEmGfucVshUIjKBZD2c'],
      ['6ELwoCSq9UPv$246Rp/b8J:7KSNCrAmx'],
      ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmxasds'],
      ['weq'],

    ],
    expectedResults: [
      true,
      true,
      false,
      false,
      false
    ],
    specialRules: (context, result, args) => {}
  }),
  
  test('validate.name', {
    context: null,
    fn: validate.name,
    fnArgs: [
      ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx'],
      ['Folder or File name'],
      ['File (1).js'],
      ['1-kek.ts'],
      ['1_kek.rs'],
      ['Folder/1_kek.rs'],
      ['folder/folder/Folder/1_kek.rs'],
      ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx6ELwoCSq9UPvo246Rp2b8JO7KSNCrA'],
      ['folder/folder//file'],
      ['folder//folder/'],
      ['folder////folder/'],
      ['folder///////folder/'],
      ['/'],
      ['/folder/folder1/'],
      ['/folder/file'],
      [''],
      [':/wq#@$']
    ],
    expectedResults: [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ],
    specialRules: (context, result, args) => {}
  }),
]);