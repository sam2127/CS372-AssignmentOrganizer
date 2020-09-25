const { ipcRenderer } = require('electron');

const semester = document.getElementById('semesterIcon');
const course = document.getElementById('courseIcon');
const assignment = document.getElementById('assignmentIcon');


//makes call to main to open window
semester.addEventListener('click', () => {
    ipcRenderer.send('openSecondWindow', "semester.html");

});

course.addEventListener('click', () => {
    ipcRenderer.send('openSecondWindow', "course.html");
});

assignment.addEventListener('click', () => {
    ipcRenderer.send('openSecondWindow', 'assignment.html');
});