const { Validator } = require(path.join(libPath, 'utils'));

const v = new Validator();

test(
  v.name,
  [
    {
      args: ["[DnB] - Tristam - Moonlight.mp3"]
    },
    {
      args: [
        "[Glitch Hop ⁄ 110BPM] - Pegboard Nerds & Tristam - Razor Sharp [Monstercat Release]"
      ],
      
    },
    {
      args: [
        "[Hardcore] - Stonebank - Stronger (feat. EMEL) [Monstercat Release]"
      ]
    },
    {
      args: ["«Король и Шут» - «Кукла Колдуна» HD"]
    },
    {
      args: ["6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx"]
    },
    {
      args: ["Folder or File name"]
    },
    {
      args: ["File (1).js"]
    },
    {
      args: ["1-kek.ts"]
    },
    {
      args: ["1_kek.rs"]
    },
    {
      args: ["Folder/1_kek.rs"]
    },
    {
      args: ["folder/folder/Folder/1_kek.rs"]
    },
    {
      args: [
        "6ELwoCSq9UPvo246Rp2b8JO7KSNCrAmx6ELwoCSq9UPvo246Rp2b8JO7KSNCrA",
      ]
    },
    {
      args: ["folder/folder//file"],
      shouldFail: true
    },
    {
      args: ["folder//folder/"],
      shouldFail: true
    },
    {
      args: ["folder////folder/"],
      shouldFail: true
    },
    {
      args: ["folder///////folder/"],
      shouldFail: true
    },
    {
      args: ["/"],
      shouldFail: true
    },
    {
      args: ["/folder/folder1/"],
      shouldFail: true
    },
    {
      args: ["/folder/file"],
      shouldFail: true
    },
    {
      args: [""],
      shouldFail: true
    },
    {
      args: [":/wq#@$"],
      shouldFail: true
    },
  ]
);