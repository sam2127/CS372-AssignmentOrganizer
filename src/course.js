const path = require('path');
const fs = require('fs');
const { remote } = require('electron');
const dialog = remote.dialog;

// const addSemesterButton = document.getElementById('addSemesterButton');
const semesterSelection = document.getElementById('semesterSelection');
const addCourseButton = document.getElementById('addCourseButton');
const allCoursesList = document.getElementById('allCoursesList');

const settingsFile = path.join(__dirname, './.config/settings.json');

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
    populateSemestersDropdown();

    // Populate existing courses list.
    listExistingCourses();
}

function readSettings() {
    try {
        let settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
        semestersDataFile = path.join(settings.configRootFolder, settings.semestersDataFile);
        coursesDataFile = path.join(settings.configRootFolder, settings.coursesDataFile);
        assignmentsDataFile = path.join(settings.configRootFolder, settings.assignmentsDataFile);
    } catch (error) {
        dialog.showErrorBox('Error!', "Error reading settings file.");
    }
}

function populateSemestersDropdown() {
    let newOption, optionText, optionValue;

    try {
        let existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, 'utf-8'));

        if (existingSemesters.length > 0) {
            optionText = "Select";
            optionValue = " ";
            newOption = new Option(optionText, optionValue);
            newOption.selected = true;

            semesterSelection.add(newOption, undefined);

            let prevYear = 9999;
            let optionGroup;

            existingSemesters.forEach(semester => {
                if (prevYear != semester.year) {
                    optionGroup = document.createElement("optgroup");
                    optionGroup.setAttribute("label", semester.year);

                    semesterSelection.appendChild(optionGroup);

                    prevYear = semester.year;
                }

                optionText = semester.season + ' ' + semester.year;
                optionValue = semester.id;
                newOption = new Option(optionText, optionValue);

                optionGroup.appendChild(newOption);
            });
        } else {
            optionText = "No Semesters Available - Add one";
            optionValue = " ";
            newOption = new Option(optionText, optionValue);

            semesterSelection.add(newOption, undefined);
        }
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing Semesters could not be populated.');
        else
            dialog.showErrorBox('Error!', "An unknown error occurred while loading semesters.");

        // Remove all existing options from semester dropdown, if any.
        for (let index = 0; index < semesterSelection.options.length; index++) {
            semesterSelection.remove(index);
        }

        // Add an Error option to indicate the error/non-availability.
        optionText = "Error!";
        optionValue = " ";
        newOption = new Option(optionText, optionValue);

        semesterSelection.add(newOption, undefined);
    }

    // Initialize semester dropdown to reflect updated options.
    var dropDownInstance = M.FormSelect.init(semesterSelection, {});
}

