const { remote } = require('electron');
const dialog = remote.dialog;
const fs = require("fs");
const path = require("path");

const semestersCount = document.getElementById('semestersCount');
const coursesCount = document.getElementById('coursesCount');
const assignmentsCount = document.getElementById('assignmentsCount');
const semestersCard = document.getElementById('semestersCard');
const coursesCard = document.getElementById('coursesCard');
const assignmentsCard = document.getElementById('assignmentsCard');
const settingsCard = document.getElementById('settingsCard');

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
        let settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
        semestersDataFile = path.join(settings.configRootFolder, settings.semestersDataFile);
        coursesDataFile = path.join(settings.configRootFolder, settings.coursesDataFile);
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
        let yearObjects = JSON.parse(fs.readFileSync(semestersDataFile, "utf-8"));

        let count = 0;

        yearObjects.forEach(year => {
            count += year.semesters.length;
        });

        semestersCount.innerHTML = count;
    } catch (error) {
        dialog.showErrorBox('Error!', "An error occurred while fetching semesters count.");
    }
}

function getCoursesCount() {
    try {
        let courses = JSON.parse(fs.readFileSync(coursesDataFile, 'utf-8'));

        coursesCount.innerHTML = courses.length;
    } catch (error) {
        dialog.showErrorBox('Error!', "An error occurred while fetching courses count.");
    }
}

function getAssignmentsCount() {
    try {
        let assignments = JSON.parse(fs.readFileSync(assignmentsDataFile, 'utf-8'));

        assignmentsCount.innerHTML = assignments.length;
    } catch (error) {
        dialog.showErrorBox('Error!', "An error occurred while fetching assignments count.");
    }
}

semestersCard.addEventListener('click', function (event) {
    window.location.href = "./semester.html";
});

coursesCard.addEventListener('click', function (event) {
    window.location.href = "./course.html";
});

assignmentsCard.addEventListener('click', function (event) {
    window.location.href = "./assignment.html";
});

settingsCard.addEventListener('click', function (event) {
    window.location.href = "./setting.html";
});

document.addEventListener('DOMContentLoaded', initializePage);