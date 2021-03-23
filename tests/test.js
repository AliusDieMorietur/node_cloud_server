const tester = require('./tester');

const { zip, validate } = require('../target/lib/utils');
const { Storage } = require('../target/lib/storage');

tester.start(async test => [

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
      []
    ]
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
      ]
    ]
  })

  // test('validate', {
  //   context: null,
  //   fn: validate,
  //   fnArgs: [
  //     [
  //       'login',
  //       'AZaz09'
  //     ]
  //   ],
  //   specialRules: (context, result) => {
  //     // console.log(result);
  //   }
  // })
]);