// Route to clear database.
app.get("/dbclear",function(req,res){
	//Grab route query parameters.
	var input = req.query;
	if(input.pswd === "schneer")
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