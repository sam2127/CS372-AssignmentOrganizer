// Node.js path module allows joining the specified path segments into one path.
const path = require("path");
// Node.js file system module allows to read/write the files on computer system.
const fs = require("fs");
// remote module allows renderer process to access other Electron modules which are only accessible through main process.
const { remote } = require("electron");
// Display native system dialogs for opening and saving files, alerting, etc.
const dialog = remote.dialog;

// Accessing the different HTML elements in course.html by their unique id's.
const semesterSelection = document.getElementById("semesterSelection");
const term = document.getElementById("semesterSelection");
const courseCode = document.getElementById("courseCode");
const courseName = document.getElementById("courseName");
const addCourseButton = document.getElementById("addCourseButton");
const editCourseId = document.getElementById("editCourseId");
const editTerm = document.getElementById("editSemesterSelection");
const editCourseCode = document.getElementById("editCourseCode");
const editCourseName = document.getElementById("editCourseName");
const updateCourseButton = document.getElementById("updateCourseButton");
const cancelEditCourseButton = document.getElementById(
    "cancelEditCourseButton"
);
const allCoursesList = document.getElementById("allCoursesList");

// Storing the path for settings.json file.
const settingsFile = path.join(__dirname, "./.config/settings.json");

let semestersDataFile;
let coursesDataFile;
let assignmentsDataFile;

function initializePage() {
    // Initialize input character counter for courseCode text box.
    const courseCodeCountInstance = new M.CharacterCounter(courseCode);

    // Initialize input character counter for courseName text box.
    const courseNameCountInstance = new M.CharacterCounter(courseName);

    // Read settings for future file operations.
    readSettings();

    // Populate semester selection list.
    populateSemestersSearch();

    // Populate existing courses list.
    listExistingCourses();
}

function readSettings() {
    try {
        // Reading the data from settings.json synchronously using function readFileSync() in fs module and parsing it as a JSON object.
        let settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));

        // Joining the specified path segments for semesters.json file using the data stored in settings.json and storing the path.
        semestersDataFile = path.join(
            settings.configRootFolder,
            settings.semestersDataFile
        );

        // Joining the specified path segments for courses.json file using the data stored in settings.json and storing the path.
        coursesDataFile = path.join(
            settings.configRootFolder,
            settings.coursesDataFile
        );

        // Joining the specified path segments for assignments.json file using the data stored in settings.json and storing the path.
        assignmentsDataFile = path.join(
            settings.configRootFolder,
            settings.assignmentsDataFile
        );
    } catch (error) {
        dialog.showErrorBox("Error!", "Error reading settings file.");
    }
}

function populateSemestersSearch() {
    let existingSemesters, label, search, autoCompleteInstance;
    let mySemesters = {};

    try {
        // Reads the existing semesters from semesters.json and then parse as a JSON object.
        existingSemesters = JSON.parse(
            fs.readFileSync(semestersDataFile, "utf-8")
        );

        // Check if there are any existing semesters and then create a label for each semester.
        if (existingSemesters.length > 0) {
            // Let the user know the number of courses available to search from.
            semesterSelection.setAttribute(
                "placeholder",
                "Type to search - " +
                    existingSemesters.length +
                    " semester(s) available"
            );

            // Do the same for edit course form.
            editTerm.setAttribute(
                "placeholder",
                "Type to search -" +
                    existingSemesters.length +
                    " semester(s) available"
            );

            existingSemesters.forEach((semester) => {
                label = semester.season + " " + semester.year;

                // We just need label for searching. Icon URL is set to null for all semesters.
                mySemesters[label] = null;
            });
        } else {
            // Make number of semesters available to search from, known to user.
            semesterSelection.setAttribute(
                "placeholder",
                "No semester found - First add a semester."
            );
            label = "No semester found - Add one first.";

            // We just need label for searching. Icon URL is set to null for all search results.
            mySemesters[label] = null;
        }

        // Initialize semester search and select.
        search = document.querySelectorAll(".autocomplete");

        // Initialize Materialize autocomplete search instance.
        autoCompleteInstance = M.Autocomplete.init(search, {
            data: mySemesters,
        });
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox(
                "File not found.",
                "Existing Semesters could not be populated."
            );
        else
            dialog.showErrorBox(
                "Error!",
                "An unknown error occurred while loading semesters."
            );
    }
}

