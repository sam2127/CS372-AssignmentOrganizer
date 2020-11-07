const remote = require("electron").remote;
const dialog = remote.dialog;
const { shell } = require("electron");
const fs = require("fs");
const path = require("path");

const courseSelection = document.getElementById("courseSelection");
const assignmentName = document.getElementById("assignmentName");
const selectFileButton = document.getElementById("selectFileButton");
const fileNameText = document.getElementById("fileNameText");
const uploadToCloud = document.getElementById('uploadToCloud');
const assignmentList = document.getElementById("assignmentList");

const settingsFile = path.join(__dirname, "./.config/settings.json");

let assignmentRootFolder;
let courseDataFile;
let assignmentsDataFile;
let sourceFile = "";

function initializePage() {
    // Initialize input character counter for assignmentName text box.
    const assignmentNameCountInstance = new M.CharacterCounter(assignmentName);

    // Read settings for future file operations.
    readSettings();

    // Populate course search and selection.
    populateCourseSearch();

    // Populate existing assignments list.
    listExistingAssignments();
}

function readSettings() {
    try {
        let settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));

        // Get the value of assignmentRootFolder from settings.
        assignmentRootFolder = settings.assignmentRootFolder;
        courseDataFile = path.join(settings.configRootFolder, settings.coursesDataFile);
        assignmentsDataFile = path.join(settings.configRootFolder, settings.assignmentsDataFile);

    } catch (error) {
        dialog.showErrorBox('Error!', "Error reading settings file.");
    }
}

function populateCourseSearch() {

    let allCourses, myCourses = {};
    let label, search;

    try {
        allCourses = JSON.parse(fs.readFileSync(courseDataFile, 'utf-8'));

        if (allCourses.length > 0) {

            // Let the user know the number of courses available to search from.
            courseSelection.setAttribute("placeholder", "Type to search - " + allCourses.length + " course(s) available");

            allCourses.forEach((course) => {
                label = course.courseCode + " ==> " + course.courseName + " (" + course.season + " " + course.year + ")";

                // We just need label for searching. Icon URL is set to null for all courses.
                myCourses[label] = null;
            });
        } else {
            // Let the user know the number of courses available to search from.
            courseSelection.setAttribute("placeholder", "No course found - First add a course");
            label = "NA - No course found. Add one.";

            // We just need label for searching. Icon URL is set to null for all courses.
            myCourses[label] = null;
        }

        // Initialize courses search and select.
        search = document.querySelectorAll('.autocomplete');
        M.Autocomplete.init(search, { data: myCourses });
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing courses could not be populated.');
        else
            dialog.showErrorBox('Error!', "An unknown error occurred while loading courses.");
    }
}

