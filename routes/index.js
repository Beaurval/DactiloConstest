var app = require('express');
var router = app.Router();
var io = require('../io').io();
var MongoClient = require("mongodb").MongoClient;
var db = null;

MongoClient.connect("mongodb://localhost:27017",{useUnifiedTopology: true}, function(err, client) {
  console.log("Connected successfully to server");
  db = client.db("dactilocontest");
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Dactilo contest' });
});

router.post('/createRoom',function (req, res) {
  let pseudo = req.body.pseudo;
  let roomName = req.body.roomName;
});

io.on('connection', function(socket) {
  socket.on('nouveauSalon', function(titre,pseudo) {
    socket.join(titre);


      var nouveauSalon = { titre: titre, admin: pseudo };

      db.collection("rooms").insertOne(nouveauSalon, null, function (error, results) {
        if (error) throw error;
        console.log("Le nouveau salon a été ajouté");
      });


  });
});


module.exports = router;
