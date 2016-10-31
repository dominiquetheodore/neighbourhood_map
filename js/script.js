/* Set the width of the side navigation to 250px */
function openNav() {
	document.getElementById("mySidenav").style.width = "300px";
	// collapse nav after 20 seconds inactivity    
	closeFourSquareNav();
}

/* Set the width of the side navigation to 0 */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

function openFourSquareNav() {
	document.getElementById("myRightnav").style.width = "300px";
	// collapse nav after 20 seconds inactivity
	setTimeout(function(){ closeNav(); }, 20000);
    closeNav();
}

function closeFourSquareNav() {
	document.getElementById("myRightnav").style.width = "0";
}
