### Project spec

- Project structure is described here.

### ./

- server.js: Launch server.

### ./lib

- react_cloud_client_web: client submodule
- app.js: App Class is settled here. Used as storage for all useful system data.
- auth.js: Session Class is settled here. Works with db. Creates, deletes, restores sessions. Creates new users and gets old.
- channel.js: Channel Class is settled here. Created instance on each connection to websocket. Process messages and buffers from client.
- client.js: Client Class is settled here. Works with static. Sends file on links.
- commands.js: Commands which can be executed by Channel depending on message from client are settled here.
- db.js: Db Class is settled here. Used to interact with PostgreSQL.
- launcher.js: Launcher Class issettled here. Create workers and delete expired files.
- logger.js: Logger Class is settled here. Wrapper over node console, to provide better logs and their saving.
- server.js: Server Class is settled here. Create http/s server and ws/s server over it. Redirect static request to Client Class and redirects websocket messages to Channel Class.
- storage.js: Storage Class is settled here. Works with fs to upload, download and delete files. Creates structure from virtual absolute paths from db.
- utils.js: Useful functions which used in multiple places are settled here. Class Validator is settled here. Validates token, names, login, password. ServerErrors codes and messages are settled here.

### ./config

- server.js: Server config
- db.js: PostgreSQL config

### ./db

- data.sql: Test dataset.
- install.sql: Creates db and it`s owner.
- stucture.sql: Tables and relations are described here.

### ./logs (generates on build)

- log.txt: log file.

### ./scripts

- build.js: Build project.
- addUser.js: Add new user to db and directory for him in ./storage.

### ./static (generates on build)

- Production client build.

### ./storage (generates on build)

- Place where files of each user stored.

### ./tests

- test.js: Automated unit tests are based on tester.js.
- tester.js: Small framework to write tests.
