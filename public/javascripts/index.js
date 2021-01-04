

//Socket IO
function ajouterSalon(){
    let pseudo = $("#pseudo").val();
    let titre = $("#titre").val();

    alert("0k")
    if(titre !== "" && pseudo !== "") {
        socket.emit('nouveauSalon', "Salon de thé","Superman")
    }
    else{
        alert("Veuillez remplir tous les champs !")
    }

}