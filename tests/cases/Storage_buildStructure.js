
const Storage = require(path.join(libPath, 'storage'));

const s = new Storage('./testPath');

test(
  s.buildStructure.bind(s),
  [
    {
      args: [
        [
          {
            id: 162,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: 'New Folder/',
            fakename: 'folder',
            size: 0,
          },
          {
            id: 163,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: '1.sm',
            fakename: 'vlVvqH4AQMCiC31I2NJ7c9VE02Pj7fZa',
            size: 19194,
          },
          {
            id: 164,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: '2.sm',
            fakename: 'IP3Sfd2Kk3nAfWKnfnBfpzKP3slVBTYC',
            size: 4697,
          },
          {
            id: 165,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: 'New Folder/sons2.docx',
            fakename: 'tMSnHsXlnZJSK1Xlf80OFkoyW0Be5HXD',
            size: 382829,
          },
          {
            id: 166,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: 'New Folder/sons2.pptx',
            fakename: '3eWVqLDnxAkMmdET9CUoUsHYjggRbJq9',
            size: 11141537,
          },
        ],
      ],
      expectedResult: [
        {
          name: 'New Folder',
          children: [
            { name: 'sons2.docx', children: null, capacity: 382829 },
            { name: 'sons2.pptx', children: null, capacity: 11141537 },
          ],
          capacity: 11524366,
        },
        { name: '1.sm', children: null, capacity: 19194 },
        { name: '2.sm', children: null, capacity: 4697 },
      ],
    },
    {
      args: [
        [
          {
            id: 162,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: 'New Folder/',
            fakename: 'folder',
            size: 0,
          },
          {
            id: 166,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: 'New Folder/sons2.pptx',
            fakename: '3eWVqLDnxAkMmdET9CUoUsHYjggRbJq9',
            size: 11141537,
          },
        ],
      ],
      expectedResult: [
        {
          name: 'New Folder',
          children: [{ name: 'sons2.pptx', children: null, capacity: 11141537 }],
          capacity: 11141537,
        },
      ],
    },
    {
      args: [
        [
          {
            id: 162,
            token: 'q1gw0osQxqdfiiOdfoYRrD5zK2gz1Oas',
            name: 'New Folder/',
            fakename: 'folder',
            size: 0,
          },
        ],
      ],
      expectedResult: [
        {
          name: 'New Folder',
          children: [],
          capacity: 0,
        },
      ],
    },
    {
      args: [[]],
      expectedResult: [],
    },
  ]
);
