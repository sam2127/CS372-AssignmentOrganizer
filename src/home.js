// Using remote module to do inter-process communication (IPC) between the renderer process (web page) and the main process.
const { remote } = require('electron');
// Display native system dialogs for opening and saving files, alerting, etc.
const dialog = remote.dialog;
// Node.js file system module allows to read/write the files on computer system.
const fs = require("fs");
// Node.js path module allows joining the specified path segments into one path.
const path = require("path");

// Accessing the different HTML elements in home.html by their unique id's.
const semestersCount = document.getElementById('semestersCount');
const coursesCount = document.getElementById('coursesCount');
const assignmentsCount = document.getElementById('assignmentsCount');
const semestersCard = document.getElementById('semestersCard');
const coursesCard = document.getElementById('coursesCard');
const assignmentsCard = document.getElementById('assignmentsCard');
const settingsCard = document.getElementById('settingsCard');

// Storing the path of settings.json file in the javascript object named settingsFile.
const settingsFile = path.join(__dirname, "./.config/settings.json");

let semestersDataFile;
let coursesDataFile;
let assignmentsDataFile;

function initializePage() {
    readSettings();
    getStatistics();
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
        dialog.showErrorBox('Error!', "Error reading settings file.");
    }
}

function getStatistics() {
    getSemestersCount();
    getCoursesCount();
    getAssignmentsCount();
}

function getSemestersCount() {
    try {
        // Reading the semesters data from semesters.json synchronously using function readFileSync() in the fs module and parsing it as a JSON object.
        let semesters = JSON.parse(fs.readFileSync(semestersDataFile, "utf-8"));

        // Initializing the semester count for Home page. 
        semestersCount.innerHTML = semesters.length;
    } catch (error) {
        dialog.showErrorBox('Error!', "An error occurred while fetching semesters count.");
    }
}

function getCoursesCount() {
    try {
        // Reading the courses data from courses.json synchronously using function readFileSync() in the fs module and parsing it as a JSON object.
        let courses = JSON.parse(fs.readFileSync(coursesDataFile, 'utf-8'));

        // Initializing the course count for Home page.
        coursesCount.innerHTML = courses.length;
    } catch (error) {
        dialog.showErrorBox('Error!', "An error occurred while fetching courses count.");
    }
}

function getAssignmentsCount() {
    try {
        // Reading the assignments data from assignments.json synchronously using function readFileSync() in the fs module and parsing it as a JSON object.
        let assignments = JSON.parse(fs.readFileSync(assignmentsDataFile, 'utf-8'));

        // Initializing the assignment count for Home page.
        assignmentsCount.innerHTML = assignments.length;
    } catch (error) {
        dialog.showErrorBox('Error!', "An error occurred while fetching assignments count.");
    }
}

// Attaching an event handler when a user clicks on Semesters card on the home page.
semestersCard.addEventListener('click', function (event) {
    // Changing the current URL location of the browser to semester.html
    window.location.href = "./semester.html";
});

// Attaching an event handler when a user clicks on Courses card on the home page.
coursesCard.addEventListener('click', function (event) {
    // Changing the current URL location of the browser to course.html
    window.location.href = "./course.html";
});

// Attaching an event handler when a user clicks on Assignments card on the home page.
assignmentsCard.addEventListener('click', function (event) {
    // Changing the current URL location of the browser to assignment.html
    window.location.href = "./assignment.html";
});

// Attaching an event handler when a user clicks on Settings card on the home page.
settingsCard.addEventListener('click', function (event) {
    // Changing the current URL location of the browser to setting.html
    window.location.href = "./setting.html";
});

// Event listener to initialize the page using initializePage() function after the page/document has been loaded. 
document.addEventListener('DOMContentLoaded', initializePage);