var app = require('express');
var router = app.Router();

var MongoClient = require("mongodb").MongoClient;
var db = null;


MongoClient.connect("mongodb://localhost:27017", {useUnifiedTopology: true}, function (err, client) {
    db = client.db("dactilocontest");
});

async function playerExist(pseudo, salon) {
    return !!(await db.collection("players").findOne({pseudo: pseudo, salon: salon}));
}

async function ajouterJoueur(pseudo, salon) {
    var nouveauJoueur = {pseudo: pseudo, salle: salon};

    let exist = await playerExist(pseudo, salon);

    if (!exist) {
        return await db.collection("players").insertOne(nouveauJoueur, null, function (error, results) {
            if (error) throw error;
        });
    }

}

function supprimerJoueur(pseudo, salon) {
    var nouveauJoueur = {pseudo: pseudo, salle: salon};

    db.collection("players").deleteMany(nouveauJoueur, function (error, results) {
        if (error) throw error;
    });
}

async function joueursDansSalon(titre) {
    var salon = {salle: titre};

    return db.collection("players").find(salon).toArray();
}


async function getWordList() {
    return await db.collection("words").aggregate([{$sample: {size: 10}}]).toArray();
}

/* GET home page. */
router.get('/', function (req, res) {
    let myQuery = {titre: req.query.roomName}
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




module.exports = {
    router,
    start: function (io) {
            io.on('connection', function (socket) {
                socket.on('setPseudo', function (pseudo) {
                    socket.pseudo = pseudo;
                })

                socket.on('nouveauSalon', function (titre, pseudo) {
                    socket.join(titre);
                    var nouveauSalon = {titre: titre, admin: pseudo};


                    db.collection("rooms").insertOne(nouveauSalon, null, function (error, results) {
                        if (error) throw error;

                        ajouterJoueur(pseudo, titre);
                    });


                });

                socket.on('rejoindreSalon', async function (titre) {
                    socket.join(titre);
                    socket.salon = titre;

                    await ajouterJoueur(socket.pseudo, titre)
                    let players = await joueursDansSalon(titre);
                    socket.emit('afficherJoueurs', players);
                });

                socket.on('commencerPartie', function (salon) {
                    getWordList().then(wordList => {
                        io.emit('initialiserListeDeMots', wordList);
                    })

                })

                socket.on('disconnect', function (reason) {
                    supprimerJoueur(socket.pseudo, socket.salon);
                })
            });
    }
};