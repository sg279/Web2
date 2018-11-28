/*

 simple message server using WebSockets
 Saleem Bhatti, October 2018

 */

// https://nodejs.org/docs/latest-v8.x/api/fs.html
let fs = require("fs");
// https://nodejs.org/docs/latest-v8.x/api/http.html
let http = require("http");
// https://nodejs.org/docs/latest-v8.x/api/os.html
let os = require("os");
// https://nodejs.org/docs/latest-v8.x/api/process.html
let process = require("process");
// https://www.npmjs.com/package/ws
let ws = require("ws"); // npm install ws
let url = require("url");
let path = require("path");
const root = "/test1Dir";
let dlj = require("./dir_list_json.js");

let G_port = process.getuid(); /** type "id" on Linux for uid value **/
if (G_port < 1024) G_port += 10000; // do not use privileged ports

function serveApp(request, response) {
  let filename = url.parse(request.url)["pathname"];

  // https://nodejs.org/api/net.html#net_class_net_socket
  if (filename == "/") { // logical root
    filename = __dirname+"/client/index.html";
  }
  else if (filename[0] == '/') {
    // do not need the leading "/"
    filename = __dirname+"/client/"+filename.substring(1);
  }

  console.log(" -> rx "
              + request.socket.remoteAddress
              + ":"
              + request.socket.remotePort
              + " " + filename);
  // read file
  fs.readFile(filename, (error, file) => {

    let code;
    let type;
    let content;

    if (error) {
      code = 404;
      type = "text/plain";
      content = "Sorry ... could not find the file: " + filename;
      console.log(" -> rx " +
      request.socket.remoteAddress
      + ":"
      + request.socket.remotePort
      + " unknown file: " + filename);
    }
    else {
      code = 200;
      type = G_file_types[path.extname(filename)];
      content = file;
    }

    response.writeHead(code, type);
    response.write(content);
    response.end();
  });
}

let httpServer = http.createServer(serveApp).listen(G_port, os.hostname());
let wsServer = new ws.Server({server: httpServer});

const G_file_types = {
  "css" : "text/css",
  "gif" : "image/gif",
  "html" : "text/html",
  "ico" : "image/x-icon",
  "jpg" : "image/jpeg"
};

wsServer.on("connection", function(ws) {

  //When a websocket connection is made, send the root directory to the client as a JSON object
  let startDir = __dirname+root;
  let dirInfo = dlj.getDirInfo(startDir, displayDir);
  function displayDir(error, dirInfo) {
  let m = dirInfo;
  ws.send("{\"response\":\"dirinfo\",\"info\":"+JSON.stringify(m)+"}")};


  console.log("-- connection: " + wsList.length);

  ws.on("close", function(code, message) {
    console.log("-- disconnected: " + (i + 1));
  });

//This code handles messages received by the server
  ws.on("message", function(data) {
    //Write the received message to the console (for debugging)
    console.log(data);
    //Parse the message to a JSON object
    let request = JSON.parse(data);
    //If the requested path is located in the root folder do the following
    if(request.dirpath.startsWith(root)){
      //Add the requested path to the directory's location
      let startDir = __dirname+request.dirpath;
      //Get the info for the requested directory, parse it to a json object, and set it to the client
      let dirInfo = dlj.getDirInfo(startDir, displayDir);
      function displayDir(error, dirInfo) {
        let m = dirInfo;
        ws.send("{\"response\":\"dirinfo\",\"info\":"+JSON.stringify(m)+"}");
      }
    }
    //If the directory the client requested is outside of the root send an access denied message
    else{
      ws.send("{\"response\":\"denyAccess\"}");
    }

  });

});

console.log("-- server is running: " + os.hostname() + ":" + G_port);
