const urlParams = new URLSearchParams(window.location.search);
const MAXWORDS = 10;
const pseudo = urlParams.get("pseudo");
const titre = urlParams.get("roomName");
const isAdmin = urlParams.get("isAdmin");

let nbMotsValides = 0;
let chronoCanInc = false;

function definirPseudo() {
    socket.emit('setPseudo', urlParams.get("pseudo"));
}

function rejoindreSalon() {
    socket.emit('rejoindreSalon', titre,isAdmin);
}

async function getWordsList() {
    return await $.get({
        url: "/partie/getWordList"
    });
}

/* FONCTIONS DU JEU */
async function commencerPartie(btn) {
    $(btn).hide();
    socket.emit('commencerPartie', titre)
}

function changerDeMot(word) {
    $(".game").html(word)
}

$("#typing-bar").keypress(function (e) {
    if (e.keyCode === 13) {
        //TODO VALIDATION DU MOT COTE SERVEUR
        socket.emit('saisieMot',titre,$(this).val());
    }
})

socket.on('resetSaisie',()=>{
   $("#typing-bar").val("");
});

socket.on('nouveauMot', word => {
    changerDeMot(word);
    startChrono(true);
});


socket.on('premierMot', ()=>{
   socket.emit('demanderMot',titre,0);
});

socket.on('afficherMot', word => {
    changerDeMot(word);
})

/* FONCTIONS DU JEU */

function init() {
    definirPseudo()
    rejoindreSalon()
}

function incMinutes() {
    let $min = $(".minutes");
    let minutes = parseInt($min.text());
    minutes++;
    $min.text((minutes < 10 ? "0" : "") + minutes);
}

function startChrono(start) {
    if (start)
        chronoCanInc = true;
    $sec = $(".seconds");
    let secondes = parseInt($sec.text());
    if (secondes < 60) {
        secondes++
        $sec.text((secondes < 10 ? "0" : "") + secondes);
    } else {
        incMinutes();
        secondes = 0;
        $sec.text("00");
    }


    if (chronoCanInc) {
        setTimeout(startChrono, 1000)
    }
}

function stopChrono() {
    chronoCanInc = false;
}


socket.on('afficherJoueurs', (players) => {
    $players = $(".player-list");
    $players.empty();
    $players.append("<li>Joueurs dans le salon :</li>")
    for (let i = 0; i < players.length; i++) {
        $players.append("<li>" + players[i] + "</li>")
    }

})

$(() => {
    init();
})