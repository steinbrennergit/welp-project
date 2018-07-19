// found at https://steinbrennergit.github.io/welp-project/
// repo at https://github.com/steinbrennergit/welp-project/

/* USER STORY

Process (what happens when a user Submits)
    - Get input of a dollar amount from field (input validation required)
    - Get input of a city name from field
    - Maybe get input of a maximum distance from a third field?
        * Other options; cuisine choices, etc. (can circle back to these features if we get everything 100%)
    - Pass input to Zomato API and retrieve eligible restaurants
        *** Restaurant requires API key and restaurant ID
        * Inform the user that the city they named is invalid if we get no restaurants/an API error
    - Using the "average cost for two" property from the data returned by Zomato,
        * Filter out restaurants which cost too much
    - Using Bing Maps API, populate a map with pushpins for each of the restaurant locations, sorted by distance
        * How are we calculating that distance if the user is just giving us a city?
        * Potentially - get city AND zip code or address as input, get restaurants from the whole city from Zomato, filter 
            to a particular distance from the user's address or zip code?
    - Populate a scrollable list of these restaurants with their locations and distance (?)
    - Display the map adjacent to the input form


### As written, this process does not require Firebase. We might remove Firebase from the implementation.
### OR, if we get done with the core functionality with time to spare:
    - Using a modal, prompt the user if they want to enter a username to retain their searches
    - If the username/email they enter matches a previous entry in the database, give them their last X searches
        they can pre-select and get those same results back.
    - Store search parameters under that username for them to return to later
*/

/*
TODO:
    - STYLING
    - INPUT VALIDATION (FIX)
    - USER PUSHPIN GRAPHIC (STYLE 37, STYLE 113, STYLE 118)
    - POWERPOINT
*/

/***********PRODUCTION CODE***************/
// Database init and reference
firebase.initializeApp(fbConfig);
const db = firebase.database();

// Constant HTML references to the input fields
const $money = $("#money");
const $city = $("#city-location");
const $zip = $("#zip-location");
const $invalidInput = $("#input-invalid-modal");
const $invalidMsg = $("#invalid-input-msg");

// Global vars
// var numOfRecentSearches = 0; // Used to prevent overflow of recent searches
var isSignedIn = false; // Contain the auth state to determine database actions
var userEmail = ""; // Contain user's email address to sign database entries
var dir = "/"; // Contain user's unique directory within the database

var map; // Global reference to the active map object
var restaurantList = []; // Global array of all restaurant objects returned by Zomato
var pinList = []; // Global array of all pin objects on map
var infobox; // Global reference to the active infobox object

var userLocation = null; // IF GEOLOCATED: BING MAPS LOCATION OBJECT
var userPin = null; // IF GEOLOCATED: BING MAPS PUSHPIN OBJECT

// Search handler with coordinates; if user enables geolocation or provides valid zip code
function searchHandler(coords, money, city, zip, toPush) {
    // Build the Zomato API query URL with coordinates; radius needs work?
    var queryURL = "https://developers.zomato.com/api/v2.1/search?lat=" + coords[0] + "&lon=" + coords[1] + "&sort=cost&order=asc&apikey=" + zomatoAPI;
    console.log(queryURL);
    // Create a user location object using our coordinates
    userLocation = new Microsoft.Maps.Location(coords[0], coords[1]);

    // Create a user pushpin using our user location object
    userPin = new Microsoft.Maps.Pushpin(userLocation, { icon: 'https://msdn.microsoft.com/dynimg/IC856255.jpeg/' });

    // Call Zomato API for restaurant information around the provided coordinates
    $.ajax({
        url: queryURL,
        method: 'GET'
    }).then(function (res) {
        // Res should contain an object containing up to 20 restaurant objects, sorted by cost
        // If we want more than 20, we would call again with an offset - this would be difficult and highly inefficient
        // To broaden our search would require paying for the API key

        // If the user is signed in and we received true in toPush, push to database
        //  -- toPush is true if user provided a new search, false if they selected a past search
        if (isSignedIn && toPush) {
            db.ref(dir).push({ date: moment().format('MM/DD/YYYY, h:mm a'), money, city, zip, userEmail });
        }

        // Create a placeholder array for restaurants filtered by cost
        let filteredRestaurants = []

        // Iterating through restaurant objects (LOOP), push all restaurant objects where the (average cost for two / 2) < money
        for (let i = 0; i < 20; i++) {
            // Restaurants are not contained in an array, but are indexed - if we run out of them before 20, break out of loop
            if (res.restaurants[i] === undefined) {
                break;
            }

            // console.log(res.restaurants[i]);

            // For ease of typing, name the important object path
            let restaurant = res.restaurants[i].restaurant;

            // Calculate cost for one, make the comparison described above
            let costForOne = restaurant.average_cost_for_two / 2;
            if (costForOne <= money && costForOne !== 0) {
                filteredRestaurants.push(restaurant); // Push to array if cost is acceptable
            }
        }

        // Assign the result to the global variable restaurantList
        restaurantList = filteredRestaurants;

        // Call the fns to display this information
        generateMap();
        generateList();

        // Hide the search window
        $("#first-window").addClass("hide");

        // Error catching
    }).catch(function (err) {
        console.log(err); // Log the error

        // If searching by coords broke, try searching by city
        searchHandlerCityOnly(money, city, zip, toPush);
    });
}

