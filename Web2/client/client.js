let wsUrl = "ws://" + location.hostname + ":" + location.port;
let ws = new WebSocket(wsUrl);

//Stors what column the table is sorted by
var currentSortKey = "filename";

ws.onerrer = function(e) {
  alert("WebSocket Error: " + e);
}

ws.onclose = function(e) {
  alert("WebSocket closed.");
}

//This code handles messages received from the server
ws.onmessage = function(m) {
  //Parse the message to a JSON object
  let response = JSON.parse(m.data);
  //Handle a response to attempting to access a directory outside of the root
  if(response.response=="denyAccess"){
    alert("You do not have permission to access that directory!");
  }
  //Set the browser div to the retreived directory JSON converted to an HTML table
  else{
  let browser = document.getElementById("browser");
  browser.innerHTML = dirInfo2Markup(response.info);
  }
  //Call the setDisplay method for all of the properties checkboxes, hiding all properties for the boxes that are unchecked
  let properties = document.getElementsByTagName("input");
  for(let i = 0; i < properties.length; ++i){
    setDisplay(properties[i]);
}
}

//This function handles the client requesting to return to the parent directory
function goBack() {
  //Get the index of the last / in the directory being displayed
  let lastSlash = document.getElementById("directory").innerText.lastIndexOf("/");
  //Format the string before the final splash to a JSON object to send to the server
  let request = "{\"request\":\"dirInfo\",\"dirpath\":\""+document.getElementById("directory").innerText.substring(0,lastSlash)+"\"}"
  console.log(request);
  ws.send(request);
}

//If the checkbox parameter is checked, display the corresponding column, otherwise, hide that column
function setDisplay(checkbox){
  //Get all of the properties that correspond to the checkbox parameter
  let properties = document.getElementsByTagName(checkbox.value);
  //If the checkbox is unchecked, hide all of the proeprties, otherwise, show all of the properties as table cells
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

//This function appends a name onto the current directory (a directory that the user clicks on) and formats it to a JSON object that is sent to the server
function send(destination) {
  let request = "{\"request\":\"dirInfo\",\"dirpath\":\""+document.getElementById("directory").innerText+"/"+destination+"\"}"
  ws.send(request);
}

//This function sorts the items in the directory by property that the user selects, and reverses the sorting if the directory is already sorted by that property
function sort(key){
  let table = document.getElementsByTagName("files")[0];
  let rows = document.getElementsByTagName("fileinfo");
  //Get all of the column headers, find the one the user selected, and set the background colour to blue, otherwise set the background colour to green
  let headings = rows[0].children;
  for(let i = 0; i<headings.length; i++){
    //Remove spaces from the heading and set it to lower case so that it ma
    if(headings[i].innerText.replace(" ","").toLowerCase()==key){
      headings[i].style.backgroundColor="blue";
    }
    else{
      headings[i].style.backgroundColor="green";
    }
  }
  //Add all of the items in thecolumn the user selected to an array
  let files = [];
  for(let i = 1; i < rows.length; ++i){
      files.push(rows[i].getElementsByTagName(key)[0]);
  }
  //Remove the second row of the table (the row after the headings) until the table only contains one row (the headings)
  while(rows.length>1){
    table.removeChild(table.childNodes[2]);
  }
  //If the user has selected the column that the table is already sorted by, reverse the order of the items in the files array
  if(key == currentSortKey){
    files.reverse();
  }
  //Otherwise, sort the items in the files array (the column the user selected) by their values and set the currentSortKey to the column the user selected
  else{
    files.sort(function(a,b){
      return a.innerText.localeCompare(b.innerText);
    });
    currentSortKey=key;
  }
  //Add the parent nodes (the table rows for items in the directory) of the items in the now sorted file array back to the table
  for(let i = 0; i < files.length; ++i){
    table.appendChild(files[i].parentNode);
  }
}

function
fileInfo2Markup(fileInfo) {
  if (!fileInfo) { return null; }

  let markup = "";
  //For directory items, add an onClick property to the fileInfo tab that calls the send function with the filename property parsed as a parameter
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
  //Create a row of headings and add it to the table
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
