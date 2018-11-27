let maxMessages = 20;
let wsUrl = "ws://" + location.hostname + ":" + location.port;
let ws = new WebSocket(wsUrl);
var currentSortKey = "filename";

ws.onerrer = function(e) {
  alert("WebSocket Error: " + e);
}

ws.onclose = function(e) {
  alert("WebSocket closed.");
}

ws.onmessage = function(m) {
  let response = JSON.parse(m.data);
  if(response.response=="denyAccess"){
    alert("You do not have permission to access that directory!");
  }
  else{
  let browser = document.getElementById("browser");
  browser.innerHTML = dirInfo2Markup(response.info);
  }
  let properties = document.getElementsByTagName("input");
  for(let i = 0; i < properties.length; ++i){
    toggle(properties[i]);
}
}

function goBack() {
  let lastSlash = document.getElementById("directory").innerText.lastIndexOf("/");
  let request = "{\"request\":\"dirInfo\",\"dirpath\":\""+document.getElementById("directory").innerText.substring(0,lastSlash)+"\"}"
  console.log(request);
  ws.send(request);
}

function toggle(checkbox){
  let properties = document.getElementsByTagName(checkbox.value);
  if(!checkbox.checked){
    for(let i = 0; i < properties.length; ++i){
      properties[i].style.display="none";
    }
  }
  else{
    for(let i = 0; i < properties.length; ++i){
      properties[i].style.display="table-cell";
    }
  }

}

function send(destination) {
  let request = "{\"request\":\"dirInfo\",\"dirpath\":\""+document.getElementById("directory").innerText+"/"+destination+"\"}"
  ws.send(request);
}

function sort(key){
  let table = document.getElementsByTagName("files")[0];
  let rows = document.getElementsByTagName("fileinfo");
  let headings = rows[0].children;
  for(let i = 0; i<headings.length; i++){
    if(headings[i].innerText.replace(" ","").toLowerCase()==key){
      headings[i].style.backgroundColor="blue";
    }
    else{
      headings[i].style.backgroundColor="green";
    }

  }
  let files = [];
  let directories = [];

  for(let i = 1; i < rows.length; ++i){
      files.push(rows[i].getElementsByTagName(key)[0]);
  }
  while(rows.length>1){
    table.removeChild(table.childNodes[2]);
  }
  if(key == currentSortKey){
    files.reverse();
  }
  else{
    files.sort(function(a,b){
      return a.innerText.localeCompare(b.innerText);
    });
    currentSortKey=key;
  }

  for(let i = 0; i < files.length; ++i){
    table.appendChild(files[i].parentNode);
  }
}

function
fileInfo2Markup(fileInfo) {
  if (!fileInfo) { return null; }

  let markup = "";
  // leading spaces and "\n" for convenience only - not needed
  if(fileInfo["type"]=="directory"){
    markup += "\n    <fileinfo onClick=send(\""+fileInfo["filename"]+"\"); type=\"" + fileInfo["type"] + "\">\n";
  }
  else{
  markup += "\n    <fileinfo type=\"" + fileInfo["type"] + "\">\n";
}
  for (let i = 0; i < fileInfo_keys.length; ++i) {
    let k = fileInfo_keys[i];
    let v = fileInfo[k];
    let a = ""; // attributes for markup tag
    if (k.includes("time")) {
      // Keep the millisecond time as an attribute, but
      // use a user-friendly string to display in markup.
      // The millisecond time could be useful for ordering files.
      let t = new Date();
      t.setTime(v);
      a += " " + k + "=\"" + v + "\"";
      v = t.toLocaleString("en-GB");
    }
    markup += "      <" + k + a + ">" + v + "</" + k + ">\n";
  }
  markup += "    </fileinfo>\n";

  return markup;
}


function
dirInfo2Markup(dirInfo) {
  if (!dirInfo) { return null; }

  let markup = "";

  // leading spaces and "\n" for convenience only - not neededs

  markup += "\n  <dirinfo>\n\n";
  markup += "      <server>" + dirInfo["server"] + "</server>\n<br>\n";
  markup += "      <directoryname id=\"directory\">" + dirInfo["directoryname"] + "</directoryname>\n<hr>\n";

  let files = dirInfo["files"];
  let filenames = Object.keys(files);

  markup += "    <files>\n";
  markup += "      <fileinfo type=\"headings\">\n";
  markup += "        <filename class=heading onClick=\"sort('filename')\">File name</filename>\n";
  markup += "        <type class=heading onClick=\"sort('type')\">Type</type>\n";
  markup += "        <size class=heading onClick=\"sort('size')\">Size</size>\n";
  markup += "        <atime class=heading onClick=\"sort('atime')\">aTime</atime>\n";
  markup += "        <mtime class=heading onClick=\"sort('mtime')\">mTime</mtime>\n";
  markup += "        <ctime class=heading onClick=\"sort('ctime')\">cTime</ctime>\n";
  markup += "        <birthtime class=heading onClick=\"sort('birthtime')\">Birthtime</birthtime>\n";
  markup += "      </fileinfo>\n";
  for (let f = 0; f < filenames.length; ++f) {
    let fileInfo = files[filenames[f]];
    markup += fileInfo2Markup(fileInfo);
  }
  markup += "\n    </files>\n";

  markup += "\n  </dirinfo>\n";

  return markup;
}

const fileInfo_keys = [
  "filename", "type", "size",
  "atime", "mtime", "ctime", "birthtime"
];

const dirInfo_keys = [
  "server", "directoryname", "files"
];
