let tabs = document.querySelectorAll('.tabs');
M.Tabs.init(tabs, {});

window.onscroll = function() { myFunction() };

var navbar = document.getElementById("navigationMenu");
var sticky = navbar.offsetTop;

function myFunction() {
    if (window.pageYOffset >= sticky) {
        navbar.classList.add("sticky")
    } else {
        navbar.classList.remove("sticky");
    }
}