function listExistingAssignments() {

    let existingAssignments;
    let htmlString = "";
    let prevYear = 9999;
    let isTableOpen = false;

    try {
        existingAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile, "utf-8"));

        htmlString = "";

        if (existingAssignments.length > 0) {

            htmlString = "<ul class='collapsible popout'>";

            existingAssignments.forEach(assignment => {
                if (assignment.year !== prevYear) {
                    if (isTableOpen) {
                        // Close table, body div and li element for previous year.
                        htmlString += "</tbody>";
                        htmlString += "</table>";
                        htmlString += "</div>";
                        htmlString += "</li>";

                        isTableOpen = false;
                    }

                    prevYear = assignment.year;

                    htmlString += "<li>";
                    htmlString += "<div class='teal collapsible-header'>";
                    htmlString += assignment.year;
                    htmlString += "</div>";
                    htmlString += "<div class='collapsible-body'>";
                    htmlString += "<table class='centered highlight'>";
                    htmlString += "<thead><tr><th>Semester</th>";
                    htmlString += "<th>Course Code</th>";
                    htmlString += "<th>Name</th>";
                    htmlString += "<th>Cloud Back-up?</th>";
                    htmlString += "<th>Actions</th>";
                    htmlString += "</tr></thead>";
                    htmlString += "<tbody>";
                }

                // One row for each assignment.
                htmlString += "<tr>";
                htmlString += "<td>" + assignment.season + " " + assignment.year + "</td>";
                htmlString += "<td>" + assignment.courseCode + "</td>";
                htmlString += "<td>" + assignment.name + "</td>";
                htmlString += "<td>" + assignment.cloudBackup + "</td>";
                htmlString += "<td>" + "<button class='waves-effect waves-light btn tooltipped' data-position='top' data-tooltip='Open' onclick='openAssignment(" + assignment.id + ")'><i class='material-icons'>launch</i></button>";

                // Add 'Download' action if the assignment has a cloud back-up.
                if (assignment.cloudBackup === "Yes") {
                    htmlString += "&nbsp;<button class='waves-effect waves-light btn tooltipped' data-position='top' data-tooltip='Download' onclick='downloadAssignment(\"" + assignment.cloudFileURL + "\")'><i class='material-icons'>cloud_download</i></button>";
                }

                // Add 'Delete' button.
                htmlString += "&nbsp;<button class='waves-effect waves-light btn tooltipped' data-position='top' data-tooltip='Delete' onclick='deleteAssignment(" + assignment.id + ")'><i class='material-icons'>delete</i></button>" + "</td>";
                htmlString += "</tr>";

                isTableOpen = true;
            });

            // Close table, body div and li element for the last year.
            htmlString += "</tbody>";
            htmlString += "</table>";
            htmlString += "</div>";
            htmlString += "</li>";

            // Close collapsible/accordion.
            htmlString += "</ul>";

        } else {
            // When there is no assignment.
            htmlString = "<i class='far fa-frown fa-4x'></i>";
            htmlString += "<div class='flow-text'>&nbsp;Nothing to show here.</div>";
            htmlString += "<div class='flow-text'>Add an assignment from above.</div>";
        }

        assignmentList.innerHTML = htmlString;

        // Initialize tooltips for all assignment action buttons.
        let actionButtons = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(actionButtons, {});

        // Refresh assignments list by initializing accordion element.
        let collapsible = document.querySelectorAll(".collapsible");
        M.Collapsible.init(collapsible, {});

    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing assignments could not be read.');
        else
            dialog.showErrorBox('Error!', "An unknown error occurred while reading assignments data file.");
    }
}

function findCourse(courseCode) {
    let myCourse = "";

    try {
        let allCourses = JSON.parse(fs.readFileSync(courseDataFile, "utf-8"));
        myCourse = allCourses.find((course) => course.courseCode === courseCode);
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing courses could not be read.');
        else
            dialog.showErrorBox('Error!', "An unknown error occurred while reading course data file.");
    }

    return myCourse;
}

/**
 * Locally back-up the assignment and upload it to cloud afterwards.
 */
