// For easier server coding.
var express = require("express");
// For parsing JSON.
var bodyParser = require("body-parser");
// For validating client POST content.
var validator = require("validator");
// Create Express app.
var app = express();

// Set the port for the server to
// listen on.
app.set("port", (process.env.PORT || 5000));
// Declare JSON sub-tool of bodyParser package.
app.use(bodyParser.json());
// For parsing application/x-www-form-urlencoded.
app.use(bodyParser.urlencoded({extended: true}));

// Handle POST requests to "/sendLocation".
// Respond with...
app.post("/sendLocation",function(req,res){
	// Validate input.
	if(true)
	{

	}
	res.send({"error":"Whoops, something is wrong with your data!"});
	res.status(200);
	res.send();

});
// Handle GET requests to "/location.json".
// Respond with...
app.get("/location.json",function(req,res){
	res.status(200);
	res.send();

});
// Handle GET requests to "/".
// Display an HTML page with a
// running list of calls to this API.
app.get("/",function(req,res){
	res.status(200);
	res.send("Test.");
});

// Listen for HTTP requests.
app.listen(app.get("port"));