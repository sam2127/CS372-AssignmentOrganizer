// Using remote module to do inter-process communication (IPC) between the renderer process (web page) and the main process.
const remote = require("electron").remote;
// Display native system dialogs for opening and saving files, alerting, etc.
const dialog = remote.dialog;
// Node.js file system module allows to read/write the files on computer system.
const fs = require("fs");
// Node.js path module allows joining the specified path segments into one path.
const path = require("path");

// Accessing the different HTML elements semester.html by their unique id's.
const seasonSelection = document.getElementById("seasonSelection");
const yearText = document.getElementById("year");
const addSemesterButton = document.getElementById("addSemesterButton");
const editSemesterId = document.getElementById("editSemesterId");
const editSeasonSelection = document.getElementById("editSeasonSelection");
const editYear = document.getElementById("editYear");
const updateSemesterButton = document.getElementById("updateSemesterButton");
const cancelUpdateSemesterButton = document.getElementById("cancelUpdateSemesterButton");
const allSemestersList = document.getElementById("allSemestersList");

// Storing the path of settings.json file in the javascript object named settingsFile.
const settingsFile = path.join(__dirname, "./.config/settings.json");

// Determine the current year for later use.
const currentYear = new Date().getFullYear();

// Minimum year value to be allowed.
const minimumYear = 2000;

let semestersDataFile;
let coursesDataFile;
let assignmentsDataFile;

function initializePage() {
    // Initialize Materialize CSS based <select> dropdown.
    M.FormSelect.init(seasonSelection, {});

    // Initialize input character counter for Year text box.
    const yearTextCountInstance = new M.CharacterCounter(yearText);

    // Read settings for future file operations.
    readSettings();

    // Populate existing semester list.
    listExistingSemesters();

    // Set placeholder texts for add and edit year text boxes.
    let placeholderText = "A valid year is between " + minimumYear + " and " + currentYear;
    yearText.setAttribute("placeholder", placeholderText);
    editYear.setAttribute("placeholder", placeholderText);
}

function readSettings() {
    try {
        // Reading the data from settings.json synchronously using function readFileSync() in fs module and parsing as a JSON object.
        let settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));

        // Joining the specified path segments for semesters.json file using the data stored in settings.json and storing the path.
        semestersDataFile = path.join(settings.configRootFolder, settings.semestersDataFile);

        // Joining the specified path segments for courses.json file using the data stored in settings.json and storing the path.
        coursesDataFile = path.join(settings.configRootFolder, settings.coursesDataFile);

        // Joining the specified path segments for assignments.json file using the data stored in settings.json and storing the path.
        assignmentsDataFile = path.join(settings.configRootFolder, settings.assignmentsDataFile);
    } catch (error) {
        dialog.showErrorBox("Error!", "Error reading settings file.");
    }
}

