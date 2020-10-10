const remote = require("electron").remote;
const dialog = remote.dialog;
const fs = require("fs");
const path = require("path");

const seasonSelection = document.getElementById("seasonSelection");
const yearText = document.getElementById("year");
const addSemesterButton = document.getElementById("addSemesterButton");
const allSemestersList = document.getElementById("allSemestersList");

const settingsFile = path.join(__dirname, "./.config/settings.json");

let semestersDataFile;
let coursesDataFile;

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
    } catch (error) {
        dialog.showErrorBox('Error!', "Error reading settings file.");
    }
}

function listExistingSemesters() {
    try {
        let existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, 'utf-8'));

        let htmlString = "";

        if (existingSemesters.length > 0) {
            htmlString = "<ul class='collapsible popout'>";

        existingSemesters.forEach((yearObj) => {
            htmlString += "<li>";
            htmlString += "<div class='teal collapsible-header'>";
            htmlString += yearObj.year;
            htmlString += "</div>";
            htmlString += "<div class='collapsible-body'>";
            htmlString += "<table class='centered striped'>";
            htmlString += "<thead><tr><th>Semester</th><th>Courses</th></tr></thead>";
            htmlString += "<tbody>";

            yearObj.semesters.forEach((semester) => {
                let courseCount = getCourseCountForSemester(yearObj.year, semester.season);

                htmlString += "<tr>";
                htmlString += "<td>" + semester.season + " " + yearObj.year + "</td>";
                htmlString += "<td>" + courseCount + "</td>";
                htmlString += "</tr>";
            });

            htmlString += "</tbody>";
            htmlString += "</table>";
            htmlString += "</div>";
            htmlString += "</li>";
        });

        htmlString += "</ul>";
        } else {
            htmlString = "<i class='far fa-frown fa-4x'></i>";
            htmlString += "<div class='flow-text'>&nbsp;Nothing to show here.</div>";
            htmlString += "<div class='flow-text'>Add a semester from above.</div>";
        }

        allSemestersList.innerHTML = htmlString;

        // Initialize updated semester list.
        let collapsible = document.querySelectorAll('.collapsible');
        M.Collapsible.init(collapsible, {});
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Semesters could not be populated.');
        else
            dialog.showErrorBox('Error!', "An unknown error occurred while loading semesters.");
    }
}

function addSemester() {
    // Read existing data from datastore file and store as JSON object in RAM.
    try {
        // TODO: Add validations for season and year.
        let season = seasonSelection.value;
        let year = yearText.value;
        let existingSemesters;
        let newSemester;
        let semesterExists = false;

        existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, 'utf-8'));

        // Check if the semester already exists or not.
        for (let yearObj of existingSemesters) {
            let semestersOfYear = yearObj.semesters;

            for (let semester of semestersOfYear) {
                if (yearObj.year === year && semester.season === season) {
                    dialog.showErrorBox('Error!', semester.season + " " + yearObj.year + " semester already exists.");

                    semesterExists = true;
                    break;
                }
            }

            if (semesterExists)
                break;
        }

        if (!semesterExists) {
            // Add new semester.
            let month;

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

            // Find the ID of the previous semester.
            let previousMaxId = 0;

            if (existingSemesters.length > 0) {
                // When the existing semester array is not empty, find max ID.
                for (let yearObj of existingSemesters) {
                    let semestersOfYear = yearObj.semesters;

                    for (let semester of semestersOfYear) {
                        if (semester.id > previousMaxId)
                            previousMaxId = semester.id;
                    }
                }
            }

            newSemester = {
                id: previousMaxId + 1,
                season: season,
                month: month,
            };

            // Check if the user entered year exists in our existing semesters.
            let yearExists = existingSemesters.find((existingYear) => {
                return existingYear.year === year;
            });

            // Add new semester to existing semesters object in RAM.
            if (yearExists) {
                yearExists.semesters.push(newSemester); // Add only semester to existing year object.
            } else {
                // Year does not exists, so create a new year object.
                let newYearObj = {
                    year: year,
                    semesters: [newSemester],
                };
                existingSemesters.push(newYearObj); // Add the new year and semester.
            }

            // Sort semesters by year, most recent at the top.
            existingSemesters.sort(function (current, next) {
                return next.year - current.year;
            });

            // Sort semesters by month.
            existingSemesters.forEach((yearObj) => {
                yearObj.semesters.sort(function (current, next) {
                    return current.month - next.month;
                });
            });

            try {
                // Write all the semesters back to datastore file.
                fs.writeFileSync(semestersDataFile, JSON.stringify(existingSemesters, null, 4));

                let options = {
                    type: 'info',
                    buttons: ['Ok'],
                    message: "Success!",
                    detail: newSemester.season + " " + year + " added successfully."
                };

                let currentWindow = remote.getCurrentWindow();
                dialog.showMessageBoxSync(currentWindow, options);
            } catch (error) {
                dialog.showErrorBox('Unknown Error!', "Error while saving the semester.");
            }
        }

        // Clear add semester form.
        seasonSelection.selectedIndex = 0;
        M.FormSelect.init(seasonSelection, {});
        yearText.value = "";
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing semesters could not be read.');
        else
            dialog.showErrorBox('Unknown Error!', "Error while saving the semester.");
    }

    listExistingSemesters();
}

function getCourseCountForSemester(year, season) {
    let courseCount = 0;

    try {
        let allCourses = JSON.parse(fs.readFileSync(coursesDataFile, 'utf-8'));

        for (let course of allCourses) {
            if (course.year === year && course.season === season) {
                courseCount++;
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('Course file not found.', 'Course count will not be populated.');
        else
            dialog.showErrorBox('Unknown Error!', "An unknown error occurred while reading course data file.");
    }

    return courseCount;
}

addSemesterButton.addEventListener("click", addSemester);

document.addEventListener('DOMContentLoaded', initializePage);