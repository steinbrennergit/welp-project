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

/***********JEFF'S CODE*******************/
// var config = {
//     apiKey: "AIzaSyATWzOdMstZlUPbb9P7XJgg60zt0e6-ppQ",
//     authDomain: "stuffandjunk-13b4b.firebaseapp.com",
//     databaseURL: "https://stuffandjunk-13b4b.firebaseio.com",
//     projectId: "stuffandjunk-13b4b",
//     storageBucket: "stuffandjunk-13b4b.appspot.com",
//     messagingSenderId: "842764135029"
// };
// var app = firebase.initializeApp(config);
//
// var ref = firebase.database().ref("bidderData")
// ref.once("value")
//     .then(function (snapshot) {
//         var highBidder = snapshot.child("highBidder").val(); // {first:"Ada",last:"Lovelace"}\
//         var highPrice = snapshot.child("highPrice").val();
//         snapshot.child().push({"key":"ipVal"})
//        // $.getJSON("https://api.ipify.org?format=jsonp&callback=?",
//            // function (json) {
//                // console.log("My public IP address is: ", json.ip);
//             //}
//         //);
//     });
/***********JEFF'S CODE*******************/



/***********PRODUCTION CODE***************/
firebase.initializeApp(fbConfig);
const db = firebase.database();
/*****************************************/
// Constant HTML references
const $money = $("#money");
const $city = $("#city");
const $zip = $("#zip");
const $map = $("#map-div");
const $results = $("#results");

// Global vars
var userCity = null;
var restaurantList = [];

$("#submit-button").on("click", function () {
    event.preventDefault() // Prevents page from reloading on submit

    let money = $money.val().trim();
    let city = $city.val().trim();
    let zip = $zip.val().trim();

    getRestaurants(money, city, zip);
});

function getRestaurants(money, city, zip) {
    let maxDist = 20;


    var firstQueryURL = "https://developers.zomato.com/api/v2.1/cities?apikey=284d8bf6da6b7fc3efc07100c1246454"
    // Parameters:
    // q (city)

    $.ajax({
        url: firstQueryURL,
        method: 'GET'
    }).then(function (res) {
        // Res should contain an object for the city, with an id

        var id = null; // Set this to the id provided by the object (NOT null)

        var secondQueryURL = "https://developers.zomato.com/api/v2.1/search?apikey=284d8bf6da6b7fc3efc07100c1246454" // Add parameters to this URL
        // Parameters:
        // entity-id
        // entity-type
        // sort
        // order

        $.ajax({
            url: secondQueryURL,
            method: 'GET'
        }).then(function (res) {
            // Res should contain an object containing up to 20 restaurant objects, sorted by cost
            // If we want more than 20, we would call again with an offset - don't worry about this right now
            var filteredRestaurants = [];
            // Iterating through restaurant objects, push all restaurant objects where the average cost for two / 2 < money
            // Loop logic goes here***
            for (let i = 0; i < 20; i++) {
                var restaurant = res.restaurants[i].restaurant;
                var costForOne = restaurant.average_cost_for_two / 2;
                if (costForOne < money) {
                    filteredRestaurants.push(restaurant);
                }
            }

            // After this, assign the result to the global variable restaurantList
            restaurantList = filteredRestaurants;
            generateMap();
        });
    });
}

function generateList() {
    // For each restaurant object (LOOP)

    // Create an HTML element (div)
    // Append to the div:
    // * Restaurant name - Link to the restaurant website?
    // * Restaurant average cost (cost for 2 divided by 2)
    // * Restaurant address
    // * If possible - using a Bing Maps method/function, the distance between restaurant and provided zip code
    // Append each div to our container for results in HTML
}

function generateMap() {

    // Create a map object using Bing Maps API

    // For each restaurant object in restaurantList, create a pushpin on the map with the address

    // Once complete, append that map to HTML

}