// Using our array of restaurant objects, build the map with the Bing Maps API
function generateMap() {

    // For each restaurant object (LOOP)
    for (let i = 0; i < restaurantList.length; i++) {

        // For ease of typing, name the important object path
        var restaurant = restaurantList[i];

        // Get lat and long coords from restaurant object
        var latitude = restaurant.location.latitude;
        var longitude = restaurant.location.longitude;

        // Create a new Bing Maps location object with restaurant coords
        var loc = new Microsoft.Maps.Location(latitude, longitude);

        // Create a new Bing Maps pushpin at that location
        var pin = new Microsoft.Maps.Pushpin(loc);

        // Maintain an array of our pushpins for the ".result" listener
        pinList.push(pin);

        // Dynamically set pin metadata to be retrieved later for infobox display
        pin.metadata = {
            title: restaurant.name,
            description: restaurant.location.address,
            rating: restaurant.user_rating.aggregate_rating // not a property of metadata
        };

        // Push each pin to the map
        map.entities.push(pin);
    };

    // Create a placeholder infobox
    infobox = new Microsoft.Maps.Infobox(centerLoc);

    // Call function to add pin handlers for click, mouseover and mouseout
    addPinHandlers();

    // Set the map to center on the first restaurant, with appropriate zoom, if a user location was not set
    if (userLocation === null) {
        var centerLoc = new Microsoft.Maps.Location(latitude, longitude);
        map.setView({
            mapTypeId: Microsoft.Maps.MapTypeId.road,
            center: centerLoc,
            zoom: 11.5
        });
    } else { // If user location was set, the map should center on the user, and the user should have a pin
        map.entities.push(userPin);

        map.setView({
            center: userLocation,
            zoom: 11.5
        });
    }

    // Show the map
    $("#map-div").removeClass("hide");
}

// Using our array of restaurant objects, generate a list of restaurants to display
function generateList() {
    if (restaurantList.length === 0) { // Check for an empty list of restaurants
        console.log("empty list"); // Somehow, notify user that there are no results
        return;
    }

    // For each restaurant object (LOOP)
    for (let i = 0; i < restaurantList.length; i++) {

        //create a new anchor tag append the restaurant list
        var newAnchor = $("<a>").attr("class", "flex-column align-items-start result");
        newAnchor.attr("href", "#");
        newAnchor.attr("value", i);

        //Create new div to add the data into
        var newDiv = $("<div>").attr("class", "d-flex w-100 justify-content-between");

        //Adds the restaurnaunt name in the drop down
        var newName = $("<h5>").addClass("mb-1", "mb-name");
        newName.text(restaurantList[i].name).css('text-align', 'left').css("padding-right", '20px');

        //Adds the address into the same dropdown box
        var newAddress = $("<p>").addClass("mb-1", "mb-address");
        newAddress.text(restaurantList[i].location.address).css('text-align', 'right').css("padding-left", '20px');

        // Appends the name and address to the new div
        newDiv.append(newName, newAddress);

        // Appends the new div to the new anchor tag
        newAnchor.append(newDiv).css("background-color", 'darkgrey').css("border", '1px solid black');

        // Appends the anchor tag to the column group to display results
        $("#column-group").append(newAnchor);

    }
    $("#column-group").removeClass("hide");
    // Remove hide from new search button
}

