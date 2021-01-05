var app = require('express');
var router = app.Router();
var io = require('../io').io();
var MongoClient = require("mongodb").MongoClient;
var db = null;

MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client) {
    console.log("Connected successfully to server");
    db = client.db("dactilocontest");
});


/* GET home page. */
router.get('/', function (req, res) {
    db.collection("rooms").find().toArray((error, result) => {
        res.render('index', {title: 'Dactilo contest', rooms: result});
    })
});

io.on('connection', function (socket) {
    socket.on('nouveauSalon', function (titre, pseudo) {
        socket.join(titre);
        var nouveauSalon = {titre: titre, admin: pseudo};

        db.collection("rooms").insertOne(nouveauSalon, null, function (error, results) {
            if (error) throw error;
            console.log("Le nouveau salon a été ajouté");
        });
    });

    socket.on('disconnecting', () => {
        let index = 0;
        socket.rooms.forEach(elem => {
            var myquery = { titre: elem };
            if(index > 0){
                db.collection("rooms").deleteOne(myquery,function (err,obj) {
                    if (err) throw err;
                    console.log("1 document deleted");
                })
            }
            index++;
        })
    });
});


module.exports = router;
