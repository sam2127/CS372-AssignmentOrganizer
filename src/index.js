const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
var mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "home.html"));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


//pens the pane in a modal window parent main window
ipcMain.on("openSecondWindow", (event, args) => {
    let secondWindow = new BrowserWindow({
        width: 790,
        height: 590,
        alwaysOnTop: false,
        frame: true,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
        },
    });
    secondWindow.loadFile(path.join(__dirname, args));
    secondWindow.on("close", () => {
        secondWindow = null;
    });


});