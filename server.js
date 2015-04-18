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

// Declare location of static files.
app.use(express.static(__dirname + "/public"));

// Start MongoDB server.
var mongoURI = (process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || "mongodb://localhost/comp20ass03mapserver");
var db = MongoClient.connect(mongoURI, function(err, dbConnection) {
	if(err === null)
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
		db.collection("locations", function(err1,coll){
			if(err1 === null)
			{
				console.log("collection opened in POST.");
				// Empty the collection.
	//			coll.remove({},{},function(){
					// Perform upsert on data provided by user.
					coll.update({login: {$eq: input.login}}, newDoc, {upsert: true, w: 1}, function(err2,result){
						if(err2 === null)
						{
							// Get entire collection and return to client.
							coll.find().toArray(function(err3,docs){
								if(err3 === null)
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
	var input = req.body;
	
	// FIGURE OUT HOW TO SEND PARAMETERS WITH GET REQUEST.

	console.log(input);


/*
	if(!validator.isAlphanumeric(input.login))
	{
		res.status(400);
		res.json({});
	}
	else
	{*/
		db.collection("locations", function(err1,coll){
			if(err1 === null)
			{
				console.log("collection opened in GET /location.json.");

				coll.find({login: {$eq: input.login}}).toArray(function(err2,docs){
					if(err2 === null)
					{
						if(docs.length != 0)
						{
							res.status(200);
							res.send(docs[0]);
						}
						else
						{
							res.status(200);
							res.json({});
						}
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
				res.send("Database server error: Collection not found.");
			}
		});
//	}
});
// Handle GET requests to "/".
// Display an HTML page with a
// running list of calls to this API.
app.get("/",function(req,res){
	db.collection("locations", function(err1,coll){
		if(err1 === null)
		{
			console.log("collection opened in GET /.");
			console.log(err1);

			coll.find({},{sort: [["created_at","ascending"]]}).toArray(function(err2,docs){
				if(err2 === null)
				{
					// Output sorted database
					// entries to HTML page.
					htmlContent = "<!DOCTYPE html><html><head>";
					htmlContent += "<link rel='stylesheet' type='text/css' href='css/style.css'/>";
					htmlContent += "<title>Log</title>";
					htmlContent += "</head><body>";
					htmlContent += "<h1>Andrew Schneer Database Log:</h1>";
					for(var i = 0; i < docs.length; i++)
					{	htmlContent += "<p>";
						htmlContent += String(docs[i].login);
						htmlContent += " checked in at ";
						htmlContent += String(docs[i].lat);
						htmlContent += ", ";
						htmlContent += String(docs[i].lng);
						htmlContent += " on ";
						htmlContent += String(docs[i].created_at);
						htmlContent += "</p>";
					}
					htmlContent += "</body></html>";
					res.status(200);
					res.send(htmlContent);
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
			console.log(err1);
			res.status(500);
			res.send("Database server error: Collection not found***.");
		}
	});
});

// Listen for HTTP requests.
app.listen(app.get("port"));