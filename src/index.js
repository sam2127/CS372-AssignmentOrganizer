const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  let mainWindow = new BrowserWindow({
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

ipcMain.on("semester-clicked", () => {
  let semesterWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  semesterWindow.on("close", () => {
    semesterWindow = null;
  });

  semesterWindow.loadFile(path.join(__dirname, "semester.html"));
});

ipcMain.on("course-clicked", () => {
  let courseWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  courseWindow.on("close", () => {
    courseWindow = null;
  });

  courseWindow.loadFile(path.join(__dirname, "course.html"));
});

ipcMain.on("assignment-clicked", () => {
  let assignmentWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  assignmentWindow.on("close", () => {
    assignmentWindow = null;
  });

  assignmentWindow.loadFile(path.join(__dirname, "assignment.html"));
});