function listExistingCourses() {
    try {
        // Reads the existing courses from courses.json and then parse as a JSON object.
        let existingCourses = JSON.parse(
            fs.readFileSync(coursesDataFile, "utf-8")
        );

        let htmlString = "";
        let prevYear = 9999;
        let isTableOpen = false;

        // Check for any existing courses.
        if (existingCourses.length > 0) {
            // Assigning html elements to a string variable for displaying a list of existing courses.
            htmlString = "<ul class='collapsible popout'>";

            // This loop is used to keep track of different html elements needed for displaying each existing course in the tabular form.
            existingCourses.forEach((course) => {
                // Check whether or not to initialize html elements for displaying an existing course if it exists.
                if (course.year !== prevYear) {
                    // Check to if the table is still open for previous year's courses or not.```
                    if (isTableOpen) {
                        // Close table, body div and li element for previous year.
                        htmlString += "</tbody>";
                        htmlString += "</table>";
                        htmlString += "</div>";
                        htmlString += "</li>";

                        isTableOpen = false;
                    }

                    // Assigning current course year value to the prevYear.
                    prevYear = course.year;

                    // Append header and body html elements for current course's year.
                    htmlString += "<li>";
                    htmlString += "<div class='teal collapsible-header'>";
                    htmlString += course.year;
                    htmlString += "</div>";
                    htmlString += "<div class='collapsible-body'>";
                    htmlString += "<table class='centered highlight'>";
                    // Creating a table header row.
                    htmlString += "<thead><tr><th>Semester</th>";
                    htmlString += "<th>Course Code</th>";
                    htmlString += "<th>Course Name</th>";
                    htmlString += "<th>Assignments</th>";
                    htmlString += "<th>Actions</th>";
                    htmlString += "</thead>";
                    htmlString += "<tbody>";
                }

                // Storing the assignment count for a particular semester to display in the table of added/existing courses.
                let assignmentCount = getAssignmentsCount(course.courseCode);

                // Append the current course's information with the number of assignments for that course.
                htmlString += "<tr>";
                htmlString +=
                    "<td>" + course.season + " " + course.year + "</td>";
                htmlString +=
                    "<td class='center aligned'>" +
                    course.courseCode +
                    "</td> ";
                htmlString += "<td>" + course.courseName + "</td>";
                htmlString +=
                    "<td class='center aligned'>" + assignmentCount + "</td>";

                // Implemented 'onclick' event listener for the "Edit" button and semester id is passed as an argument.
                htmlString +=
                    "<td><button class='waves-effect waves-light btn tooltipped' data-position='top' data-tooltip='Edit' onclick='enableEditCourse(\"" +
                    course.id +
                    "\")'><i class='material-icons'>edit</i></button></button>";

                // Add 'Delete' action if there is no assignment created for current course.
                if (assignmentCount === 0) {
                    htmlString +=
                        "&nbsp;<button class='waves-effect waves-light btn tooltipped' data-position='top' data-tooltip='Delete' onclick='deleteCourse(\"" +
                        course.id +
                        "\")'><i class='material-icons'>delete</i></button>";
                }

                htmlString += "</td></tr>";

                // The table for current year is still open at this point.
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
            htmlString = "<i class='far fa-frown fa-4x'></i>";
            htmlString +=
                "<div class='flow-text'>&nbsp;Nothing to show here.</div>";
            htmlString +=
                "<div class='flow-text'>Add a course from above.</div>";
        }

        // Finally use the course list in form of a dynamically built HTML string as the `innerHTML` property for a `div` element to display as a formatted course list.
        allCoursesList.innerHTML = htmlString;

        // Initialize tooltips for all course Edit buttons.
        let editButtons = document.querySelectorAll(".tooltipped");
        M.Tooltip.init(editButtons, {});

        // Refresh courses list.
        let collapsible = document.querySelectorAll(".collapsible");
        M.Collapsible.init(collapsible, {});
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox(
                "File not found.",
                "Existing courses could not be read."
            );
        else
            dialog.showErrorBox(
                "Error!",
                "An unknown error occurred while reading course data file."
            );
    }
}

function addCourse(isUpdate = false, courseId = 0) {
    try {
        let semester,
            semesterText,
            courseCodeText,
            courseNameText,
            allCourses,
            newCourse,
            changedCourse;
        let success,
            duplicateCourseExists = false;
        let previousMaxId = 0;

        // Check if we are updating an existing course or adding a new course and read the user input accordingly.
        if (isUpdate) {
            semesterText = editTerm.value.trim();
            courseCodeText = editCourseCode.value.trim();
            courseNameText = editCourseName.value.trim();
        } else {
            semesterText = term.value.trim();
            courseCodeText = courseCode.value.trim();
            courseNameText = courseName.value.trim();
        }

        // Validations for semester, course code and course text.
        success = validateUserInputs(
            semesterText,
            courseCodeText,
            courseNameText
        );

        // No further processing if validation fails.
        if (!success) return;

        // Find the details of selected semester.
        semester = findSemester(semesterText);

        // If semester is not found due to any error, then don't process anything further.
        if (semester == null)
            return dialog.showErrorBox(
                "Error",
                "An error occurred while fetching semester details."
            );

        // Reads the existing courses from courses.json and then parse as a JSON object.
        allCourses = JSON.parse(fs.readFileSync(coursesDataFile, "utf-8"));

        // Check if the course already exists or not.
        allCourses.forEach((course) => {
            if (
                course.courseCode === courseCodeText &&
                course.courseName === courseNameText &&
                course.semesterId === semester.id
            ) {
                dialog.showErrorBox(
                    "Error!",
                    course.courseCode +
                        " " +
                        course.courseName +
                        " already exists."
                );

                duplicateCourseExists = true;
            }
        });

        if (!duplicateCourseExists) {
            if (isUpdate) {
                for (const course of allCourses) {
                    // Check all the courses based on the course id of the course being edited and update it.
                    if (parseInt(course.id) === parseInt(courseId)) {
                        course.semesterId = semester.id;
                        course.season = semester.season;
                        course.year = semester.year;
                        course.month = semester.month;
                        course.courseCode = courseCodeText;
                        course.courseName = courseNameText;

                        // Storing the updated course object.
                        changedCourse = course;

                        break;
                    }
                }
            } else {
                // When the existing courses array is not empty, find ID of previous course.
                if (allCourses.length > 0) {
                    for (let course of allCourses) {
                        // Check all the courses and previousMaxId should be assigned the greatest course id value from all the course IDs.
                        if (course.id > previousMaxId)
                            previousMaxId = course.id;
                    }
                } else {
                    // This will be the first course we are going to add.
                    previousMaxId = 0;
                }

                // Create a new course object to save.
                newCourse = {
                    id: previousMaxId + 1,
                    semesterId: semester.id,
                    season: semester.season,
                    year: semester.year,
                    month: semester.month,
                    courseCode: courseCodeText,
                    courseName: courseNameText,
                };

                // Add new course to existing courses object in RAM.
                allCourses.push(newCourse);
            }

            // Sort courses.
            sortCoursesBySemester(allCourses);

            // Write all the courses back to file.
            try {
                fs.writeFileSync(
                    coursesDataFile,
                    JSON.stringify(allCourses, null, 4)
                );

                // Show success message.
                let detailMessage;

                if (isUpdate)
                    detailMessage = "The course was updated successfully.";
                else
                    detailMessage =
                        newCourse.courseCode +
                        " " +
                        newCourse.courseName +
                        " added successfully.";

                // Creating an options object to be used for providing feedback using the dialog module.
                let options = {
                    type: "info",
                    buttons: ["Ok"],
                    message: "Success!",
                    detail: detailMessage,
                };

                // Storing the current window.
                let currentWindow = remote.getCurrentWindow();

                // Displaying the options dialog box on current window.
                dialog.showMessageBoxSync(currentWindow, options);
            } catch (error) {
                dialog.showErrorBox(
                    "Unknown Error!",
                    "Error while saving the course."
                );
            }
        }

        if (isUpdate) {
            // Update course details for associated assignments.
            updateCourseForAssociatedAssignments(changedCourse);

            // Hide and clear edit course form.
            cancelCourseEdit();
        } else {
            // Clear add course form.
            semesterSelection.value = "";
            courseCode.value = "";
            courseName.value = "";
        }

        // List updated course list.
        listExistingCourses();
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox(
                "File not found.",
                "Existing courses could not be read."
            );
        else
            dialog.showErrorBox(
                "Error!",
                "Error processing the selected course."
            );
    }
}

function sortCoursesBySemester(courses) {
    // Sort courses by year, most recent at the top.
    courses.sort(function (current, next) {
        return next.year - current.year;
    });

    courses.sort(function (current, next) {
        // Sort courses by month if they have the same year.
        if (current.year === next.year) {
            return parseInt(current.month) - parseInt(next.month);
        } else {
            return current;
        }
    });
}

function getAssignmentsCount(courseCode) {
    let assignmentCount = 0;

    try {
        // Reading all the existing assignments from the file.
        let allAssignments = JSON.parse(
            fs.readFileSync(assignmentsDataFile, "utf-8")
        );

        // Find all the assignments with the same course code.
        for (const assignment of allAssignments) {
            if (courseCode === assignment.courseCode) assignmentCount++;
        }
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox(
                "File not found.",
                "Existing assignments could not be read."
            );
        else
            dialog.showErrorBox(
                "Error!",
                "An unknown error occurred while reading assignments data file."
            );
    }

    // Returns the number of assignments in a course.
    return assignmentCount;
}

function findSemester(term) {
    // Extracting the season value from the term string.
    let season = term.substr(0, term.length - 5);

    // Extracting the year value from the term string.
    let year = term.substr(term.length - 4, term.length);

    // Declare a null semester.
    let mySemester = null;

    try {
        // Read all the existing semesters from the file.
        let existingSemesters = JSON.parse(
            fs.readFileSync(semestersDataFile, "utf-8")
        );

        // Find the semester from the file that has the same year and season.
        existingSemesters.forEach((semester) => {
            if (semester.year === year && semester.season === season) {
                mySemester = semester;
            }
        });
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox(
                "File not found.",
                "Failed to find details of selected semester."
            );
        else
            dialog.showErrorBox(
                "Error!",
                "An unknown error occurred while finding selected semester's details."
            );
    }

    // Return semester object if a matching semester was found, otherwise return a null object.
    return mySemester;
}

function enableEditCourse(courseId) {
    // Hide add course form.
    document.getElementById("addCourseDiv").classList.add("hide");

    // Show edit course form.
    document.getElementById("editCourseDiv").classList.remove("hide");

    // Read existing courses.
    let existingCourses = JSON.parse(fs.readFileSync(coursesDataFile, "utf-8"));

    for (const course of existingCourses) {
        if (parseInt(course.id) === parseInt(courseId)) {
            // Fill values for season and year for the semester to be edited.
            editCourseId.value = course.id;
            editTerm.value = course.season + " " + course.year;
            editCourseCode.value = course.courseCode;
            editCourseName.value = course.courseName;
            break;
        }
    }

    // Initialize Materialize CSS based edit semester search.
    M.Collapsible.init(editTerm, {});

    // Initialize input character counter for edit Course Code text box.
    const editCourseCodeCountInstance = new M.CharacterCounter(editCourseCode);

    // Initialize input character counter for edit Course Name text box.
    const editCourseNameCountInstance = new M.CharacterCounter(editCourseName);

    // Set focus on edit form.
    window.location.href = "#editCourseDiv";
}

function cancelCourseEdit() {
    // Hide edit course form.
    document.getElementById("editCourseDiv").classList.add("hide");

    // Show add course form.
    document.getElementById("addCourseDiv").classList.remove("hide");

    // Reset edit course form values.
    editCourseId.value = "";
    editTerm.value = "";
    editCourseCode.value = "";
    editCourseName.value = "";
}

function updateCourse() {
    // Ask for confirmation.
    let options = {
        type: "question",
        buttons: ["No", "Yes"],
        defaultId: 0,
        message: "Are you sure?",
        detail: "This action will update all associated assignments too.",
    };

    // Fetches the current window.
    let currentWindow = remote.getCurrentWindow();

    // Displaying the dialog box as the child of current window using the options above.
    let response = dialog.showMessageBoxSync(currentWindow, options);

    // If user responded "Yes", then only update the course.
    if (response === 1) {
        // Pass id of the course to addCourse function.
        addCourse((isUpdate = true), (id = editCourseId.value));
    }
}

function updateCourseForAssociatedAssignments(course) {
    let allAssignments;

    try {
        // Reading all the existing assignments from assignments.json into allAssignments object.
        allAssignments = JSON.parse(
            fs.readFileSync(assignmentsDataFile, "utf-8")
        );

        // Check if there are any existing assignments in the allAssignments JSON object obtained from assignments.json.
        if (allAssignments.length > 0) {
            // For each existing assignment in the assignments.json check for each assignment that has same course id as the course being edited and then update the semester and course details for each such assignment.
            for (let assignment of allAssignments) {
                if (parseInt(assignment.courseId) === parseInt(course.id)) {
                    assignment.semesterId = course.semesterId;
                    assignment.season = course.season;
                    assignment.year = course.year;
                    assignment.month = course.month;
                    assignment.courseCode = course.courseCode;
                    assignment.courseName = course.courseName;

                    // TODO: Move assignment files to updated course folder.
                }
            }

            // Sort assignments before writing to file.
            // Sort based on year, most recent first.
            allAssignments.sort(function (current, next) {
                return next.year - current.year;
            });

            // Once sorted by year, sort based on month per year.
            allAssignments.sort(function (current, next) {
                if (current.year === next.year) {
                    return parseInt(current.month) - parseInt(next.month);
                } else {
                    return current;
                }
            });

            // Write all the assignments back to datastore file.
            try {
                fs.writeFileSync(
                    assignmentsDataFile,
                    JSON.stringify(allAssignments, null, 4)
                );

                // Show a non-blocking success message.
                M.toast({
                    html:
                        "Associated assignments successfully synced with course update.",
                });
            } catch (error) {
                dialog.showErrorBox(
                    "Unknown Error!",
                    "Error while updating the course for associated assignments."
                );
            }
        }
    } catch (error) {
        if (error.code === "ENOENT")
            dialog.showErrorBox(
                "Assignments file not found.",
                "Course for associated assignments will not be updated."
            );
        else
            dialog.showErrorBox(
                "Unknown Error!",
                "An unknown error occurred while reading assignments data file."
            );
    }
}

function validateUserInputs(term, courseCode, courseName) {
    
    //Creating variables to handle errors
    var error = false;
    var errorMessage = "You must do the following:\n";

    // Check for empty/no semester selection.
    if (term == null || term.trim() === "") {
        errorMessage += "* Select a Semester.\n"
        error = true;
    }

    // Check for empty course code.
    if (courseCode == null || courseCode.trim() === "") {
        errorMessage += "* Enter a Course Code.\n"
        error = true;
    }

    // Check for empty course name.
    if (courseName == null || courseName.trim() === "") {
        errorMessage += "* Enter a Course Name.\n"
        error = true;
    }

    if(error) {
        dialog.showErrorBox("Error", errorMessage);
        return false;
    }

    //Regex to check user entered valid course code
    let courseCodeRegExp = new RegExp("^[a-zA-Z]{2,2}[a-zA-Z-_\\d\\s]{0,8}$");
    if(!courseCodeRegExp.test(courseCode)) {
        errorMessage += "* Enter a valid Course Code. (Only digits, letters, spaces, underscores and dashes are allowed, example: Math-100).\n"
        error = true; 
    }

    //Regex to check user entered valid course name
    let courseNameRegExp = new RegExp("^[a-zA-Z][a-zA-Z-_'\\d\\s]{0,39}$");
    if(!courseNameRegExp.test(courseName)) {
        errorMessage += "* Enter a valid Course Name. (Only digits, letters, spaces, underscores, apostrophes and dashes are allowed, example: Intro to Calculus).\n"
        error = true; 
    }

    if(error) {
        dialog.showErrorBox("Error!", errorMessage);
        return false;
    }
    // All good.
    return true;
}

/**
 * Deletes a course.
 * @param {String} courseId Id of the semester to be deleted
 */
function deleteCourse(courseId) {
    let options, currentWindow, response;
    let existingCourses, index;

    // Ask for confirmation before delete.
    options = {
        type: "question",
        buttons: ["No", "Yes"],
        defaultId: 0,
        message: "Are you sure?",
        detail: "This will delete the course.",
    };

    // Fetches the current window.
    currentWindow = remote.getCurrentWindow();

    // Displaying the dialog box as the child of current window using the options above.
    response = dialog.showMessageBoxSync(currentWindow, options);

    // If user responded "Yes", then only delete the course.
    if (response === 1) {
        try {
            // Read existing courses.
            existingCourses = JSON.parse(
                fs.readFileSync(coursesDataFile, "utf-8")
            );

            // Get the index of the semester having the Id to delete.
            index = existingCourses.findIndex(function (course) {
                return course.id === parseInt(courseId);
            });

            // Delete the course from existing courses array in RAM.
            existingCourses.splice(index, 1);

            // Write updated array to course data file.
            fs.writeFileSync(
                coursesDataFile,
                JSON.stringify(existingCourses, null, 4)
            );

            // Show a non-blocking success message.
            M.toast({ html: "Course deleted successfully." });
        } catch (error) {
            dialog.showErrorBox(
                "Error!",
                "Error while deleting selected course."
            );
        }
    }

    // Refresh the existing courses list.
    listExistingCourses();
}

// Function to validate Course Code while user is entering input 
function validateCourseCode(event) {
    var cCode = event.currentTarget;
    var cc = cCode.value;

    //If the user has only entered 1 character so far
    if(cc.length == 1) {
        var regCourse = /^[a-zA-Z]$/;  
    }
    //If the user has only entered 2 character so far
    else if(cc.length == 2) {
        var regCourse = /^[a-zA-Z]{2,2}$/;
    }
    else {
        var regCourse = /^[a-zA-Z]{2,2}[a-zA-Z-_\d\s]{0,8}$/;
    }

    //Change font to red if regex match fails
    if(regCourse.test(cc) == false) {
        cCode.style.color = "red";
    }
    else {
        cCode.style.color = "black";
    }
}

// Function to validate Course Code size once user moves to another field
function validateCourseCodeSize(event) {
    var cCode = event.currentTarget;
    var cc = cCode.value;
    
    //Change font to red if user only entered one character and moved to another field
    if(cc.length == 1) {
        cCode.style.color = "red";
    }
    else {
        cCode.style.color = "black";
    }
}

// Function to validate Course Name while user is entering input
function validateCourseName(event) {
    //Declaring variables
    var cName = event.currentTarget;
    var cn = cName.value;
    var regCourse = /^[a-zA-Z][a-zA-Z-_'\d\s]{0,39}$/;

    //Change font to red if regex match fails
    if(regCourse.test(cn) == false) {
        cName.style.color = "red";
    }
    else {
        cName.style.color = "black";
    }
}


// Event listeners for Course Code while user is entering input
courseCode.addEventListener("keyup",validateCourseCode);
editCourseCode.addEventListener("keyup",validateCourseCode);

// Validate input size for course code once user moves to another field
courseCode.addEventListener("change",validateCourseCodeSize);
editCourseCode.addEventListener("change",validateCourseCodeSize);

// Event listeners for Course Name while user is entering input
courseName.addEventListener("keyup",validateCourseName);
editCourseName.addEventListener("keyup",validateCourseName);

// Event listener for Add button associated with addCourse() function.
addCourseButton.addEventListener("click", function (params) {
    addCourse(false, 0);
});

// Event listener for Update button associated with updateCourse() function.
updateCourseButton.addEventListener("click", updateCourse);

// Event listener for Cancel button associated with cancelCourseEdit() function.
cancelEditCourseButton.addEventListener("click", cancelCourseEdit);

// Event listener to initialize the page using initializePage() function after the page/document has been loaded.
document.addEventListener("DOMContentLoaded", initializePage);
