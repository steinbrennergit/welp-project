// found at https://steinbrennergit.github.io/welp-project/
// repo at https://github.com/steinbrennergit/welp-project/

// Initialize Firebase - replace with your own config object!
///var fbConfig = {
// apiKey: fbApiKey,
//authDomain: fbAuthDomain,
//databaseURL: fbDatabaseURL,
//projectId: fbProjectId,
//storageBucket: fbStorageBucket,
//messagingSenderId: fbMessagingSenderId
//};
//firebase.initializeApp(fbConfig);
//const db = firebase.database();
/*******************************/

var config = {
    apiKey: "AIzaSyATWzOdMstZlUPbb9P7XJgg60zt0e6-ppQ",
    authDomain: "stuffandjunk-13b4b.firebaseapp.com",
    databaseURL: "https://stuffandjunk-13b4b.firebaseio.com",
    projectId: "stuffandjunk-13b4b",
    storageBucket: "stuffandjunk-13b4b.appspot.com",
    messagingSenderId: "842764135029"
};
var app = firebase.initializeApp(config);

var ref = firebase.database().ref("bidderData")
ref.once("value")
    .then(function (snapshot) {
        var highBidder = snapshot.child("highBidder").val(); // {first:"Ada",last:"Lovelace"}\
        var highPrice = snapshot.child("highPrice").val();
        snapshot.child().push({"key":"ipVal"})
       // $.getJSON("https://api.ipify.org?format=jsonp&callback=?",
           // function (json) {
               // console.log("My public IP address is: ", json.ip);
            //}
        //);
    });


