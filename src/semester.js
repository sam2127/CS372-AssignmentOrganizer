const remote = require("electron").remote;
const dialog = remote.dialog;
const fs = require("fs");
const path = require("path");

const seasonSelection = document.getElementById("seasonSelection");
const yearText = document.getElementById("year");
const addButton = document.getElementById("addSemesterButton");
const allSemestersList = document.getElementById("allSemestersList");

const settingsFile = path.join(__dirname, "./.config/settings.json");

let semestersDataFile;

readSettings();
loadSemesterList();

function readSettings() {
    let settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
    semestersDataFile = path.join(
        settings.configRootFolder,
        settings.semestersDataFile
    );
}

function loadSemesterList() {
    try {
        let existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, 'utf-8'));

        let htmlString = "<table>";

        existingSemesters.forEach((yearObj) => {
            htmlString += "<tr><td>&nbsp;</td></tr>";
            htmlString += "<tr><td>" + yearObj.year + "</td></tr>";

            yearObj.semesters.forEach((semester) => {
                htmlString +=
                    "<tr><td>" + semester.season + " " + yearObj.year + "</td></tr>";
            });
        });

        htmlString += "</table>";

        allSemestersList.innerHTML = htmlString;

    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Semesters could not be populated.');
        else
            dialog.showErrorBox('Error!', "An unknown error occured." + error);
    }
}

addButton.addEventListener("click", (evt) => {
    let season = seasonSelection.value;
    let year = yearText.value;
    let existingSemesters;
    let newSemester;
    let semesterExists = false;

    // Read existing data from datastore file and store as JSON object in RAM.
    try {
        existingSemesters = JSON.parse(fs.readFileSync(semestersDataFile, 'utf-8'));

        // Check if the semester already exists or not.
        existingSemesters.forEach((yearObj) => {
            yearObj.semesters.forEach((semester) => {
                if (yearObj.year === year && semester.season === season) {
                    dialog.showErrorBox('Error!', semester.season + " " + yearObj.year + " semester already exists.");
                    semesterExists = true;
                }
            });
        });

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

            newSemester = {
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
            existingSemesters.sort(function(current, next) {
                return next.year - current.year;
            });

            // Sort semesters by month.
            existingSemesters.forEach((yearObj) => {
                yearObj.semesters.sort(function(current, next) {
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

                const notification = {
                    title: "Assignment Organizer",
                    body: newSemester.season + " " + year + " added successfully.",
                };

                const myNotification = new Notification(
                    notification.title,
                    notification
                );
            } catch (error) {
                dialog.showErrorBox('Error while saving the semester!', 'Unknown error.');
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT')
            dialog.showErrorBox('File not found.', 'Existing semesters could not be read.');
        else
            dialog.showErrorBox('Error!', 'Unknown error while reading semester data file.');
    }

    loadSemesterList();
});