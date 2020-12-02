const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
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
        icon: path.join(__dirname, 'assets/icons/App.png'),
        title: app.getName(),
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // Create our custom menu for the app.
    let template = [{
            label: "File",
            submenu: [{
                role: 'quit',
                accelerator: "CmdOrCtrl+Q"
            }]
        },
        {
            label: "Go",
            submenu: [{
                    accelerator: "Alt+H",
                    label: "Home",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'home.html'));
                    }
                },
                {
                    type: "separator"
                },
                {
                    accelerator: "Alt+S",
                    label: "Semester",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'semester.html'));
                    }
                },
                {
                    accelerator: "Alt+C",
                    label: "Course",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'course.html'));
                    }
                },
                {
                    accelerator: "Alt+A",
                    label: "Assignment",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'assignment.html'));
                    }
                },
                {
                    type: "separator"
                },
                {
                    accelerator: "CmdOrCtrl+,",
                    label: "Settings",
                    click() {
                        mainWindow.loadFile(path.join(__dirname, 'setting.html'));
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [{
                    label: 'Documentation',
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

    // Load home.html in the window.
    mainWindow.loadFile(path.join(__dirname, 'home.html'));

    // Write initial settings, if they don't exist.
    initializeSettings();

    // New window event is fired when a new window is opened from the main window of the app.
    // We intercept the event,  prevent the default behaviour and open the link in external browser.
    mainWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
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

    // Joining the specified path segments into one path and storing that path in the settingsFile constant.
    const settingsFile = path.join(__dirname, '.config/settings.json');

    // Reading the data from settings.json synchronously using readFileSync() from fs module and parsing it as a JSON object into settings.
    let settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));

    // We will read assignments in this variable.
    let assignments;

    // If the path for configRootFolder doesn't exist in settings.json, then we write it.
    if (!settings.configRootFolder) {
        settings.configRootFolder = path.join(__dirname, './.config');
    }

    // If the default path of the root folder for assignments in settings.json, then we write a default path.
    if (!settings.defaultAssignmentRootFolder) {
        settings.defaultAssignmentRootFolder = path.join(__dirname, '../assignments');
    }

    // If the path of root folder for assignments doesn't exist in settings.json, then we write a default path.
    if (!settings.assignmentRootFolder) {
        settings.assignmentRootFolder = path.join(__dirname, '../assignments');
    } else {
        // If the root folder name exists, then check if there are any assignments in it or not.
        let assignmentFile = path.join(settings.configRootFolder, "assignments.json");

        // Read assignment data to check for number of assignments.
        assignments = JSON.parse(fs.readFileSync(assignmentFile, "utf-8"));

        // If the user has uploaded some assignments, then check for assignment root folder.
        if (assignments.length > 0) {

            // If root assignment folder does not exist, show error and quit the app.
            if (!fs.existsSync(settings.assignmentRootFolder)) {

                let errorHeading = "Fatal error: back-up directory not found";
                let errorMessage = "\"" + settings.assignmentRootFolder + "\" does not exist.\n\nIf it is on a removable drive, make sure you connect the removable drive before starting the app.\n\nApp will quit now.";

                dialog.showErrorBox(errorHeading, errorMessage);

                app.exit(0);
            }
        }
    }

    // If the name of semesters data file doesn't exist in settings.json, then we write the file name.
    if (!settings.semestersDataFile) {
        settings.semestersDataFile = 'semesters.json';
    }

    // If the name of courses data file doesn't exist in settings.json, then we write the file name.
    if (!settings.coursesDataFile) {
        settings.coursesDataFile = 'courses.json';
    }

    // If the name of assignments data file doesn't exist in settings.json, then we write the file name.
    if (!settings.assignmentsDataFile) {
        settings.assignmentsDataFile = 'assignments.json';
    }

    // Writing settings JSON object to settings.json
    // Save settings.
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
}