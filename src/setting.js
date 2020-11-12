const { remote } = require("electron");
const dialog = remote.dialog;
const fs = require("fs");
const path = require("path");


const assignmentRootFolder = document.getElementById("assignmentRootFolder");
const changeRootFolderButton = document.getElementById("changeRootFolderButton");
const setDefaultRootFolderButton = document.getElementById("setDefaultRootFolderButton");

const settingsFile = path.join(__dirname, "./.config/settings.json");

// Number of settings are very few, so we can take a global object for settings.
// This will save us frequent read/write operations from/to settings file.
let settings;

/**
 * Initialize the elements on the page.
 * This function is called when DOM is ready i.e. page is loaded.
 */
function initializePage() {

    // Read settings for future operations.
    readSettings();

    // Initialize settings accordion/collapsible.
    let collapsible = document.querySelectorAll(".collapsible");
    M.Collapsible.init(collapsible, {});

    // Populate existing assignments list.
    loadSettings();
}

/**
 * Read settings from settings file.
 */
function readSettings() {
    try {
        // Read settings from settings file.
        settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
    } catch (error) {
        dialog.showErrorBox('Error!', "Error reading settings file.");
    }
}

/**
 * Assign setting values to appropriate elements on the page.
 */
function loadSettings() {
    // Set the value for assignmentRootFolder.
    assignmentRootFolder.value = settings.assignmentRootFolder;
}

/**
 * Resets the Assignment root directory to its default value.
 * Also, moves all the locally backed up assignments to the default root directory.
 */
function resetAssignmentDirectory() {

    let options, currentWindow, response, currentRootPath;

    // Store the current back-up directory path, to delete later.
    currentRootPath = assignmentRootFolder.value;

    // If current back-up directory is same as the default directory, then inform user and return.
    if (currentRootPath === settings.defaultAssignmentRootFolder) {
        return dialog.showErrorBox("Info", "Local back-up directory is already the default directory. Nothing to do.");
    }

    // Ask for confirmation before reset.
    options = {
        type: "question",
        buttons: ["No", "Yes"],
        defaultId: 0,
        message: "Are you sure you want to move existing assignments?",
        detail: "This will move your existing assignments to default back-up directory and delete it from current back-up directory. This can not be reversed later. Also, this operation can take time."
    };

    // Get the current window. 
    currentWindow = remote.getCurrentWindow();

    // Display the dialog box as the child of current window using the options above.
    response = dialog.showMessageBoxSync(currentWindow, options);

    // If user responded "Yes", then only change back-up directory to default.
    if (response === 1) {

        // Move assignments from old back-up directory to the default back-up directory.
        moveAssignments(currentRootPath, settings.defaultAssignmentRootFolder);

        // Set the value for assignmentRootFolder to its default value.
        assignmentRootFolder.value = settings.defaultAssignmentRootFolder;

        // Update settings.
        settings.assignmentRootFolder = settings.defaultAssignmentRootFolder;

        // Save settings.
        saveSettings();
    }
}

/**
 * Shows Open Directory dialog to the user and sets selected directory as assignments root.
 * dialog.showOpenDialog() is an async function, therefore this containing function must be an async function too.
 */
async function selectFolder() {

    let options, currentWindow, response, directorySelection, currentRootPath, newRootPath;

    // Ask for confirmation before change.
    options = {
        type: "question",
        buttons: ["No", "Yes"],
        defaultId: 0,
        message: "Are you sure you want to move existing assignments?",
        detail: "This will move your existing assignments to new back-up directory and delete it from current back-up directory. This can not be reversed later. Also, this operation can take time."
    };

    // Get the current window. 
    currentWindow = remote.getCurrentWindow();

    // Display the dialog box as the child of current window using the options above.
    response = dialog.showMessageBoxSync(currentWindow, options);

    // If user responded "Yes", then only change reset the value.
    if (response === 1) {

        // Show Open Directory dialog and wait for user response.
        directorySelection = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });

        // If user did not cancel the operation, then get the selected directory name.
        if (!directorySelection.canceled) {

            // Store the current back-up directory path, to delete later.
            currentRootPath = assignmentRootFolder.value;

            // Get the user selected back-up directory path.
            newRootPath = directorySelection.filePaths[0];

            // Move assignments from old back-up directory to the newly selected back-up directory.
            moveAssignments(currentRootPath, newRootPath);

            // Update the value of assignmentRootFolder.
            assignmentRootFolder.value = newRootPath;

            // Update settings.
            settings.assignmentRootFolder = newRootPath;

            // Save settings.
            saveSettings();
        }
    }
}

/**
 * Move all the assignments from a new directory structure and deletes current directory structure.
 * @param {String} currentRootPath Path to the current root directory
 * @param {String} newRootPath Path to the new root directory
 */
function moveAssignments(currentRootPath, newRootPath) {

    let assignmentsDataFile, fileName, newAssignmentDir, newFilePath;
    let existingAssignments, options, currentWindow;

    try {
        // Get the assignments data file name from settings.
        assignmentsDataFile = path.join(settings.configRootFolder, settings.assignmentsDataFile);

        // Read all existing assignments from assignments data file.
        existingAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile));

        existingAssignments.forEach(assignment => {

            fileName = path.basename(assignment.file);
            newAssignmentDir = path.join(newRootPath, assignment.year, assignment.season, assignment.courseCode);
            newFilePath = path.join(newAssignmentDir, fileName);

            try {
                // Create directory before uploading file.
                fs.mkdirSync(newAssignmentDir, { recursive: true });

                // Copy the assignment file to new back-up directory.
                fs.copyFileSync(assignment.file, newFilePath);

                // Delete the assignment file from old back-up directory.
                fs.unlinkSync(assignment.file);

                // Update file path for the assignment.
                assignment.file = newFilePath;

            } catch (error) {
                console.log("Error!", "Error while moving file: " + assignment.file);
            }
        });

        try {
            // Delete old assignment directory structure.
            fs.rmdirSync(currentRootPath, { recursive: true });
        } catch (error) {
            // dialog.showErrorBox("Error!", "Error deleting old assignment directory structure.");
            dialog.showErrorBox("Error!", error.message);
        }

        try {
            // Save updated assignment file paths to assignment data file.
            fs.writeFileSync(assignmentsDataFile, JSON.stringify(existingAssignments, null, 4));

            // Options for success message.
            options = {
                type: 'info',
                buttons: ['Ok'],
                message: "Success!",
                detail: "All assignments moved to new back-up directory successfully."
            };

            // Get the current window.
            currentWindow = remote.getCurrentWindow();

            // Show success message as a child of the current window.
            dialog.showMessageBoxSync(currentWindow, options);
        } catch (error) {
            dialog.showErrorBox("Error!", "Error while updating assignment records.")
        }
    } catch (error) {
        dialog.showErrorBox("Error!", "Error while moving assignments to new back-up directory.");
    }
}

/**
 * Save settings to settings file.
 */
function saveSettings() {

    try {
        // Write all the settings back to the settings file.
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));

        // Show a non-blocking success message.
        M.toast({ html: "Settings updated successfully." });

    } catch (error) {
        dialog.showErrorBox('Error!', "Error reading settings file.");
    }
}

// Initialize page when HTML DOM is fully loaded.
document.addEventListener("DOMContentLoaded", initializePage);

// Set event listeners for the elements on the page.
setDefaultRootFolderButton.addEventListener("click", resetAssignmentDirectory);

changeRootFolderButton.addEventListener('click', selectFolder);