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

    res.render('partie', {title: 'Dactilo Contest'});
});



module.exports = {
    router,
    start: function (io) {
        function getSocketWhithId(id) {
            var ns = io.of("/");
            return ns.sockets.get(id);
        }

        function recupererListeJoueurDuSalon(titre) {
            let players = [];
            try {
                var clients = io.sockets.adapter["rooms"].get(titre);
                clients.forEach(elem => {
                    players.push(getSocketWhithId(elem).pseudo);
                })
            } catch (e) {

            }

            return players;
        }

        io.on('connection', function (socket) {
            socket.on('setPseudo', function (pseudo) {
                socket.pseudo = pseudo;
            })

            socket.on('rejoindreSalon', async function (titre) {
                if(recupererListeJoueurDuSalon(titre).length === 0){
                    socket.join(titre);
                    console.log(recupererListeJoueurDuSalon(titre));
                }
                if (!recupererListeJoueurDuSalon(titre).includes(socket.pseudo)) {
                    socket.join(titre);
                    socket.salon = titre;
                }


                socket.emit('afficherJoueurs', recupererListeJoueurDuSalon(titre));
            });

            socket.on('commencerPartie', function (salon) {
                getWordList().then(wordList => {
                    io.emit('initialiserListeDeMots', wordList);
                })

            })

            socket.on('disconnect', function (reason) {
                console.log("Salon quitté")
            })
        });
    }
};