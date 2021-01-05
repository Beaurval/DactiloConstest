const urlParams = new URLSearchParams(window.location.search);
const MAXWORDS = 10;
const pseudo = urlParams.get("pseudo");
const titre = urlParams.get("roomName");

let words = [];
let nbMotsValides = 0;

function definirPseudo() {
    socket.emit('setPseudo',urlParams.get("pseudo"));
}

function ajouterSalon(){


    salonExist(titre).then(exist => {
        if(!exist && titre !== "" && pseudo !== ""){
            alert("Ajout du nouveau salon")
            socket.emit('nouveauSalon', titre,pseudo);
        }else {
            socket.emit('rejoindreSalon',titre);
        }
    });
}

async function salonExist(roomName) {
    return await $.get({
        url: "/partie/salonExist/" + roomName
    });
}

async function getWordsList() {
    return await  $.get({
        url: "/partie/getWordList"
    });
}

/* FONCTIONS DU JEU */
async function commencerPartie(btn) {
    $(btn).hide();
    socket.emit('commencerPartie',titre)
}

function changerDeMot(word){
    $(".game").html(word)
}

$("#typing-bar").keypress(function (e) {
    if (e.keyCode === 13) {
        //TODO VALIDATION DU MOT COTE SERVEUR
        socket.emit('reponse')
    }
})


socket.on('initialiserListeDeMots',wordList => {
    alert("coucou")
    words = wordList;
    changerDeMot(words[0].Word);
});

socket.on('changerMot', word => {
    changerDeMot(word);
})

/* FONCTIONS DU JEU */

function init(){
    definirPseudo()
    ajouterSalon()
}

socket.on('afficherJoueurs',(players) => {
    for (let i =0; i < players.length; i++){
        $(".player-list").append("<li>" + players[i].pseudo + "</li>")
    }

})

$(()=>{
    init();
})