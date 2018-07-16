// found at https://steinbrennergit.github.io/welp-project/
// repo at https://github.com/steinbrennergit/welp-project/

// Initialize Firebase - replace with your own config object!
firebase.initializeApp(fbConfig);
const db = firebase.database();
/*******************************/

/*
Process (what happens when a user Submits)
    - Get input of a dollar amount from field (input validation required)
    - Get input of a city name from field
    - Maybe get input of a maximum distance from a third field?
        * Other options; cuisine choices, etc. (can circle back to these features if we get everything 100%)
    - Pass input to Zomato API and retrieve eligible restaurants
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