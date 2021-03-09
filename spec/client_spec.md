# Client query spec
* Here described which messages have to be send to work with storages and which result is expected

# Argument types
* <code>type Structure = {
  name: string, 
  childs?: Structure[],
  capacity: number
} </code>

* <code>type CommandArgs = {
  token?: string,
  storageName? : string,
  fileList?: string[],
  currentPath?: string, 
  filePath?: string,
  changes?: [ [string, string] ], 
  user?: { login: string, password: string }
} </code>

* <code>type Session = {
  id: number,
  userid: number,
  ip: string,
  token: string
} </code>

## Auth
* Auth user <br/> Recieve: <code>{ callid: number, msg: 'authUser', args: { user: { login: string, password: string } } }</code> <br/>  Return: <code>token: string</code> 

* Restore session <br/> Recieve: <code>{ callid: number, msg: 'restoreSession', args: { token: string } }</code> <br/> Return: <code>session: Session</code> 

* Log out <br/> Recieve: <code>{ callid: number, msg: 'logOut', args: {} } }</code> <br/>  Return: <code>token: string</code> 

## Permanent Storage (log in required)
* On messages 'pmtUpload', 'rename', 'delete' server will automaticly send updated structure to all authed devices to one account. To recieve updated structure you have to handle socket.on('message') and check if strucure present in message 

* Upload files <br/> Recieve: <code>{ callid: number, msg: 'pmtUpload', args: { currentPath: string, changes: [string, 'file' | 'folder'] } }</code> <br/> Return: <code>token: string (maybe removed in future to void)</code> Before sending this message all file buffes have to be send in order described in <code>changes</code> amount of buffers and file names have to be equal other ways server will not save changes and return error

* Download files <br/> Recieve: <code>{ callid: number, msg: 'pmtDownload', args: { fileList: string[] } }</code> <br/> Return: <code>fileList: string[]</code> If names are correct server will send appropriate amount of buffers and then send array of file names

* Rename files/folders <br/> Recieve: <code>{ callid: number, msg: 'rename', args: { currentPath: string, changes: [string, 'file' | 'folder'] } }</code> <br/> Return: <code>void</code> If names are correct server will rename appropriate files. One or multiple files/folders can be renamed by one command

* Delete files/folders <br/> Recieve: <code>{ callid: number, msg: 'delete', args: { currentPath: string, changes: [original: string, renamed: string] } }</code> <br/> Return: <code>token: string (maybe removed in future to void)</code> If names are correct server will delete appropriate files. One or multiple files/folders can be deleted by one command

* Get current structure <br/> Recieve: <code>{ callid: number, msg: 'getStorageStructure', args: {} }</code> <br/> Return: <code>structure: Structure[]</code> 

* Create link <br/> Recieve: <code>{ callid: number, msg: 'createLink', args: { filePath: string } }</code> <br/> Return: <code>token: string</code> Returns token. Link have to be constructed in way http://localhost/links/{token}

## Temporary Storage
* Upload files <br/> Recieve: <code>{ callid: number, msg: 'tmpUpload', args: { fileList: string[] } }</code> <br/> Return: <code>token: string</code> Before sending this message all file buffes have to be send in order described in <code>changes</code> amount of buffers and file names have to be equal other ways server will not save changes and return error

* Download files by token <br/> Recieve: <code>{ callid: number, msg: 'tmpDownload', args: { token: string, fileList:string[]   } }</code> <br/> Return: <code>fileList: string[]</code> If names are correct server will send appropriate amount of buffers and then send array of file names

* Get available files by token <br/> Recieve: <code>{ callid: number, msg: 'availableFiles', args: { token: string} }</code> <br/> Return: <code>fileList: string[]</code> 
