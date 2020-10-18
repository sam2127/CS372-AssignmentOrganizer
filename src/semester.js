const remote = require("electron").remote;
const dialog = remote.dialog;
const fs = require("fs");
const path = require("path");

const seasonSelection = document.getElementById("seasonSelection");
const yearText = document.getElementById("year");
const addSemesterButton = document.getElementById("addSemesterButton");
const editSemesterId = document.getElementById("editSemesterId");
const editSeasonSelection = document.getElementById("editSeasonSelection");
const editYear = document.getElementById("editYear");
const updateSemesterButton = document.getElementById("updateSemesterButton");
const cancelUpdateSemesterButton = document.getElementById("cancelUpdateSemesterButton");
const allSemestersList = document.getElementById("allSemestersList");

const settingsFile = path.join(__dirname, "./.config/settings.json");

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
}

function readSettings() {
    try {
        let settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
        semestersDataFile = path.join(settings.configRootFolder, settings.semestersDataFile);
        coursesDataFile = path.join(settings.configRootFolder, settings.coursesDataFile);
        assignmentsDataFile = path.join(settings.configRootFolder, settings.assignmentsDataFile);
    } catch (error) {
        dialog.showErrorBox("Error!", "Error reading settings file.");
    }
}

function listExistingSemesters() {
    try {
        let existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, "utf-8"));

        let htmlString = "";
        let prevYear = 9999;
        let isTableOpen = false;

        if (existingSemesters.length > 0) {
            htmlString = "<ul class='collapsible popout'>";

            existingSemesters.forEach((semester) => {
                if (semester.year !== prevYear) {
                    if (isTableOpen) {
                        // Close table, body div and li element for previous year.
                        htmlString += "</tbody>";
                        htmlString += "</table>";
                        htmlString += "</div>";
                        htmlString += "</li>";

                        isTableOpen = false;
                    }

                    prevYear = semester.year;

                    htmlString += "<li>";
                    htmlString += "<div class='teal collapsible-header'>";
                    htmlString += semester.year;
                    htmlString += "</div>";
                    htmlString += "<div class='collapsible-body'>";
                    htmlString += "<table class='centered striped'>";
                    htmlString += "<thead><tr><th>Semester</th>";
                    htmlString += "<th>Courses</th>";
                    htmlString += "<th>Actions</th>";
                    htmlString += "</thead>";
                    htmlString += "<tbody>";
                }

                let courseCount = getCourseCountForSemester(semester.id);

                htmlString += "<tr>";
                htmlString += "<td>" + semester.season + " " + semester.year + "</td>";
                htmlString += "<td>" + courseCount + "</td>";
                htmlString += "<td><button class='waves-effect waves-light btn' onclick='enableEditSemester(\"" + semester.id + "\")'>Edit</button>" + "</td>";
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
            htmlString = "<i class='far fa-frown fa-4x'></i>";
            htmlString += "<div class='flow-text'>&nbsp;Nothing to show here.</div>";
            htmlString += "<div class='flow-text'>Add a semester from above.</div>";
        }

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
        let season, year, existingSemesters, newSemester, month, changedSemester;
        let semesterExists = false;
        let previousMaxId = 0;

        if (isUpdate) {
            season = editSeasonSelection.value
            year = editYear.value;
        } else {
            season = seasonSelection.value;
            year = yearText.value;
        }

        // TODO: Add validations for season and year.

        // Read existing data from datastore file and store as JSON object array in RAM.
        existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, "utf-8"));

        // Check if the semester already exists or not.
        for (const semester of existingSemesters) {
            if (semester.year === year && semester.season === season) {
                dialog.showErrorBox("Error!", semester.season + " " + semester.year + " semester already exists.");
                semesterExists = true;
                break;
            }
        }

        // Add/update semester.
        if (!semesterExists) {
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

                let options = {
                    type: "info",
                    buttons: ["Ok"],
                    message: "Success!",
                    detail: detailMessage
                };

                let currentWindow = remote.getCurrentWindow();
                dialog.showMessageBoxSync(currentWindow, options);
            } catch (error) {
                dialog.showErrorBox("Unknown Error!", "Error while saving the semester.");
            }

            if (isUpdate) {
                // Update semester details for associated courses.
                updateSemesterForAssociatedCourses(changedSemester);

                // Update semester details for associated assignments.
                // TODO: Uncomment this line when assignment is implemented.
                // updateSemesterForAssociatedAssignments(changedSemester);

                // Hide and clear edit semester form.
                cancelSemesterEdit();
            } else {
                // Clear add semester form.
                seasonSelection.selectedIndex = 0;
                M.FormSelect.init(seasonSelection, {});
                yearText.value = "";
            }
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
        let allCourses = JSON.parse(fs.readFileSync(coursesDataFile, "utf-8"));

        for (const course of allCourses) {
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

    let currentWindow = remote.getCurrentWindow();
    let response = dialog.showMessageBoxSync(currentWindow, options);

    if (response === 1) {
        // Pass id of the semester to addSemester function.
        addSemester(isUpdate = true, id = editSemesterId.value);
    }
}

function updateSemesterForAssociatedCourses(semester) {
    try {
        let allCourses = JSON.parse(fs.readFileSync(coursesDataFile, "utf-8"));

        if (allCourses.length > 0) {
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
        let allAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile, "utf-8"));

        if (allAssignments.length > 0) {
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

addSemesterButton.addEventListener("click", function (event) {
    addSemester(false, 0);
});
updateSemesterButton.addEventListener("click", updateSemester);
cancelUpdateSemesterButton.addEventListener("click", cancelSemesterEdit);

document.addEventListener("DOMContentLoaded", initializePage);