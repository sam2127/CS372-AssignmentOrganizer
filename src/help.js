// let tabs = document.querySelectorAll('.tabs');
// M.Tabs.init(tabs, {});

// window.onscroll = function() { myFunction() };

// var navbar = document.getElementById("navigationMenu");
// var sticky = navbar.offsetTop;

// function myFunction() {
//     if (window.pageYOffset >= sticky) {
//         navbar.classList.add("sticky")
//     } else {
//         navbar.classList.remove("sticky");
//     }
// }

document.addEventListener("DOMContentLoaded", function () {
    var elems = document.querySelectorAll(".collapsible");
    var instances = M.Collapsible.init(elems, {});
});

// function openTopicPage(link) {
//     // document.getElementById("content").load(link);
//     document.getElementById("content").innerHTML =
//         '<object type="text/html" data="' + link + '"></object>';
// }
