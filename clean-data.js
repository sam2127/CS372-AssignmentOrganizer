const fs = require("fs");
const path = require("path");

const semesters = [];
const courses = [];
const assignments = [];
const settings = {};
const settingsFile = path.join(__dirname, "./src/.config/settings.json");

let failure = false;
let configuration;

// Run cleanAll().
cleanAll();

function cleanAll() {

    readConfiguration();

    // When settings are not empty and we have values for all config files and folders.
    if (Object.keys(configuration).length != 0) {
        cleanSemesters();
        cleanCourses();
        cleanAssignments();
        cleanSettings();

        if (failure) {
            console.error("There was a failure during clean operation. Clean manually before commit/push.");
        } else {
            console.log("Success! Project is clean now. You can proceed with commit/push.");
        }
    } else {
        console.log("Project is in clean state already. Nothing to do.");
    }

}

function readConfiguration() {
    try {
        // Read configuration from settings file.
        configuration = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
    } catch (error) {
        console.error('Error!', "Error reading settings file.");
    }
}

function cleanSemesters() {

    try {
        let semestersFile = path.join(configuration.configRootFolder, configuration.semestersDataFile);
        fs.writeFileSync(semestersFile, JSON.stringify(semesters, null, 4));
        console.log("Success! Semesters file is empty now.");
    } catch (error) {
        console.error("Cleaning of semesters data failed.");
        failure = true;
    }
}

function cleanCourses() {

    try {
        let coursesFile = path.join(configuration.configRootFolder, configuration.coursesDataFile);
        fs.writeFileSync(coursesFile, JSON.stringify(courses, null, 4));
        console.log("Success! Courses file is empty now.");
    } catch (error) {
        console.error("Cleaning of courses data failed.");
        failure = true;
    }
}

function cleanAssignments() {

    try {
        let assignmentsFile = path.join(configuration.configRootFolder, configuration.assignmentsDataFile);
        fs.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 4));
        console.log("Success! Assignments file is empty now.");
    } catch (error) {
        console.error("Cleaning of assignments data failed.");
        failure = true;
    }

    // Delete all assignments.
    try {
        fs.rmdirSync(configuration.assignmentRootFolder, { recursive: true });
        console.log("Success! Assignment files and directories deleted.");
    } catch (error) {
        console.error(error);
        console.error("FAIL!!! Cleaning of assignments files and directories failed. Check you have node v12 or higher installed.")
        failure = true;
    }
}

function cleanSettings() {

    try {
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 4));
        console.log("Success! Settings file is empty now.");
    } catch (error) {
        console.error("Cleaning of settings failed.");
        failure = true;
    }
}