// Called to add event handlers to all pins, to appropriately display info boxes
function addPinHandlers() {
    pinList.forEach(function (pin) {

        // On mouse click, show the info box
        Microsoft.Maps.Events.addHandler(pin, 'click', function () {
            hideInfoBox();
            showInfoBox(pin, true);
        });

        // On mouse hover, show the info box
        Microsoft.Maps.Events.addHandler(pin, 'mouseover', function () {
            hideInfoBox();
            showInfoBox(pin, false);
        });

        // When mouse leaves the pushpin, hide the info box
        Microsoft.Maps.Events.addHandler(pin, 'mouseout', function () {
            hideInfoBox();
        });
    });
}

// Called to hide the previous info box before showing a new one
function hideInfoBox() {
    infobox.setOptions({ visible: false });
    infobox.setMap(null);
}

// Called to show an info box at a particular pin; pass a boolean to determine if 
//  the map should be centered (do not center on mouseover)
function showInfoBox(pin, centerMap) {
    // Get the pin location
    let pinLoc = new Microsoft.Maps.Location(pin.geometry.y, pin.geometry.x);

    // Center the map on the pin to focus on
    if (centerMap) {
        map.setView({
            center: pinLoc,
            zoom: 11.5
        });
    }

    // Create the text box (infobox) associated with the push pin
    infobox = new Microsoft.Maps.Infobox(pinLoc, {
        location: pinLoc,
        title: pin.metadata.title,
        description: pin.metadata.description,
        rating: pin.metadata.rating, // need to attach rating to description
        visible: true
    });

    // Associate the infobox with the map
    infobox.setMap(map);

    // If infobox is clicked, center the map as if they clicked the pin
    Microsoft.Maps.Events.addHandler(infobox, 'click', function () {
        map.setView({
            center: pinLoc,
            zoom: 11.5
        });
    });
}

