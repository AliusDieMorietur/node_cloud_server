CREATE TABLE SystemUser (
  Id        serial,
  Token     varchar(64) NOT NULL,
  Login     varchar(16) NOT NULL,
  Password  varchar(16) NOT NULL
);

ALTER TABLE SystemUser ADD CONSTRAINT pkSystemUser PRIMARY KEY (Id);

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