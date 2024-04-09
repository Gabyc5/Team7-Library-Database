document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('loggedIn') === null) {
        localStorage.setItem('loggedIn', false);
    }
});

const loggedIn = localStorage.getItem('loggedIn');
const memberId = localStorage.getItem('memberId');
const staffId = localStorage.getItem('staffId');
const isAdmin = localStorage.getItem('isAdmin');
const loginButton = document.getElementById('myAccount');

loginButton.addEventListener('click', function(event) {
    console.log('clicking the one button');
    if (loggedIn === 'true') {
        console.log('user is logged in');
        if (loginButton) {
            if(memberId !== null && memberId !== undefined) {
                loginButton.href = '../Dashboard/dashboard.html';
            }
            else if (staffId !== null && staffId !== undefined && isAdmin === 'false') {
                loginButton.href = '../Staff Page/staff.html';
            }
            else if (isAdmin === 'true') {
                loginButton.href = '../admin/admin.html';
            } 
        }
    }
});

