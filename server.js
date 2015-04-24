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

// Enable cross-origin-resource-sharing (CORS).
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// Handle POST requests to "/sendLocation".
// Respond with...
app.post("/sendLocation",function(req,res){
	// Grab post request body.
	var input = req.body;
	// Make sure lat and lng values
	// are stored as floats, and login
	// is a string.
	input.login = String(input.login);
	input.lat = parseFloat(input.lat);
	input.lng = parseFloat(input.lng);
	// Validate input.
	if(!validator.isAlphanumeric(input.login)
		|| !validator.isFloat(input.lat)
		|| !validator.isFloat(input.lng))
	{
		res.set("Content-Type","text/html");
		res.status(400);
		res.json({"error":"Whoops, something is wrong with your data!"});
	}
	else
	{
		// Grab current time.
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
				// Perform upsert on data provided by user.
				coll.update({login: {$eq: input.login}}, newDoc, {upsert: true, w: 1}, function(err2,result){
					if(err2 === null)
					{
						// Get entire collection and return to client.
						coll.find().toArray(function(err3,docs){
							if(err3 === null)
							{
								res.set("Content-Type","text/html");
								res.status(200);
								res.json(docs);
							}
							else
							{
								res.set("Content-Type","text/html");
								res.status(500);
								res.send("Database server error: Failed to query collection.");
							}
						});
					}
					else
					{
						res.set("Content-Type","text/html");
						res.status(500);
						res.send("Database server error: Failed to update document.");
					}
				});
			}
			else
			{
				res.set("Content-Type","text/html");
				res.status(500);
				res.send("Database server error: Collection not found.");
			}
		});
	}
});
// Handle GET requests to "/location.json".
// Respond with...
app.get("/location.json",function(req,res){
	//Grab route query parameters.
	var input = req.query;
	// Validate input.
	if(!validator.isAlphanumeric(input.login))
	{
		res.set("Content-Type","text/html");
		res.status(400);
		res.json({});
	}
	else
	{
		db.collection("locations", function(err1,coll){
			if(err1 === null)
			{
				coll.find({login: {$eq: input.login}}).toArray(function(err2,docs){
					if(err2 === null)
					{
						if(docs.length != 0)
						{
							var doc = docs[0];
							// Check if record is empty.
							if(!(doc._id === undefined)
								&& !(doc.lat === undefined)
								&& !(doc.lng === undefined)
								&& !(doc.created_at === undefined))
							{
								res.set("Content-Type","text/html");
								res.status(200);
								res.send(docs[0]);
							}
							else
							{
								res.set("Content-Type","text/html");
								res.status(200);
								res.json({});
							}
						}
						else
						{
							res.set("Content-Type","text/html");
							res.status(200);
							res.json({});
						}
					}
					else
					{
						res.set("Content-Type","text/html");
						res.status(500);
						res.send("Database server error: Failed to query collection.");
					}
				});
			}
			else
			{
				res.set("Content-Type","text/html");
				res.status(500);
				res.send("Database server error: Collection not found.");
			}
		});
	}
});
// Handle GET requests to "/".
// Display an HTML page with a
// running list of calls to this API.
app.get("/",function(req,res){
	db.collection("locations", function(err1,coll){
		if(err1 === null)
		{
			coll.find({},{sort: [["created_at","descending"]]}).toArray(function(err2,docs){
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
					res.set("Content-Type","text/html");
					res.status(200);
					res.send(htmlContent);
				}
				else
				{
					res.set("Content-Type","text/html");
					res.status(500);
					res.send("Database server error: Failed to query collection.");
				}
			});
		}
		else
		{
			res.set("Content-Type","text/html");
			res.status(500);
			res.send("Database server error: Collection not found***.");
		}
	});
});

// Route to clear database.
app.get("/dbclear",function(req,res){
	//Grab route query parameters.
	var input = req.query;
	if(input.pswd === "kirsch")
	{
		db.collection("locations", function(err1,coll){
			if(err1 === null)
			{
				coll.remove({},{},function(err2,arg2){
					if(err2 === null)
					{
						res.set("Content-Type","text/html");
						res.status(200);
						res.send("Success: Database cleared.");
					}
					else
					{
						res.set("Content-Type","text/html");
						res.status(500);
						res.send("Failure: Couldn't remove from collection.");
					}
				});
			}
			else
			{
				res.set("Content-Type","text/html");
				res.status(500);
				res.send("Failure: Couldn't open database collection.");
			}
		});
	}
	else
	{
		res.set("Content-Type","text/html");
		res.status(403);
		res.send("Failure: Access denied.");
	}
});

// Listen for HTTP requests.
app.listen(app.get("port"));