const fs = require("fs");
const path = require("path");

const semesters = [];
const courses = [];
const assignments = [];
const settings = {};
let failure = false;

cleanAll();

function cleanAll() {
    cleanSemesters();
    cleanCourses();
    cleanAssignments();
    cleanSettings();

    if (failure) {
        console.log("There was a failure during clean operation. Clean manually before commit/push.");
    } else {
        console.log("Success! Project is clean now. You can proceed with commit/push.");
    }
}

function cleanSemesters() {
    
    try {
        let semestersFile = path.join(__dirname, "./src/.config/semesters.json");
        fs.writeFileSync(semestersFile, JSON.stringify(semesters, null, 4));
        console.log("Success! Semesters file is empty now.");
    } catch (error) {
        console.log("Cleaning of semesters data failed.");
        failure = true;
    }
}

function cleanCourses() {
    
    try {
        let coursesFile = path.join(__dirname, "./src/.config/courses.json");
        fs.writeFileSync(coursesFile, JSON.stringify(courses, null, 4));
        console.log("Success! Courses file is empty now.");
    } catch (error) {
        console.log("Cleaning of courses data failed.");
        failure = true;
    }
}

function cleanAssignments() {
    
    try {
        let assignmentsFile = path.join(__dirname, "./src/.config/assignments.json");
        fs.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 4));
        console.log("Success! Assignments file is empty now.");
    } catch (error) {
        console.log("Cleaning of assignments data failed.");
        failure = true;
    }

    try {
        fs.rmdirSync(path.join(__dirname, "./assignments"), { recursive: true });
        console.log("Success! Assignment files and directories deleted.");
    } catch (error) {
        console.log(error);
        console.log("FAIL!!! Cleaning of assignments files and directories failed. Check you have node v12 or higher installed.")
        failure = true;
    }
}

function cleanSettings() {
    
    try {
        let settingsFile = path.join(__dirname, "./src/.config/settings.json");
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
        console.log("Success! Settings file is empty now.");
    } catch (error) {
        console.log("Cleaning of settings failed.");
        failure = true;
    }
}