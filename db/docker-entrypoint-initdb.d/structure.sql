CREATE TABLE SystemUser (
  Id        serial,
  Token     varchar(64) NOT NULL,
  Login     varchar(16) NOT NULL,
  Password  varchar(16) NOT NULL
);

ALTER TABLE SystemUser ADD CONSTRAINT pkSystemUser PRIMARY KEY (Id);

CREATE UNIQUE INDEX akSystemUserToken ON SystemUser (Token);

CREATE UNIQUE INDEX akSystemUserLogin ON SystemUser (Login);

CREATE TABLE Session (
  Id      serial,
  UserId  integer NOT NULL,
  IP      varchar(45) NOT NULL,
  Token   varchar(64) NOT NULL
);

ALTER TABLE Session ADD CONSTRAINT pkSession PRIMARY KEY (Id);

CREATE UNIQUE INDEX akSession ON Session (Token);

ALTER TABLE Session ADD CONSTRAINT fkSessionUserId FOREIGN KEY (UserId) REFERENCES SystemUser (Id) ON DELETE CASCADE;

CREATE TABLE StorageInfo (
  Id         serial,
  Token      varchar(64) NOT NULL,
  Expire     bigint NOT NULL
);

CREATE UNIQUE INDEX akStorageInfo ON StorageInfo (Token);

CREATE TABLE FileInfo (
  Id        serial,
  Token     varchar(64) NOT NULL,
  Name      text NOT NULL,
  FakeName  text NOT NULL,
  size      integer NOT NULL
);

ALTER TABLE FileInfo ADD CONSTRAINT pkFileInfo PRIMARY KEY (Id);

ALTER TABLE FileInfo ADD CONSTRAINT fkFileInfoToken FOREIGN KEY (Token) REFERENCES StorageInfo (Token) ON DELETE CASCADE;

ALTER TABLE FileInfo ADD UNIQUE (Token, Name);

CREATE TABLE Link (
  Id      serial,
  FileId  integer NOT NULL,
  Token   varchar(64) NOT NULL,
  Link    text NOT NULL
);

ALTER TABLE Link ADD CONSTRAINT pkLink PRIMARY KEY (Id);

ALTER TABLE Link ADD CONSTRAINT fkLinkFileId FOREIGN KEY (FileId) REFERENCES FileInfo (Id) ON DELETE CASCADE;

CREATE UNIQUE INDEX akLink ON Link (Token);
