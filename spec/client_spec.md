# Client query spec
* Here described which messages have to be send to work with storages and which result is expected

# Argument and return value types
* `type Structure = {
  name: string,
  childs?: Structure[],
  capacity: number
}`

* `type CommandArgs = {
  token?: string,
  fileList?: string[],
  storage: 'pmt' | 'tmp'
  name?: string,
  newName?: string,
  user?: { login: string, password: string }
}`

* `type Command = {
  callId: number,
  msg: string,
  args: CommandArgs
}`

# Errors

InvalidName = `{ code: 501, error: 'Invallid name' }`  
IncorrectLoginPassword = `{ code: 502, error: 'Username and/or password is incorrect' }`  
InvalidToken = `{ code: 503, error: 'Invalid token' }`  
NoSuchToken = `{ code: 504, error: 'No such token' }`  
SessionNotRestored = `{ code: 505, error: 'Session was not restored' }`  
EmptyFileList = `{ code: 506, error: 'File list is empty' }`  
NoSuchUser = ``{ code: 507, error: 'User doesn`t exist' }``  
NoSuchCommand = `{ code: 508, error: 'No such command as ' + command }`  
IncorrectMessageStructure = `{ code: 509, error: 'Wrong message structure, expecting { callId, msg, args }' }`  

## Auth
* Auth user  
Recieve: `{ callid: number, msg: 'authUser', args: { user: { login: string, password: string } } }`  
Return: `token: string`  
Errors: 
  * NoSuchUser - when user does not exist in system  
  * NoSuchToken - when token does not exist in system    
  * IncorrectLoginPassword - when either login or password are invalid

  Returns session's token

* Restore session  
Recieve: `{ callid: number, msg: 'restoreSession', args: { token: string } }`  
Return: `token: string`  
Errors:  
  * InvalidToken - when token is invalid  

  Returns restored session's token 

* Log out  
Recieve: `{ callid: number, msg: 'logOut', args: {} } }`  
Return: `void`  
Errors:  
  * no errors

  Closes current session.

## Permanent Storage  (expecting logged in user)
* On messages `'upload'` with `storage = 'pmt'`, 'rename', 'delete', 'newFolder' after they finish server will return `structure: Structure` to all devices authed with one account.

* Upload files  
Recieve: `{ callid: number, msg: 'upload', args: { fileList: string[], storage: 'pmt' } }`  
Return: `void`  
Errors:  
  * InvalidName - when some name in fileList is invalid  
  * EmptyFileList - when fileList was empty

  After this message is sent, server will save next `fileList.length` buffers with names from fileList. Meaning first buffer will be saved with first name in fileList, second buffer will be saved with second name in fileList, etc... If file already exists it will be overwritten. After last buffer was recieved, server will return `structure: Structure` to all devices authed with one account to keep them updated. In case of failure when saving buffer, an error shown on server side.

* Download files  
Recieve: `{ callid: number, msg: 'download', args: { fileList: string[] } }`  
Return: `void`  
Errors:  
  * InvalidName - when some name in fileList is invalid  
  * EmptyFileList - when fileList was empty

  If names are valid and refer to existing files server will send their buffers in order of names in fileList  

* Create new folder  
Recieve: `{ callid: number, msg: 'newFolder', args: { name: string }`  
Return: `void`  
Errors:  
  * InvalidName - when name is invalid  
  * InvalidToken - when token is invalid  
  * NoSuchToken - when token does not exist in system  

  If name is valid server will create new folder  

* Rename files/folders  
Recieve: `{ callid: number, msg: 'rename', args: { name: string, newName: string } }`  
Return: `void`  
Errors:  
  * InvalidName - when name or newName is invalid  

  If names are valid the server will rename appropriate files. 

* Delete files/folders  
Recieve: `{ callid: number, msg: 'delete', args: { fileList: string[] } }`  
Return: `void`  
Errors:  
  * InvalidName - when name is invalid  
  * EmptyFileList - when fileList was empty

  If names are valid server will delete appropriate files. One or multiple files/folders can be deleted by one command

* Get current structure  
Recieve: `{ callid: number, msg: 'availableFiles', args: {} }`  
Return: `structure: Structure[]`  
Returns list of children (files and folders) in root folder of storage

* Create link  
Recieve: `{ callid: number, msg: 'createLink', args: { name: string } }`  
Return: `token: string`  
Errors:  
  * InvalidName - when name is invalid  

  From returned token you form http://localhost/links/{token} as link to the file/folder

## Temporary Storage

* Upload files  
Recieve: `{ callid: number, msg: 'upload', args: { fileList: string[], storage: 'tmp' } }`  
Return: `token: string`  
Errors:  
  * InvalidName - when some name in fileList is invalid  
  * EmptyFileList - when fileList was empty

  After this message is sent, server will save next `fileList.length` buffers with names from fileList. Meaning first buffer will be saved with first name in fileList, second buffer will be saved with second name in fileList, etc... In case of failure when saving buffer, an error shown on server side.

* Download files  
Recieve: `{ callid: number, msg: 'download', args: { token: string, fileList: string[] } }`  
Return: `void`  
Errors:
  * InvalidName - when some name in fileList is invalid  
  * InvalidToken - when token is invalid  
  * NoSuchToken - when token does not exist in system  
  * EmptyFileList - when fileList was empty

  If names are valid and refer to existing files server will send their buffers in order of names in fileList  

* Get available files  
Recieve: `{ callid: number, msg: 'availableFiles', args: { token: string } }`  
Return: `fileList: string[]`  
Errors:
  * InvalidToken - when token is invalid  
  * NoSuchToken - when token does not exist in system  
