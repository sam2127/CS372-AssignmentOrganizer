const { ipcRenderer } = require('electron');

const semester = document.getElementById('semesterIcon');
const course = document.getElementById('courseIcon');
const assignment = document.getElementById('assignmentIcon');
const settings = document.getElementById('settingsIcon');

semester.addEventListener('click', () => {
    ipcRenderer.send('semester-clicked');
});

course.addEventListener('click', () => {
    ipcRenderer.send('course-clicked');
});

assignment.addEventListener('click', () => {
    ipcRenderer.send('assignment-clicked');
});

settings.addEventListener('click', () => {
    ipcRenderer.send('setting-clicked');
});