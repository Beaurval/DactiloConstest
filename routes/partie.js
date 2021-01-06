var app = require('express');
var router = app.Router();

var MongoClient = require("mongodb").MongoClient;
var db = null;

let rooms = [];


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
    res.render('partie', {title: 'Dactilo Contest', isAdmin: req.query.isAdmin});
});


module.exports = {
    router,
    start: function (io) {
        function getSocketWhithId(id) {
            var ns = io.of("/");
            return ns.sockets.get(id);
        }


        io.on('connection', function (socket) {
            console.log(rooms)
            socket.on('setPseudo', function (pseudo) {
                socket.pseudo = pseudo;
            })

            socket.on('rejoindreSalon', function (titre, isAdmin) {
                if (rooms[titre] == null) {
                    socket.join(titre);
                    socket.isAdmin = !!isAdmin;

                    rooms[titre] = {
                        name: titre,
                        players: [socket.pseudo],
                        admin: socket.pseudo,
                        start: null,
                        gameStarted: false
                    }
                } else {
                    let room = rooms[titre];
                    socket.join(titre);
                    socket.salon = titre;
                    socket.isAdmin = isAdmin;
                    if(!room.players.includes(socket.pseudo)){
                        room.players.push(socket.pseudo);
                    }
                }
                io.to(titre).emit('afficherJoueurs', rooms[titre].players);
            });

            socket.on('commencerPartie', function (salon) {
                getWordList().then(wordList => {
                    let room = rooms[salon];
                    io.to(salon).emit('initialiserListeDeMots', wordList);
                });
            })

            socket.on('disconnect', function (reason) {
                let titre = socket.salon;
                let room = rooms[titre];
                if (room != null) {
                    if (room.admin === socket.pseudo) {
                        const index = rooms.indexOf(titre);
                        rooms.splice(index, 1)
                    }else{
                        const index = room.players.indexOf(socket.pseudo);
                        room.players.splice(index, 1)
                    }
                }
            })
        });
    }
};