function listExistingSemesters() {
    try {
        // Reading the existing semesters from semesters.json into existingSemester object.
        let existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, "utf-8"));

        let htmlString = "";
        let prevYear = 9999;
        let isTableOpen = false;

        // Check for any existing semesters.
        if (existingSemesters.length > 0) {
            // Assigning html elements to a string variable for displaying existing semesters.
            htmlString = "<ul class='collapsible popout'>";

            // This loop is used to keep a track of different html elements needed for displaying each existing semester in the tabular form. 
            existingSemesters.forEach((semester) => {
                // Check whether or not to initialize html elements for displaying an existing semester if it exists.
                if (semester.year !== prevYear) {
                    // Check to close the table after all the existing semesters have been displayed. 
                    if (isTableOpen) {
                        // Close table, body div and li element for previous year.
                        htmlString += "</tbody>";
                        htmlString += "</table>";
                        htmlString += "</div>";
                        htmlString += "</li>";

                        isTableOpen = false;
                    }
                    
                    // Assigning current year value to the prev year
                    prevYear = semester.year;

                    // Assigning html elements to a string variable for displaying existing semesters.
                    htmlString += "<li>";
                    htmlString += "<div class='teal collapsible-header'>";
                    htmlString += semester.year;
                    htmlString += "</div>";
                    htmlString += "<div class='collapsible-body'>";
                    htmlString += "<table class='centered striped'>";
                    // Creating a table header row.
                    htmlString += "<thead><tr><th>Semester</th>";
                    htmlString += "<th>Courses</th>";
                    htmlString += "<th>Actions</th>";
                    htmlString += "</thead>";
                    htmlString += "<tbody>";
                }

                // Storing the course count for a particular semester to display in the table of added/existing semesters.
                let courseCount = getCourseCountForSemester(semester.id);

                // Creating a first row for the table to dynamically display semester season & year in 1 first column and number of courses in that semester in the 2nd column.
                htmlString += "<tr>";
                htmlString += "<td>" + semester.season + " " + semester.year + "</td>";
                htmlString += "<td>" + courseCount + "</td>";

                // Implemented 'onclick' event listener for the "Edit" button and semester id is passed as an argument. 
                htmlString += "<td><button class='waves-effect waves-light btn' onclick='enableEditSemester(\"" + semester.id + "\")'>Edit</button>" + "</td>";
                htmlString += "</tr>";

                // The table for existing semester is still open at this point. 
                isTableOpen = true;
            });

            // Close table, body div and li element for the last year.
            htmlString += "</tbody>";
            htmlString += "</table>";
            htmlString += "</div>";
            htmlString += "</li>";

            // Close collapsible/accordion.
            htmlString += "</ul>";
        } else 
        // If there are no existing semesters or when the users opens the app for the first time after installation then we display this message. 
        {
            htmlString = "<i class='far fa-frown fa-4x'></i>";
            htmlString += "<div class='flow-text'>&nbsp;Nothing to show here.</div>";
            htmlString += "<div class='flow-text'>Add a semester from above.</div>";
        }

        // Displaying the existing semesters using the innerHTML property for changing the content of HTML elements.
        allSemestersList.innerHTML = htmlString;

        // Initialize updated semester list.
        let collapsible = document.querySelectorAll(".collapsible");
        M.Collapsible.init(collapsible, {});
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox("File not found.", "Semesters could not be populated.");
        else
            dialog.showErrorBox("Error!", "An unknown error occurred while loading semesters.");
    }
}

function addSemester(isUpdate = false, id = 0) {
    try {
        let season, year, success, existingSemesters, newSemester, month, changedSemester;
        let previousMaxId = 0;

        // If user wants to update/change existing semesters and clicks on the Edit button then we store the season and values for that semester.
        if (isUpdate) {
            season = editSeasonSelection.value
            year = editYear.value;
        } else {
            season = seasonSelection.value;
            year = yearText.value;
        }

        // Validations for season and year.
        success = validateUserInputs(season, year);

        // No further processing if validation fails.
        if (!success)
            return;

        // Read existing data from datastore file and store as JSON object array in RAM.
        existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, "utf-8"));

        // Check if the semester already exists or not.
        for (const semester of existingSemesters) {
            if (semester.year === year && semester.season === season) {
                return dialog.showErrorBox("Error!", semester.season + " " + semester.year + " semester already exists.");
            }
        }

        // Add/update semester when it does not exist.
        // Determine month number based on season/term selection.
        switch (season) {
            case "Winter":
                month = 1;
                break;
            case "Spring":
                month = 5;
                break;
            case "Summer":
                month = 7;
                break;
            case "Fall":
                month = 9;
                break;
            default:
                month = 9; // By default assume Fall semester.
                break;
        }

        if (isUpdate) {
            // Update existing semester.
            for (const semester of existingSemesters) {
                if (parseInt(semester.id) === parseInt(id)) {
                    semester.year = year;
                    semester.season = season;
                    semester.month = month;

                    changedSemester = semester;

                    break;
                }
            }
        } else {
            // Find the ID of the previous semester.
            if (existingSemesters.length > 0) {
                // When the existing semester array is not empty, find max ID.
                for (const semester of existingSemesters) {
                    if (semester.id > previousMaxId)
                        previousMaxId = semester.id;
                }
            } else
                previousMaxId = 0;

            newSemester = {
                id: previousMaxId + 1,
                year: year,
                season: season,
                month: month
            };

            // Add the new semester.
            existingSemesters.push(newSemester);
        }

        // Sort semesters by year, most recent at the top.
        existingSemesters.sort(function (current, next) {
            return next.year - current.year;
        });

        // Sort semesters by month.
        existingSemesters.sort(function (current, next) {
            if (current.year === next.year) {
                return parseInt(current.month) - parseInt(next.month);
            } else {
                return current;
            }
        });

        try {
            // Write all the semesters back to datastore file.
            fs.writeFileSync(semestersDataFile, JSON.stringify(existingSemesters, null, 4));

            // Show success message.
            let detailMessage;

            if (isUpdate)
                detailMessage = "The semester was updated successfully.";
            else
                detailMessage = newSemester.season + " " + newSemester.year + " added successfully.";

            // Creating an options object to be used for providing feedback using the dialog module.
            let options = {
                type: "info",
                buttons: ["Ok"],
                message: "Success!",
                detail: detailMessage
            };

            // Fetches the current window.
            let currentWindow = remote.getCurrentWindow();

            // Displaying the dialog box on the current window using the previously created options object.
            dialog.showMessageBoxSync(currentWindow, options);
        } catch (error) {
            dialog.showErrorBox("Unknown Error!", "Error while saving the semester.");
        }

        if (isUpdate) {
            // Update semester details for associated courses.
            updateSemesterForAssociatedCourses(changedSemester);

            // Update semester details for associated assignments.
            updateSemesterForAssociatedAssignments(changedSemester);

            // Hide and clear edit semester form.
            cancelSemesterEdit();
        } else {
            // Clear add semester form.
            seasonSelection.selectedIndex = 0;
            M.FormSelect.init(seasonSelection, {});
            yearText.value = "";
        }
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox("File not found.", "Existing semesters could not be read.");
        else
            dialog.showErrorBox("Unknown Error!", "Error while reading existing semesters.");
    }

    listExistingSemesters();
}

