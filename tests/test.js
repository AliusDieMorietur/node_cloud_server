const tester = require('./tester');

const { zip, validate } = require('../target/lib/utils');
const { Storage } = require('../target/lib/storage');

tester.start(async test => [

  test('test', {
    context: null,
    fn: (...args) => args,
    assertions: [
      {
        args: [1, 2, 3],
        expectedResult: [1, 2, 3]
      }
    ]
  }),

  test('asyncFunctionExample', {
    context: null,
    fn: async () => new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(1);
      }, Math.floor(Math.random() * 500));
    }),
    assertions: [
      {
        expectedResult: 1
      }
    ]
  }),

  test('Storage.buildStructure', {
    context: Storage,
    fn: Storage.buildStructure,
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
    context: Storage,
    fn: Storage.findPlace,
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
  
  test('zip', {
    context: null,
    fn: zip,
    assertions: [
      {
        args: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        expectedResult: [
          [1, 4],
          [2, 5],
          [3, 6]
        ] 
      },
      {
        args: [
          [1, 2, 3],
          [4, 5],
        ],
        expectedResult: [
          [1, 4],
          [2, 5],
          [3, null]
        ]
      },
      {
        args: [
          [1, 2],
          [4, 5, 6]
        ],
        expectedResult:  [
          [1, 4],
          [2, 5],
          [null, 6]
        ]
      },
      {
        args: [
          [],
          []
        ],
        expectedResult: []
      },
      {
        args: [
          [1, 2, 3],
          []
        ],
        expectedResult: [
          [1, null],
          [2, null],
          [3, null]
        ]
      }
    ]
  }),

  test('validate.login', {
    context: null,
    fn: validate.login,
    assertions: [
      {
        args:  ['Ab0oihf_.'],
        expectedResult: true
      },
      {
        args: ['Ab0_.oihfasudhbfuasasdfojnasfjuasas'],
        expectedResult: false
      },
      {
        args: ['weq'],
        expectedResult: false
      },
      {
        args: [''],
        expectedResult: false
      }
    ]
  }),

  test('validate.password', {
    context: null,
    fn: validate.password,
    assertions: [
      {
        args:  ['normalPassword'],
        expectedResult: true
      },
      {
        args: ['normal Password'],
        expectedResult: false
      },
      {
        args: ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx'],
        expectedResult: false
      },
      {
        args: ['weq'],
        expectedResult: false
      },
      {
        args: [''],
        expectedResult: false
      }
    ]
  }),

  
  test('validate.token', {
    context: null,
    fn: validate.token,
    assertions: [
      {
        args:  ['6p7wQaZxNXfPYncUXrM0QshaIwkBdswz'],
        expectedResult: true
      },
      {
        args: ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx'],
        expectedResult: true
      },
      {
        args: ['mFtnBJIIba8H1HEmGfucVshUIjKBZD2c'],
        expectedResult: true
      },
      {
        args: ['6ELwoCSq9UPv$246Rp/b8J:7KSNCrAmx'],
        expectedResult: false
      },
      {
        args: ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmxasds'],
        expectedResult: false
      },
      {
        args: ['weq'],
        expectedResult: false
      }
    ]
  }),
  
  test('validate.name', {
    context: null,
    fn: validate.name,
    assertions: [
      {
        args: ['[DnB] - Tristam - Moonlight.mp3'],
        expectedResult: true
      },
      {
        args: ['[Glitch Hop ⁄ 110BPM] - Pegboard Nerds & Tristam - Razor Sharp [Monstercat Release]'],
        expectedResult: true
      },
      {
        args: ['[Hardcore] - Stonebank - Stronger (feat. EMEL) [Monstercat Release]'],
        expectedResult: true
      },
      {
        args: ['«Король и Шут» - «Кукла Колдуна» HD'],
        expectedResult: true
      },
      {
        args: ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx'],
        expectedResult: true
      },
      {
        args: ['Folder or File name'],
        expectedResult: true
      },
      {
        args: ['File (1).js'],
        expectedResult: true
      },
      {
        args: ['1-kek.ts'],
        expectedResult: true
      },
      {
        args: ['1_kek.rs'],
        expectedResult: true
      },
      {
        args: ['Folder/1_kek.rs'],
        expectedResult: true
      },
      {
        args: ['folder/folder/Folder/1_kek.rs'],
        expectedResult: true
      },
      {
        args: ['6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx6ELwoCSq9UPvo246Rp2b8JO7KSNCrA'],
        expectedResult: true
      },
      {
        args: ['folder/folder//file'],
        expectedResult: false
      },
      {
        args: ['folder//folder/'],
        expectedResult: false
      },
      {
        args: ['folder////folder/'],
        expectedResult: false
      },
      {
        args: ['folder///////folder/'],
        expectedResult: false
      },
      {
        args: ['/'],
        expectedResult: false
      },
      {
        args: ['/folder/folder1/'],
        expectedResult: false
      },
      {
        args: ['/folder/file'],
        expectedResult: false
      },
      {
        args: [''],
        expectedResult: false
      },
      {
        args: [':/wq#@$'],
        expectedResult: false
      },
    ]
  }),
]);