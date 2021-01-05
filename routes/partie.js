var app = require('express');
var router = app.Router();
var io = require('../io').io();
var MongoClient = require("mongodb").MongoClient;
var db = null;

MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client) {
    db = client.db("dactilocontest");
});

async function playerExist(pseudo,salon) {
    return !!(await db.collection("players").findOne({pseudo: pseudo, salon: salon}));
}

async function ajouterJoueur(pseudo, salon) {
    var nouveauJoueur = {pseudo: pseudo, salle: salon};

    let exist = await playerExist(pseudo,salon);
    console.log(exist);
    if(!exist){
        return await db.collection("players").insertOne(nouveauJoueur, null, function (error, results) {
            if (error) throw error;
            console.log("Le joueur " + pseudo + " a été ajouté.");
        });
    }

}
function supprimerJoueur(pseudo, salon) {
    var nouveauJoueur = {pseudo: pseudo, salle: salon};

    db.collection("players").deleteMany(nouveauJoueur, function (error, results) {
        if (error) throw error;
        console.log("Le joueur " + pseudo + " a été supprimé.");
    });
}
async function joueursDansSalon(titre) {
    var salon = {salle:titre};

    return db.collection("players").find(salon).toArray();
}

/* GET home page. */
router.get('/', function (req, res) {
    let myQuery = {title: req.params.name, admin: req.params.roomName}

    db.collection("rooms").findOne(myQuery, (error, result) => {
        if (error) throw error;
        res.render('partie', {title: 'Salle d\'attente', room: result});
    })
});
router.get('/salonExist/:name', function (req, res) {

    let myQuery = {titre: req.params.name}

    db.collection("rooms").findOne(myQuery, (error, result) => {
        if (error) throw error;
        if (result) {
            res.send(true);
        } else
            res.send(false);
    });
})


io.on('connection', function (socket) {
    socket.on('setPseudo', function (pseudo) {
        socket.pseudo = pseudo;
    })

    socket.on('nouveauSalon', function (titre, pseudo) {
        console.log("Création d'un nouveau salon")
        socket.join(titre);
        var nouveauSalon = {titre: titre, admin: pseudo};


        db.collection("rooms").insertOne(nouveauSalon, null, function (error, results) {
            if (error) throw error;
            console.log("Le salon " + titre + " a été ajouté.");
        });

        ajouterJoueur(pseudo, titre);
    });

    socket.on('rejoindreSalon', async function (titre) {
        socket.join(titre);
        socket.salon = titre;
        console.log(socket.pseudo + " has joined " + titre)

        await ajouterJoueur(socket.pseudo, titre)
        let players = await joueursDansSalon(titre);
        socket.emit('afficherJoueurs', players);
    });

    socket.on('disconnect', function (reason) {
        supprimerJoueur(socket.pseudo, socket.salon);
    })
});


module.exports = router;