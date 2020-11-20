const { remote, shell } = require("electron");
const app = remote.app;

const appVersion = "<b>App:</b> v" + app.getVersion();
const electronVersion = "<b>Electron:</b> v" + process.versions.electron;
const chromeVersion = "<b>Chrome:</b> v" + process.versions.chrome;
const nodeVersion = "<b>Node.js:</b> v" + process.versions.node;
const osVersion = "<b>OS:</b> " + process.env.OS + " v" + process.getSystemVersion();

document.getElementById("appVersion").innerHTML = appVersion;
document.getElementById("electronVersion").innerHTML = electronVersion;
document.getElementById("chromeVersion").innerHTML = chromeVersion;
document.getElementById("nodeVersion").innerHTML = nodeVersion;
document.getElementById("osVersion").innerHTML = osVersion;

document.getElementById("goToSourceCodeButton").addEventListener("click", function (params) {

    shell.openExternal("https://github.com/sam2127/CS372-AssignmentOrganizer");
});