function uploadFile() {

    let selectedCourse, selectedCourseCode, course, assignmentDir, destinationPath;
    let cloudBackup, cloudFileURL;
    let existingAssignments, newAssignment, previousMaxId;
    let options, currentWindow;

    if (sourceFile === "") {
        return dialog.showErrorBox("Error!", "No file selected for upload.");
    }
    else {

        // TODO: Validate course selection and assignment name.
        selectedCourse = courseSelection.value;
        selectedCourseCode = selectedCourse.substring(0, selectedCourse.indexOf("==>") - 1);
        course = findCourse(selectedCourseCode);

        // Define the directory path where the assignment will be uploaded.
        assignmentDir = path.join(
            assignmentRootFolder,
            course.year,
            course.season,
            course.courseCode
        );

        try {
            // Create directory before uploading file.
            fs.mkdirSync(assignmentDir, { recursive: true });

            // Set assignment file's path.
            destinationPath = path.join(assignmentDir, path.basename(sourceFile));

            try {
                // Upload/Copy file.
                fs.copyFileSync(sourceFile, destinationPath);

                // By default, set cloud back-up option as 'No'.
                cloudBackup = "No";
                cloudFileURL = "NA";

                // Set cloud back-up option based on user selection.
                if (uploadToCloud.checked) {
                    cloudBackup = "Yes";

                    // TODO : Upload to cloud.
                    cloudFileURL = "To be implemented"
                } else {
                    cloudBackup = "No";
                }

                try {
                    // Read all existing assignments into memory.
                    existingAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile));

                    // Find the ID of the previous assignment.
                    previousMaxId = 0;

                    if (existingAssignments.length > 0) {
                        // When the existing assignments array is not empty, find max ID.
                        previousAssignment = existingAssignments.reduce(function (current, next) {
                            return (current.id > next.id) ? current : next;
                        });

                        previousMaxId = previousAssignment.id;
                    }

                    newAssignment = {
                        id: previousMaxId + 1,
                        courseId: course.id,
                        semesterId: course.semesterId,
                        name: assignmentName.value,
                        file: destinationPath,
                        courseName: course.courseName,
                        courseCode: course.courseCode,
                        year: course.year,
                        season: course.season,
                        month: course.month,
                        cloudBackup: cloudBackup,
                        cloudFileURL: cloudFileURL
                    };

                    // Add new assignment to existing assignments.
                    existingAssignments.push(newAssignment);

                    // Sort based on year, most recent first.
                    existingAssignments.sort(function (current, next) {
                        return next.year - current.year;
                    });

                    // Once sorted by year, sort based on month per year.
                    existingAssignments.sort(function (current, next) {
                        if (current.year === next.year) {
                            return parseInt(current.month) - parseInt(next.month);
                        } else {
                            return current;
                        }
                    });

                    try {
                        fs.writeFileSync(assignmentsDataFile, JSON.stringify(existingAssignments, null, 4));

                        // Clear add assignment form.
                        courseSelection.value = "";
                        assignmentName.value = "";
                        fileNameText.value = "";
                        uploadToCloud.checked = false;

                        // Also, clear the sourcefile value.
                        sourceFile = "";

                        options = {
                            type: 'info',
                            buttons: ['Ok'],
                            message: "Success!",
                            detail: "Assignment uploaded successfully."
                        };

                        currentWindow = remote.getCurrentWindow();
                        dialog.showMessageBoxSync(currentWindow, options);

                    } catch (error) {
                        dialog.showErrorBox("Error", "Could not write assignment data.");
                    }
                } catch (error) {
                    dialog.showErrorBox("Error", "Could not read assignment data.");
                }
            } catch (error) {
                dialog.showErrorBox("Error", "File upload failed: " + path.basename(sourceFile));
            }
        } catch (error) {
            dialog.showErrorBox("Error", "Error creating directory for the upload.");
        }
    }

    // Reload the updated assignment list.
    listExistingAssignments();
}

function openAssignment(assignmentId) {
    try {
        // Read existing assignments.
        let existingAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile, "utf-8"));

        // Get the index of the assignment having assignment Id to open.
        let index = existingAssignments.findIndex(function (assignment) {
            return assignment.id === assignmentId;
        });

        let assignmentToBeOpened = existingAssignments[index];

        shell.openExternal(path.join("file://", assignmentToBeOpened.file));
    } catch (error) {
        dialog.showErrorBox("Error", error.message);
    }
}

function deleteAssignment(assignmentId) {

    let localDeleted = cloudDeleted = fileDeleteSuccess = recordDeleted = false;
    let options, currentWindow, response;

    // Ask for confirmation before delete.
    options = {
        type: "question",
        buttons: ["No", "Yes"],
        defaultId: 0,
        message: "Are you sure?",
        detail: "This will delete both your local and cloud back-up."
    };

    //Fetches the current window. 
    currentWindow = remote.getCurrentWindow();

    // Displaying the dialog box as the child of current window using the options above.
    response = dialog.showMessageBoxSync(currentWindow, options);

    // If user responded "Yes", then only delete the course.
    if (response === 1) {

        /*
            1. Delete local and cloud files. Record file deletion success.
            2. Delete assignment record from assignments.json only upon success of step 1.
            3. Show success message only upon successfully record deletion from step 2.
        */
        try {
            // Read existing assignments.
            let existingAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile, "utf-8"));

            // Get the index of the assignment having assignment Id to delete.
            let index = existingAssignments.findIndex(function (assignment) {
                return assignment.id === assignmentId;
            });

            let assignmentToBeDeleted = existingAssignments[index];

            // Delete local back-up file.
            try {
                // If the file exists, then delete it.
                // If the file doesn't exist, then we consider delete operation successful.
                if (fs.existsSync(assignmentToBeDeleted.file)) {
                    fs.unlinkSync(assignmentToBeDeleted.file);
                }
                // Record delete operation success.
                localDeleted = true;

                // Delete the directory as well, but only if it is empty.
                removeEmptyAssignmentDir(path.dirname(assignmentToBeDeleted.file));

            } catch (error) {
                dialog.showErrorBox("Error", "Error deleting local back-up file.");
            }

            // Delete cloud back-up file.
            if (assignmentToBeDeleted.cloudBackup === "Yes") {
                try {
                    // TODO : Delete cloud file.

                    cloudDeleted = true;
                } catch (error) {
                    dialog.showErrorBox("Error", "Error deleting cloud back-up file.");
                }

                // Record success after deletion of both local and cloud back-up.
                if (localDeleted && cloudDeleted)
                    fileDeleteSuccess = true;
            } else {
                // Record success for only local back-up deletion.
                if (localDeleted)
                    fileDeleteSuccess = true;
            }

            // Delete entry from assignment data file only if local and/or cloud back-up was deleted successfully.
            if (fileDeleteSuccess) {
                try {
                    // Delete from existing assignments array in RAM.
                    existingAssignments.splice(index, 1);

                    // Write updated array to assignment data file.
                    fs.writeFileSync(assignmentsDataFile, JSON.stringify(existingAssignments, null, 4));

                    // Record success.
                    recordDeleted = true;
                } catch (error) {
                    dialog.showErrorBox("Error", "Error deleting selected assignment's record from data file.");
                }
            }

            // If all went well, then refresh assignments list and show success message.
            if (recordDeleted) {

                // Refresh assignments list.
                listExistingAssignments();

                // Show success message.
                let options = {
                    type: 'info',
                    buttons: ['Ok'],
                    message: "Success!",
                    detail: "Assignment deleted successfully."
                };

                let currentWindow = remote.getCurrentWindow();
                dialog.showMessageBoxSync(currentWindow, options);
            } else {
                dialog.showErrorBox("Error", "Error deleting selected assignment.");
            }
        } catch (error) {
            dialog.showErrorBox("Error", "Unknown error deleting selected assignment.");
        }
    }
}

