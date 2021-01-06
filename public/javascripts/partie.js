const urlParams = new URLSearchParams(window.location.search);
const MAXWORDS = 3;
const pseudo = urlParams.get("pseudo");
const titre = urlParams.get("roomName");
const isAdmin = urlParams.get("isAdmin");

let nbMotsValides = 0;
let chronoCanInc = false;

function definirPseudo() {
    socket.emit('setPseudo', urlParams.get("pseudo"));
}

function rejoindreSalon() {
    socket.emit('rejoindreSalon', titre, isAdmin);
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
        socket.emit('saisieMot', titre, $(this).val());
    }
})

socket.on('resetSaisie', () => {
    $("#typing-bar").val("");
});

socket.on('nouveauMot', word => {
    changerDeMot(word);
    startChrono(true);
});


socket.on('premierMot', () => {
    startChrono(true);
    socket.emit('demanderMot', titre, 0);
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

socket.on('terminerPartieJoueur', (totalSecond) => {
    stopChrono();
    $(".game").text("Vous avez terminé en " + totalSecond + " secondes");
});

socket.on('afficherScoreDuJoueur',(totalSecond,joueur) => {
    $("." + joueur).text(" " + totalSecond + "s");
});

socket.on('partieTerminee',(winner)=> {
    $(".game").html(
        winner.pseudo + " a gagné la partie avec un temps de " + winner.totalTime + "s"
    )

    $("#startGame").show();
});

socket.on('afficherProgression',(player,progression) => {
    $("." + player).text(" " + progression + "/" + MAXWORDS)
})

socket.on('afficherJoueurs', (players) => {
    let $playersContainer = $(".player-list");

    console.log(players)
    //Need refresh ?
    if(players.length !== $(".player-list li").length - 1){
        $playersContainer.empty();
        $playersContainer.append("<li>Joueurs dans le salon</li>")
        players.forEach(player => {
            $playersContainer.append("<li>" + player + "<strong class='" + player + "'></strong></li>")
        });
    }


})

$(() => {
    init();
})