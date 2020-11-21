const { remote, shell } = require("electron");
const app = remote.app;

const appVersion = app.getVersion();
const electronVersion = process.versions.electron;
const chromeVersion = process.versions.chrome;
const nodeVersion = process.versions.node;

let osVersion;

if (process.platform === "win32" || process.platform === "win64")
    osVersion = "Windows " + process.getSystemVersion();
else if (process.platform === "linux")
    osVersion = "Linux " + process.getSystemVersion();
else if (process.platform === "darwin")
    osVersion = "MacOS " + process.getSystemVersion();

document.getElementById("appVersion").innerHTML = appVersion;
document.getElementById("electronVersion").innerHTML = electronVersion;
document.getElementById("chromeVersion").innerHTML = chromeVersion;
document.getElementById("nodeVersion").innerHTML = nodeVersion;
document.getElementById("osVersion").innerHTML = osVersion;

document.getElementById("goToSourceCodeButton").addEventListener("click", function (params) {

    shell.openExternal("https://github.com/sam2127/CS372-AssignmentOrganizer");
});
