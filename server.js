// For easier server coding.
var express = require("express");
// For parsing JSON.
var bodyParser = require("body-parser");
// For validating client POST content.
var validator = require("validator");
// Create MongoDB objects.
var MongoClient = require("mongodb").MongoClient;
var format = require("util").format;
// Create Express app.
var app = express();

// Start MongoDB server.
var mongoURI = (process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || "mongodb://localhost/comp20ass03mapserver");
var db = MongoClient.connect(mongoURI, function(err, dbConnection) {
	db = dbConnection;
});

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
	var input = req.body;
	if(!validator.isAlphanumeric(input.login)
		|| !validator.isFloat(input.lat)
		|| !validator.isFloat(input.lng))
	{
		res.status(400);
		res.json({"error":"Whoops, something is wrong with your data!"});
	}
	else
	{
		// Grab current time.

		// THIS MIGHT BE GRABBING WRONG TIME,
		// DOUBLE CHECK LATER.

		t = new Date();
		t = new Date(t.getTime());
		t = t.toJSON();

		// Prepare new data for insertion
		// into database (upsert).
		var newDoc1 = {login: input.login, lat: input.lat, lng: input.lng, created_at: t};

		db.collection("locations", function(err,coll){
//			coll.remove({},{},function(){
				coll.update({login: {$eq: input.login}}, newDoc1, {upsert: true, w: 1}, function(err,result){
					coll.find().toArray(function(err,docs){
						res.status(200);
						res.json(docs);
					});
				});
//			});
		});

		//{"_id":"54e95ff46cca2a030048cf14","login":"mchow","lat":40.67693,"lng":117.23193,"created_at":"2015-02-22T05:12:24.596Z"}

	}
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