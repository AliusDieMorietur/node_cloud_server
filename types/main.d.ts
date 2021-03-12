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
  changes?: [string, string][], 
  user?: { login: string, password: string }
}

type CommandResults = {
  token?: string,
  fileList?: string[],
  structure?: Structure[]
}