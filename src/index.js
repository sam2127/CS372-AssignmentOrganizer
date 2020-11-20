const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // Create our custom menu for the app.
    let template = [
        {
            label: "File",
            submenu: [
                {
                    label: "Exit",
                    click() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: "Go",
            submenu: [
                {
                    label: "Home",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'home.html'));
                    }
                },
                {
                    type: "separator"
                },
                {
                    label: "Semester",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'semester.html'));
                    }
                },
                {
                    label: "Course",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'course.html'));
                    }
                },
                {
                    label: "Assignment",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'assignment.html'));
                    }
                },
                {
                    label: "Settings",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'setting.html'));
                    }
                }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Reload",
                    accelerator: "CmdOrCtrl+R",
                    click(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.reload();
                    }
                },
                {
                    label: "Toggle Developer Tools",
                    accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
                    click(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.webContents.toggleDevTools();
                    }
                },
                {
                    type: "separator"
                },
                {
                    role: "togglefullscreen"
                }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Help',
                    click() {
                        mainWindow.loadFile(path.join(__dirname, "help.html"));
                    }
                },
                {
                    label: 'About',
                    click() {
                        // Load about.html in the newly created window.
                        mainWindow.loadFile(path.join(__dirname, "about.html"));
                    }
                }
            ]
        }
    ];

    let menu = Menu.buildFromTemplate(template);

    // Set our custom menu for app.
    Menu.setApplicationMenu(menu);

    // Maximize the window.
    mainWindow.maximize();

    // and load the home.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'home.html'));

    // Write initial settings, if they don't exist.
    initializeSettings();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function initializeSettings() {
    const settingsFile = path.join(__dirname, '.config/settings.json');
    let settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));

    if (!settings.configRootFolder) {
        settings.configRootFolder = path.join(__dirname, './.config');
    }

    if (!settings.defaultAssignmentRootFolder) {
        settings.defaultAssignmentRootFolder = path.join(__dirname, '../assignments');
    }

    if (!settings.assignmentRootFolder) {
        settings.assignmentRootFolder = path.join(__dirname, '../assignments');
    }

    if (!settings.semestersDataFile) {
        settings.semestersDataFile = 'semesters.json';
    }

    if (!settings.coursesDataFile) {
        settings.coursesDataFile = 'courses.json';
    }

    if (!settings.assignmentsDataFile) {
        settings.assignmentsDataFile = 'assignments.json';
    }

    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
}