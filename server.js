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
	if(!err)
	{
		db = dbConnection;
	}
	else
	{
		// Failed to connect to
		// database server.
	}
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
		var newDoc = {login: input.login, lat: input.lat, lng: input.lng, created_at: t};
		// Open the "locations" collection.
		db.collection("locations", function(err,coll){
			if(!err)
			{
				// Empty the collection.
	//			coll.remove({},{},function(){
					// Perform upsert on data provided by user.
					coll.update({login: {$eq: input.login}}, newDoc, {upsert: true, w: 1}, function(err,result){
						if(!err)
						{
							// Get entire collection and return to client.
							coll.find().toArray(function(err,docs){
								if(!err)
								{
									res.status(200);
									res.json(docs);
								}
								else
								{
									res.status(500);
									res.send("Database server error: Failed to query collection.");
								}
							});
						}
						else
						{
							res.status(500);
							res.send("Database server error: Failed to update document.");
						}
					});
	//			});
			}
			else
			{
				res.status(500);
				res.send("Database server error: Collection not found.");
			}
		});
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