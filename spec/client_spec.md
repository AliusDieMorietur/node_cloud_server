# Client query spec
* Here described which messages have to be send to work with storages and which result is expected

# Argument types
type Structure = {
  name: string, 
  childs?: Structure[],
  capacity: number
} 

type CommandArgs = {
  token?: string,
  storageName? : string,
  fileList?: string[],
  currentPath?: string, 
  filePath?: string,
  changes?: [ [string, string] ], 
  user?: { login: string, password: string }
}

type Session = {
  id: number,
  userid: number,
  ip: string,
  token: string
}

## Auth
* Auth user <code>Recieve: { callid: number, msg: 'authUser', args: { user: { login: string, password: string } } } Return: token: string</code> 

* Restore session <code>Recieve: { callid: number, msg: 'restoreSession', args: { token: string } } Return: session: Session</code> 

* Log out <code>Recieve: { callid: number, msg: 'logOut', args: {} } } Return: token: string</code> 

## Permanent Storage (log in required)
* On messages 'pmtUpload', 'rename', 'delete' server will automaticly send updated structure to all authed devices to one account. To recieve updated structure you have to handle socket.on('message') and check if strucure present in message 

* Upload files <code>Recieve: { callid: number, msg: 'pmtUpload', args: { currentPath: string, changes: [string, 'file' | 'folder'] } } Return: token: string (maybe removed in future to void)</code> Before sending this message all file buffes have to be send in order described in <code>changes</code> amount of buffers and file names have to be equal other ways server will not save changes and return error

* Download files <code>Recieve: { callid: number, msg: 'pmtDownload', args: { fileList: string[] } } Return: fileList: string[]</code> If names are correct server will send appropriate amount of buffers and then send array of file names

* Rename files/folders <code>Recieve: { callid: number, msg: 'rename', args: { currentPath: string, changes: [string, 'file' | 'folder'] } } Return: void</code> If names are correct server will rename appropriate files. One or multiple files/folders can be renamed by one command

* Delete files/folders <code>Recieve: { callid: number, msg: 'delete', args: { currentPath: string, changes: [original: string, renamed: string] } } Return: token: string (maybe removed in future to void)</code> If names are correct server will delete appropriate files. One or multiple files/folders can be deleted by one command

* Get current structure <code>Recieve: { callid: number, msg: 'getStorageStructure', args: {} } Return: structure: Structure[]</code> 

* Create link <code>Recieve: { callid: number, msg: 'createLink', args: { filePath: string } } Return: token: string</code> Returns token. Link have to be constructed in way http://localhost/links/{token}

## Temporary Storage
* Upload files <code>Recieve: { callid: number, msg: 'tmpUpload', args: { fileList: string[] } } Return: token: string</code> Before sending this message all file buffes have to be send in order described in <code>changes</code> amount of buffers and file names have to be equal other ways server will not save changes and return error

* Download files by token <code>Recieve: { callid: number, msg: 'tmpDownload', args: { token: string, fileList:string[]   } } Return: fileList: string[]</code> If names are correct server will send appropriate amount of buffers and then send array of file names

* Get available files by token <code>Recieve: { callid: number, msg: 'availableFiles', args: { token: string} } Return: fileList: string[]</code> 