function listExistingCourses() {
    try {
        let existingCourses = JSON.parse(fs.readFileSync(coursesDataFile, 'utf-8'));

        //Sort
        sortCoursesBySemester(existingCourses);

        let htmlString = "";

        if (existingCourses.length > 0) {
            htmlString = "<ul class='collapsible popout'>";

            let prevYear = 9999;
            let isTableOpen = false;

            existingCourses.forEach(course => {
                if (course.year !== prevYear) {
                    if (isTableOpen) {
                        // Close table, body div and li element for previous year.
                        htmlString += "</tbody>";
                        htmlString += "</table>";
                        htmlString += "</div>";
                        htmlString += "</li>";

                        isTableOpen = false;
                    }

                    prevYear = course.year;

                    htmlString += "<li>";
                    htmlString += "<div class='teal collapsible-header'>";
                    htmlString += course.year;
                    htmlString += "</div>";
                    htmlString += "<div class='collapsible-body'>";
                    htmlString += "<table class='centered highlight'>";
                    htmlString += "<thead><tr><th>Semester</th>";
                    htmlString += "<th>Course Code</th>";
                    htmlString += "<th>Course Name</th>";
                    htmlString += "<th>Assignments</th>";
                    htmlString += "</thead>";
                    htmlString += "<tbody>";
                }

                let assignmentCount = getAssignmentsCount(course.courseCode);

                htmlString += "<tr>";
                htmlString += "<td>" + course.season + " " + course.year + "</td>";
                htmlString += "<td class='center aligned'>" + course.courseCode + "</td> ";
                htmlString += "<td>" + course.courseName + "</td>";
                htmlString += "<td class='center aligned'>" + assignmentCount + "</td>";
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
            htmlString += "<div class='flow-text'>Add a Course from above.</div>";
        }

        allCoursesList.innerHTML = htmlString;

        // Refresh courses list.
        let collapsible = document.querySelectorAll('.collapsible');
        M.Collapsible.init(collapsible, {});
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing courses could not be read.');
        else
            dialog.showErrorBox('Error!', "An unknown error occurred while reading course data file.");
    }
}

function addCourse() {
    try {
        // TODO : Add validations.
        const semester = document.getElementById('semesterSelection');
        const courseCode = document.getElementById('courseCode');
        const courseName = document.getElementById('courseName');

        let semesterLabel = semester.options[semester.selectedIndex].innerHTML;
        let season = semesterLabel.substr(0, semesterLabel.length - 5);
        let year = semesterLabel.substr(semesterLabel.length - 4, semesterLabel.length);
        let semesterId = semester.value;
        let month;
        let courseExists = false;
        let allCourses;
        let newCourse;

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
                month = 0;
                break;
        }

        allCourses = JSON.parse(fs.readFileSync(coursesDataFile, 'utf-8'));

        // Find the ID of the previous course.
        let previousMaxId = 0;

        if (allCourses.length > 0) {
            // When the existing courses array is not empty, find max ID.
            for (let course of allCourses) {
                if (course.id > previousMaxId)
                    previousMaxId = course.id;
            }
        }

        // Create a new course object to save.
        newCourse = {
            id: previousMaxId + 1,
            semesterId: semesterId,
            season: season,
            year: year,
            month: month,
            courseCode: courseCode.value,
            courseName: courseName.value
        };

        // Before saving check if the course already exists or not.
        allCourses.forEach(course => {
            if (course.courseCode === newCourse.courseCode &&
                course.year === newCourse.year &&
                course.month === newCourse.month) {

                dialog.showErrorBox('Error!', course.courseCode + " " + course.courseName + " already exists.");

                courseExists = true;
            }
        });

        if (!courseExists) {
            // Add new course to existing courses object in RAM.
            allCourses.push(newCourse);

            // Sort courses.
            sortCoursesBySemester(allCourses);

            // Write all the semesters back to datastore file.
            try {
                fs.writeFileSync(coursesDataFile, JSON.stringify(allCourses, null, 4));

                let options = {
                    type: 'info',
                    buttons: ['Ok'],
                    message: "Success!",
                    detail: newCourse.courseCode + " - " + newCourse.courseName + " added successfully."
                };

                let currentWindow = remote.getCurrentWindow();
                dialog.showMessageBoxSync(currentWindow, options);
            } catch (error) {
                dialog.showErrorBox('Unknown Error!', "Error while saving the course.");
            }
        }

        // Clear add course form.
        semesterSelection.selectedIndex = 0;
        M.FormSelect.init(semesterSelection, {});
        courseCode.value = "";
        courseName.value = "";

        // List updated course list.
        listExistingCourses();
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing courses could not be read.');
        else
            dialog.showErrorBox('Error!', "Error while saving the course.");
    }
}

function sortCoursesBySemester(courses) {
    courses.sort(function (current, next) {
        return next.year - current.year;
    });

    courses.sort(function (current, next) {
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
        let allAssignments = JSON.parse(fs.readFileSync(assignmentsDataFile, 'utf-8'));

        for (const assignment of allAssignments) {
            if (courseCode === assignment.courseCode)
                assignmentCount++;
        }
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing assignments could not be read.');
        else
            dialog.showErrorBox('Error!', "An unknown error occurred while reading assignments data file.");
    }

    return assignmentCount;
}

addCourseButton.addEventListener('click', addCourse);

document.addEventListener('DOMContentLoaded', initializePage);