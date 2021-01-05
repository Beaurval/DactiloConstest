const urlParams = new URLSearchParams(window.location.search);

function definirPseudo() {
    socket.emit('setPseudo',urlParams.get("pseudo"));
}

function ajouterSalon(){
    let pseudo = urlParams.get("pseudo");
    let titre = urlParams.get("roomName");

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