// Called when the user submits their search query
$("#submit-button").on("click", function () {
    event.preventDefault() // Prevents page from reloading on submit

    $("#new-search").removeClass("hide");

    // Get input from input fields
    let money = parseFloat($money.val().trim());

    // console.log(money, typeof money)

    // Make the city input presentable regardless of user's choice of capitalization
    let tempCity = $city.val().trim();
    let city = tempCity.charAt(0).toUpperCase() + tempCity.slice(1).toLowerCase();
    // Does not capitalize every word, if the city has multiple words; consider improving

    let zip = $zip.val().trim();
    // console.log("Zip:", zip);

    if (!validInput(city, zip, money)) {
        return;
    }

    // Initialize map so the geolocation promise can act on it
    map = new Microsoft.Maps.Map("#map-div", { showLocateMeButton: false, showMapTypeSelector: false });

    // Promise to get location if possible
    var getLocation = function () {
        return new Promise(function (resolve, reject) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    }

    // If we can get the user's position via geolocation, then
    getLocation().then((pos) => {
        // Get coords from geolocation response
        let lat = Math.round((pos.coords.latitude + 0.00000001) * 100000) / 100000;
        let lon = Math.round((pos.coords.longitude + 0.00000001) * 100000) / 100000;

        var coords = [lat, lon];
        // console.log("Geolocated");
        // console.log(coords);

        // Get restaurants via geolocation
        searchHandler(coords, money, city, zip, true);

        // Error catch; pass inputs to searchHandler() where the Zomato API is queried for information
    }).catch((err) => {
        // Get coords of zip code from Bing Maps API
        var queryURL = "http://dev.virtualearth.net/REST/v1/Locations?countryRegion=United%20States&postalCode=" + zip + "&key=" + bingAPI;
        // console.log("Query URL:", queryURL);

        $.ajax({ url: queryURL, method: 'GET' }).then(function (res) {
            var coordsRef = res.resourceSets["0"].resources["0"].geocodePoints["0"].coordinates;
            let lat = Math.round((coordsRef[0] + 0.00000001) * 100000) / 100000;
            let lon = Math.round((coordsRef[1] + 0.00000001) * 100000) / 100000;
            var coords = [lat, lon];
            // console.log("Located by zip code");
            // console.log(coords);

            searchHandler(coords, money, city, zip, true);
        }).catch(function (err) {
            console.log("Failed to locate; passing to searchHandlerCityOnly");
            console.log(err);

            searchHandlerCityOnly(money, city, zip, true);
        });
    });
});

// Called when the user attempts to log in
$("#login").on("click", function () {
    event.preventDefault();

    // console.log(isSignedIn);

    // If user is signed in, sign them out (this button can serve both functions)
    if (isSignedIn) {
        firebase.auth().signOut().then(function () {
            window.location.reload(true);
        }).catch(function (error) { console.log(error) });
    } // This is deprecated; current implementation hides the log in button when signed in
    // And hides the log out button when signed out

    // Get email and password from input fields
    let em = $("#email").val().trim();
    let pw = $("#password").val().trim();

    if (!validEmail(em)) {
        return;
    } else if (!validPassword(pw)) {
        return;
    }

    // Attempt to sign the user in
    firebase.auth().signInWithEmailAndPassword(em, pw).then(function () {
        window.location.reload(true);
    }).catch(function (error) {
        // If the user does not exist, sign them up (which will sign them in)
        if (error.code === "auth/user-not-found") {
            firebase.auth().createUserWithEmailAndPassword(em, pw).then(function () {
                window.location.reload(true);
            }).catch(function (error) { console.log(error); });
        }
        // Different catch needed for wrong password, to notify user
    });
});

// Called when the user attempts to log out
$("#logout").on("click", function () {

    // Do nothing if not logged in 
    if (!isSignedIn) {
        return;
    } // This is deprecated; current implementation hides the log in button when signed in
    // And hides the log out button when signed out

    // Log the user out of their account and reload the page
    firebase.auth().signOut().then(function () {
        window.location.reload(true);
    }).catch(function (error) { console.log(error) });
})

// Called when the user requests a new search
// Reload the page (allow caching for speed) to present the user with a fresh search form
$("#new-search").on("click", function () {
    window.location.reload(false);
    // This could be accomplished by using JQuery to manipulate the HTML and "start over"
    // However, that is likely to be even less efficient? and a pain to implement
});

// Called when the user logs in, logs out, or opens the page
firebase.auth().onAuthStateChanged(function (user) {
    // If user is signed in
    if (user) {
        // console.log("signed in");
        $("#data-table").removeClass("hide");

        // Hide the log in button, and show the log out button
        $("#login-modal-button").addClass("hide");
        $("#logout").removeClass("hide");

        // Save a boolean value to indicate the user is signed in
        isSignedIn = true;
        // Save the user's email to use for signing the data sent to database (debugging tool)
        userEmail = user.email;

        // Change the displayed name from "Guest User" to the user's email
        $("#navbarDropdownMenuLink").text(userEmail);

        // Change the database directory to the user's unique identifier
        dir += user.uid;

        // Called when the user performs a search and the data is pushed to database
        db.ref(dir).on("child_added", function (snap) {
            // console.log(dir);
            // console.log(snap.val());

            // Get input values from the database entry
            let d = snap.val().date;
            let c = snap.val().city;
            let z = snap.val().zip;
            let m = snap.val().money.toString();

            // Create a new table row (tr tag); see fn below
            let newRow = createNewRow(c, z, m)

            // Format money string; see fn below
            m = formatMoney(m);
            if (m === false) { console.log("error formatting money"); }

            // Format city string; see fn below
            c = formatCity(c);
            if (c === false) { console.log("error formatting city"); }

            // Populate the new row with td tags holding our data values; see fn below
            populateRow(newRow, d, c, z, m);

            // Prepend the new row to the search list
            $("#past-searches").prepend(newRow);
        });
    } else { // If user is NOT signed in,
        // Change the display under "Recent Searches" to direct users to sign in or sign up
        let msg = $("<h4>").text("Sign in to see your search history!").addClass("text-center vertical-pad")
        $("#table-div").append(msg);
        $("#exampleModalCenterTitle").addClass("hide");
        $("#searches-modal-header").addClass("hide");
        $("#data-table").addClass("hide");

        let button = $("<button>").attr("data-toggle", "modal").attr("data-target", "#exampleModal").addClass("btn-primary col-12").text("Sign In");
        $("#table-div").append(button);
        button.on("click", function () {
            $("#exampleModalCenter").modal("hide");
        });

        let msg2 = $("<h4>").text("If you don't have an account yet, we'll make one for you!").addClass("text-center vertical-pad")
        $("#table-div").append(msg2);
    }
});

// Input validation: email
function validEmail(str) {

    if (str.indexOf("@") === -1) {
        $invalidMsg.text("Please enter a valid email address. A valid email must contain the '@' symbol.");
        $invalidInput.modal("show");
        return false;
    } else if (str.indexOf(".") === -1 || str.indexOf(".com") === -1 && str.indexOf(".net") === -1 && str.indexOf(".edu") === -1) {
        $invalidMsg.text("Please enter a valid email address ending in '.com', '.net' or '.edu' and try again.");
        $invalidInput.modal("show");
        return false;
    }

    return true;
}

// Input validation: password
function validPassword(str) {
    if (str.length < 6) {
        $invalidMsg.text("Passwords must be at least 6 characters long. Please enter a new password.");
        $invalidInput.modal("show");
        return false;
    }
    return true;
}

// Input validation: fields
function validInput(city, zip, money) {
    // console.log("checking inputs")

    // console.log("zip length: " + zip.length);
    // console.log("city: " + city);
    // console.log(money);
    if (zip.length !== 5) {
        $invalidMsg.text("Please enter a 5-digit zip code.");
        $invalidInput.modal("show");
        return false;
    } else if (city === "") {
        $invalidMsg.text("Please fill in all input fields (city, zip, budget).");
        $invalidInput.modal("show");
        return false;
    } else if (money < 5) {
        $invalidMsg.text("Please fill in all input fields (budget has a minimum of 5.00).");
        $invalidInput.modal("show");
        return false;
    }
    return true;
}

// Format money string
function formatMoney(m) {
    let output = false;

    m = m.toString();

    // Format money string
    if (m.indexOf(".") === -1) { // If there is no decimal point
        // Add dollar sign in front, .00 behind
        output = m + ".00";
    } else if (m.indexOf(".") === m.length - 1) { // If the number ends in a decimal point
        // Add dollar sign in front, 00 behind
        output = m + "00";
    } else if (m.indexOf(".") === m.length - 2) { // If the number only has one digit after decimal
        // Add dollar sign in front, 0 behind
        output = m + "0";
    } else { // If there were two or more digits after a decimal
        // Add dollar sign in front, cut off extra characters
        output = m.substr(0, m.indexOf(".") + 3);
    }

    return "$" + output;
}

// Format city string
function formatCity(c) {
    let output = false;

    // Format city string to capitalize first letter
    if (c.indexOf(" ") !== -1) { // If the name of the city includes a space
        // Split the name of the city at each space
        let wordArr = c.split(" ");
        // Empty the city string
        output = "";

        // For each word in the name of the city
        wordArr.forEach(function (word) {
            // Concat the word on to the city string, with the first letter capitalized, and an ending space
            output += word.substr(0, 1) + word.slice(1).toLowerCase() + " ";
        })

        // Cut off any excess whitespace
        output = output.trim();
    } else { // If there are no spaces in the name of the city
        // Capitalize the first letter and lower-case the rest of the name
        output = c.substr(0, 1).toUpperCase() + c.slice(1).toLowerCase();
    }

    return output;
}

// Create a new past-search row
function createNewRow(c, z, m) {
    // Create a new HTML table row with jquery; add data attributes
    let output = $("<tr>").addClass("past-search");
    // Data attributes will be used as input if the user selects a choice
    output.attr("data-city", c);
    output.attr("data-zip", z);
    output.attr("data-money", m);

    // Return that new table row
    return output;
}

// Populate a new past-search row with the search data
function populateRow(row, d, c, z, m) {
    // Create new td tags for each data value
    let date = $("<td>").text(d);
    let city = $("<td>").text(c);
    let zip = $("<td>").text(z);
    let budget = $("<td>").text(m);

    // Append all the new td tags to the new row
    row.append(date, city, zip, budget);
}

// Called when a user clicks on a search result 
$(document).on("click", ".result", function () {
    event.preventDefault(); // Prevent any default behavior

    // Hide old info box
    hideInfoBox();

    // Get the index of the pin we are trying to display an info box for
    let i = $(this).attr("value");

    // Show the info box
    showInfoBox(pinList[i], true);
});

// Called when a user clicks on a recent search to replicate
$(document).on("click", ".past-search", function () {
    // console.log(this);

    // Get input data from the HTML element
    let c = $(this).attr("data-city");
    let z = $(this).attr("data-zip");
    let m = parseInt($(this).attr("data-money"));

    // Hide the modal
    $("#exampleModalCenter").modal("hide");

    // Call searchHandler() with the search data; pass "false" so this is not pushed to database again
    searchHandler(m, c, z, false);
});

// DEPRECATED: Will only be called if somehow there is an error with both geolocation and
//   the Bing Maps API call to find location via zip code, or Zomato doesn't accept query by coords.
// Using user input, get restaurant information from the Zomato API, store in array
function searchHandlerCityOnly(money, city, zip, toPush) {
    console.log("searchHandlerCityOnly has been called, beware");
    // let maxDist = 20; // NOT CURRENTLY IN USE

    // coords is an array of length 2; latitude and longitude

    // First query URL to query Zomato for the city provided by user input
    var firstQueryURL = "https://developers.zomato.com/api/v2.1/cities?q=" + city + "&apikey=284d8bf6da6b7fc3efc07100c1246454";

    // AJAX call to Zomato for city information
    $.ajax({
        url: firstQueryURL,
        method: 'GET'
    }).then(function (res) {
        // res should contain an object, representing the city, with a unique identifier

        var id = res.location_suggestions["0"].id; // assign the city identifier to variable id

        // If the city is not found, notify the user that their search failed
        if (id === undefined) {
            console.log("City not found; return (notify user)");
            return;
        }

        // If the user is signed in and this function was called with TRUE in toPush, 
        //  push this search to the database to be retrieved later.
        if (isSignedIn && toPush) {
            db.ref(dir).push({ date: moment().format('MM/DD/YYYY, h:mm a'), money, city, zip, userEmail });
        }

        // Build the nested query URL to search for restaurants within the city
        var secondQueryURL = "https://developers.zomato.com/api/v2.1/search?apikey=284d8bf6da6b7fc3efc07100c1246454&entity_type=city&sort=cost&order=asc&entity_id=" + id // Add parameters to this URL

        // AJAX call to Zomato for restaurant information within city
        $.ajax({
            url: secondQueryURL,
            method: 'GET'
        }).then(function (res) {
            // Res should contain an object containing up to 20 restaurant objects, sorted by cost
            // If we want more than 20, we would call again with an offset - this would be difficult and highly inefficient
            // To broaden our search would require paying for the API key

            // Create a placeholder array for restaurants filtered by cost
            let filteredRestaurants = []

            // Iterating through restaurant objects (LOOP), push all restaurant objects where the (average cost for two / 2) < money
            for (let i = 0; i < 20; i++) {
                // Restaurants are not contained in an array, but are indexed - if we run out of them before 20, break out of loop
                if (res.restaurants[i] === undefined) {
                    break;
                }

                // For ease of typing, name the important object path
                let restaurant = res.restaurants[i].restaurant;

                // Calculate cost for one, make the comparison described above
                let costForOne = restaurant.average_cost_for_two / 2;
                if (costForOne <= money && costForOne !== 0) {
                    filteredRestaurants.push(restaurant); // Push to array if cost is acceptable
                }
            }

            // Assign the result to the global variable restaurantList
            restaurantList = filteredRestaurants;

            // Call the fns to display this information
            generateMap();
            generateList();

            // Hide the search window
            $("#first-window").addClass("hide");
        });
    });
}