function getCourseCountForSemester(semesterId) {
    let courseCount = 0;

    try {
        // Reading all the existing courses from courses.json into allCourses object.
        let allCourses = JSON.parse(fs.readFileSync(coursesDataFile, "utf-8"));

        // Searching among all the existing courses and finding the courses with identical semester id and incrementing the course count.
        for (const course of allCourses) {

            // Converting from string to integer value using parseInt() function in Javascript.
            if (parseInt(course.semesterId) === parseInt(semesterId))
                courseCount++;
        }
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox("Course file not found.", "Course count will not be populated.");
        else
            dialog.showErrorBox("Unknown Error!", "An unknown error occurred while reading course data file.");
    }

    return courseCount;
}

function enableEditSemester(semesterId) {
    // Hide add semester form.
    document.getElementById("addSemesterDiv").classList.add("hide");

    // Show edit semester form.
    document.getElementById("editSemesterDiv").classList.remove("hide");

    // Read existing semesters.
    let existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, "utf-8"));

    for (const semester of existingSemesters) {
        if (parseInt(semester.id) === parseInt(semesterId)) {
            // Fill values for season and year for the semester to be edited.
            editSemesterId.value = semester.id;
            editYear.value = semester.year;
            editSeasonSelection.value = semester.season;
            break;
        }
    }

    // Initialize Materialize CSS based edit season selection dropdown.
    M.FormSelect.init(editSeasonSelection, {});

    // Initialize input character counter for edit Year text box.
    const editYearTextCountInstance = new M.CharacterCounter(editYear);

    // Set focus on edit form.
    window.location.href = "#editSemesterDiv";
}

function cancelSemesterEdit() {
    // Hide edit semester form.
    document.getElementById("editSemesterDiv").classList.add("hide");

    // Show add semester form.
    document.getElementById("addSemesterDiv").classList.remove("hide");

    // Reset edit semester form values.
    editSemesterId.value = "";
    editYear.value = "";
    editSeasonSelection.selectedIndex = 0;

    // Initialize Materialize CSS based edit season selection dropdown.
    M.FormSelect.init(editSeasonSelection, {});
}

