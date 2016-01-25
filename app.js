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

/*require the ibm_db module*/
var ibmdb = require('ibm_db');

var VCAP_SERVICES = {
  "sqldb": [
    {
      "name": "SQL Database-8y",
      "label": "sqldb",
      "plan": "sqldb_free",
      "credentials": {
        "hostname": "75.126.155.153",
        "password": "uZtWQy5Id2jp",
        "port": 50000,
        "host": "75.126.155.153",
        "jdbcurl": "jdbc:db2://75.126.155.153:50000/SQLDB",
        "uri": "db2://user13747:uZtWQy5Id2jp@75.126.155.153:50000/SQLDB",
        "db": "SQLDB",
        "username": "user13747"
      }
    }
  ]
}
var serviceName = 'SQLDB';

function findKey(obj,lookup) {
   for (var i in obj) {
      if (typeof(obj[i])==="object") {
         if (i.toUpperCase().indexOf(lookup) > -1) {
            // Found the key
            return i;
         }
         findKey(obj[i],lookup);
      }
   }
   return -1;
}
 if (VCAP_SERVICES) {
      var env = VCAP_SERVICES;
      var key = 0;
   }
   
   var credentials = env.sqldb[0].credentials;
   
    var dsnString = "DRIVER={DB2};DATABASE=" + credentials.db + ";UID=" + credentials.username + ";PWD=" + credentials.password + ";HOSTNAME=" + credentials.hostname + ";port=" + credentials.port+ ";AUTHENTICATION=SERVER";



      /*Connect to the database server
      param 1: The DSN string which has the details of database name to connect to, user id, password, hostname, portnumber 
      param 2: The Callback function to execute when connection attempt to the specified database is completed
      API for the ibm_db package can be found here: https://www.npmjs.org/package/ibm_db
      */
   
ibmdb.open(dsnString, function (err,conn) {
  if (err) return console.log(err);
  
  conn.query('select 1 from sysibm.sysdummy1', function (err, data) {
    if (err) console.log(err);
    else console.log(data);
 
    conn.close(function () {
      console.log('done');
    });
  });
});



app.post('/extract', function(req, res) {
    
    relationship_extraction.extract({
    text: req.body.text,
    dataset: 'ie-en-news' },
    function (err, response) {
        if (err){
            console.log('error:', err);
            res.status(500).jsonp({message: err});
        }
        else{
            console.log(JSON.stringify(response.doc.entities.entity, null, 2));
            res.status(200).jsonp({message: JSON.stringify(response.doc.entities.entity)});
        }
    });
});