function shouldAllowCloudUploadOrNot() {
    let uploadToCloudSelected = uploadToCloud.checked;

    if (uploadToCloudSelected) {
        // Check online status.
        let isOnline = window.navigator.onLine;

        if (!isOnline) {
            uploadToCloud.checked = false;
            M.toast({ html: 'You must be online in order to upload to cloud.' })
        }
    }
}

function downloadAssignment(cloudFileURL) {

    // TODO: Download assignment file from cloud.
    alert(cloudFileURL);
}

/**
 * Shows Open File dialog with appropriate file filters
 * so that user can select an assignment to upload.
 * dialog.showOpenDialog() is an async function
 * therefore this function must be an async function.
 */
async function selectFile() {

    let options = {
        filters: [
            { name: 'All Allowed Files', extensions: ['txt', 'doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z'] },
            { name: 'Documents', extensions: ['txt', 'doc', 'docx', 'pdf'] },
            { name: 'Spreadsheets', extensions: ['xls', 'xlsx'] },
            { name: 'Presentations', extensions: ['ppt', 'pptx'] },
            { name: 'Archives', extensions: ['zip', 'rar', '7z'] }
        ],
        properties: ['openFile']
    };

    let response = await dialog.showOpenDialog(options);

    if (!response.canceled) {
        sourceFile = response.filePaths[0];
        fileNameText.value = path.basename(sourceFile);
    }
    else
        fileNameText.setAttribute("placeholder", "Select a file");
}

/**
 * Remove empty assignment directory in reverse order, recursively.
 * @param {String} directory Path to directory to be deleted
 */
function removeEmptyAssignmentDir(directory) {

    let parentDir;

    // Do not delete assignmentRootFolder, even if it's empty.
    if (directory === assignmentRootFolder) {
        return;
    }

    try {
        // Check if the directory is empty or not.
        if (fs.readdirSync(directory).length === 0) {

            // Store parent directory path.
            parentDir = path.dirname(directory);

            // Remove the empty directory.
            fs.rmdirSync(directory);

            // Remove parent directory if it's empty.
            removeEmptyAssignmentDir(parentDir);
        }
    } catch (error) {
        dialog.showErrorBox("Error!", "Error while deleting empty assignment directory " + directory);
    }
}

// Add event listeners to elements on the page.
selectFileButton.addEventListener("click", selectFile);
uploadToCloud.addEventListener('click', shouldAllowCloudUploadOrNot);
document.getElementById("uploadFileButton").addEventListener("click", uploadFile);
document.addEventListener('DOMContentLoaded', initializePage);