function updateSemester() {
    // Ask for confirmation.
    let options = {
        type: "question",
        buttons: ["No", "Yes"],
        defaultId: 0,
        message: "Are you sure?",
        detail: "This action will update all associated courses and assignments too."
    };

    //Fetches the current window. 
    let currentWindow = remote.getCurrentWindow();

    // Displaying the dialog box on the current window using the previously created options object.
    let response = dialog.showMessageBoxSync(currentWindow, options);

    if (response === 1) {
        // Pass id of the semester to addSemester function.
        addSemester(isUpdate = true, id = editSemesterId.value);
    }
}

function updateSemesterForAssociatedCourses(semester) {
    try {
        // Reading all the existing courses from courses.json into allCourses object.
        let allCourses = JSON.parse(fs.readFileSync(coursesDataFile, "utf-8"));

        // Check if there are any existing courses in the allCourses JSON object object obtained from courses.json. 
        if (allCourses.length > 0) {
            // For each existing course in the courses.json check for each course that has same semester id as the semester being edited and then update the season, year and month for each such course.
            for (let course of allCourses) {
                if (parseInt(course.semesterId) === parseInt(semester.id)) {
                    course.season = semester.season;
                    course.year = semester.year;
                    course.month = semester.month;
                }
            }

            // Write all the courses back to datastore file.
            try {
                fs.writeFileSync(coursesDataFile, JSON.stringify(allCourses, null, 4));

                // Show a non-blocking success message.
                M.toast({ html: "Associated courses successfully synced with semester update." });
            } catch (error) {
                dialog.showErrorBox("Unknown Error!", "Error while updating the semester for associated courses.");
            }
        }
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox("Course file not found.", "Semester for courses will not be updated.");
        else
            dialog.showErrorBox("Unknown Error!", "An unknown error occurred while reading course data file.");
    }
}

function updateSemesterForAssociatedAssignments(semester) {
    try {
        // Reading all the existing assignments from assignments.json into allAssignments object.
        let allAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile, "utf-8"));

        // Check if there are any existing assignments in the allAssignments JSON object obtained from assignments.json.
        if (allAssignments.length > 0) {

            // For each existing assignment in the assignments.json check for each assignment that has same semester id as the semester being edited and then update the season, year and month for each such assignment.
            for (let assignment of allAssignments) {
                if (parseInt(assignment.semesterId) === parseInt(semester.id)) {
                    assignment.season = semester.season;
                    assignment.year = semester.year;
                    assignment.month = semester.month;
                }
            }

            // Write all the assignments back to datastore file.
            try {
                fs.writeFileSync(assignmentsDataFile, JSON.stringify(allAssignments, null, 4));

                // Show a non-blocking success message.
                M.toast({ html: "Associated assignments successfully synced with semester update." })
            } catch (error) {
                dialog.showErrorBox("Unknown Error!", "Error while updating the semester for associated assignments.");
            }
        }
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox("Assignments file not found.", "Semester for associated assignments will not be updated.");
        else
            dialog.showErrorBox("Unknown Error!", "An unknown error occurred while reading assignments data file.");
    }
}

function validateUserInputs(season, year) {

    // Check for empty/no season selection.
    if (season === "" || season == null) {
        dialog.showErrorBox("Error", "You must select a season/term.");
        return false;
    }

    // Check for empty/all space year value.
    if (year.trim() === "" || year == null) {
        dialog.showErrorBox("Error", "You must enter a valid year of study.");
        return false;
    }

    // Only if above two validations did not fail, check year value.
    if (parseInt(year) < minimumYear || parseInt(year) > currentYear) {
        dialog.showErrorBox("Error", "A valid year is between " + minimumYear + " and " + currentYear + ".");
        return false;
    }

    // All values are correct.
    return true;
}

// Event listener for Add button.
addSemesterButton.addEventListener("click", function (event) {
    addSemester(false, 0);
});

// Event listener for Update button.
updateSemesterButton.addEventListener("click", updateSemester);

// Event listener for Cancel button.
cancelUpdateSemesterButton.addEventListener("click", cancelSemesterEdit);

// Event listener to initialize the page using initializePage() function after the page/document has been loaded. 
document.addEventListener("DOMContentLoaded", initializePage);