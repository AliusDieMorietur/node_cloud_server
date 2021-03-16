# Specification
* Cloud storage to store personal files and share them between personal devices and other users. Can be hosted on local or global network

# Techological Stack
* Server - <code>Node.js</code>
* Web client(PWA) - <code>React</code> (maybe migration to Deno in future)
* Android Client - <code>Kotlin</code>
* IOS Client - <code>Dart(Flutter)</code>
* Monitoring tool - <code>Go</code> (may change in future)

# Goal
* Provide convenient and fast way to store | exchange | share files, permanently or temporary

# Scenarios
* Log in into system using personal login and password
* (Permanently) Select and upload | download | rename | delete files using control panel in permanent tab
* (Temporary) Select and upload files -> recieve download token -> enter token to input and get available file list -> download necessary files. Files available for 10 min (can be change in server config)
