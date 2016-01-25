/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var watson = require('watson-developer-cloud');

var relationship_extraction = watson.relationship_extraction({
  username: '78d04483-93a2-4d25-8cc7-f284dba0206b',
  password: 'rjAjJtihbzRg',
  version: 'v1-beta'
});

var mongo = process.env.VCAP_SERVICES;
var port = process.env.PORT || 3030;
var conn_str = "";
if (mongo) {
  var env = JSON.parse(mongo);
  if (env['mongodb-2.4']) {
    mongo = env['mongodb-2.4'][0]['credentials'];
    if (mongo.url) {
      conn_str = mongo.url;
    } else {
      console.log("No mongo found");
    }  
  } else {
    conn_str = 'mongodb://localhost:27017';
  }
} else {
  conn_str = 'mongodb://localhost:27017';
}

var MongoClient = require('mongodb').MongoClient;
var db; 

MongoClient.connect(conn_str, function(err, database) {
  if(err) throw err;
  db = database;
  
}); 



app.get('/api/getMessages', function (req, res) {
  if (db && db !== "null" && db !== "undefined") {
    // list messages
    db.collection('messages').find({}, { sort:[['_id', 'desc']]}, function(err, cursor) {
      if (err) {
        console.log(err.stack); 
        
        res.status(500).jsonp({error: 'mongodb message list failed.'});
      } else {
        cursor.toArray(function(err, items) {
          if (err) {
            console.log(err.stack); 
            
            res.status(500).jsonp({error: 'mongodb cursor to array failed.'});
          } else {
            
            var diseases = new Array();
            for(var item of items){
                diseases.push({'message': item.message,'DISEASE':item.DISEASE});
            }
            res.status(200).jsonp({data: diseases});
            
          }
        });
      }
    });     
  } else {
    
    res.status(500).jsonp({error: 'No mongo found.'});
  }
});
app.post('/api/insertMessage', function (req, res) {
  var msg = req.body.message;
  var arr;
   relationship_extraction.extract({
    text: msg,
    dataset: 'ie-en-news' },
    function (err, response) {
        if (err){
            console.log('error:', err);
            arr = "Could not get the informations"
            //res.status(500).jsonp({message: err});
        }
        else{
           console.log(JSON.stringify(response.doc.entities.entity, null, 2));
            arr = new Array();
            for(var x of response.doc.entities.entity){
                if(x.type == "DISEASE"){
                    console.log("Type: "+x.type+" Text"+x.mentref[0].text);
                    arr.push(x.mentref[0].text);    
                }
                
            }
        }
        
        var message = { 'message': msg, 'DISEASE': arr,'ts': new Date() };
        if (db && db !== "null" && db !== "undefined") {
            db.collection('messages').insert(message, {safe:true}, function(err){
            if (err) { 
                console.log(err.stack);
                res.write('mongodb message insert failed');
                res.end(); 
            } else {
                res.write('following messages has been inserted into database' + "\n" 
                + JSON.stringify(msg));
                res.end();
            }
            });    
        } else {
            res.write('No mongo found');
            res.end();
        }
            
            
        
    });
  
    
   
});







