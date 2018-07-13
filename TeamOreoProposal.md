# Project title: Welp

# Team members (Team Oreo)
* Christopher Steinbrenner
* Jeffrey Snowden
* Jimmy Bradley

# Project description
* Based on user input for location and dollar amount, find restaurants within an acceptable distance that the user can afford.

* Display those results in list form and on a dynamic map.

* Input validation to ensure we have received valid input from the user, and elegant handling of invalid inputs (i.e. city does not exist)

# Basic sketch
* http://framebox.org/AgQwa

# APIs to be used
* Bing Maps
* Zomato

# Breakdown
* Collect user input from the input form (city, dollar amount)

* Request a collection of restaurants from Zomato for the location provided

* Filter that collection based on the "average cost for two," only keeping the restaurants which the user can afford.

* Request location and distance data from Bing Maps for each restaurant, and populate a dynamic map with pushpins representing those locations.

* Display the results in a list below the input fields.

* Allow the user to input a new location and be presented with new data.