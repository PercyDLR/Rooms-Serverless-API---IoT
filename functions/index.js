const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

class Espacio {
    constructor(options = {}) {
        Object.assign(this, options);
    }
}

exports.guardarEspacio = functions.https.onRequest((request, response) => {
    let espacio = new Espacio(request.body.data)

    functions.logger.info("Espacio recibido",{espacio});

    const reference = admin.database().ref("espacios").child(espacio.key)
    delete espacio.key

    functions.logger.info("Espacio a guardar",{espacio});
    
    reference.set(espacio)
        .then(() => {0
            response.status(200)
            response.send({"status": "OK",
                            "data": {espacio}})
        })
        .catch(error => {
            functions.logger.error({error});
            console.log(error)
            response.status(400)
            response.send({"status": "ERROR","data": "Hubo un error al guardar el espacio"})
    })
});

exports.agregarDisponibilidad = functions.https.onRequest((request, response) => {
    let disponibilidad = new Espacio(request.body.data)
    let xd = request.body
    functions.logger.info({"Datos recibidos":{xd},"Datos Guardados":{disponibilidad}});

    const reference = admin.database().ref("disponibilidad").child(disponibilidad.keyEspacio).child(disponibilidad.fecha)

    // Se agregarán las disponibilidades
    let update = {}
    for (let num=disponibilidad.horaInicio;num<disponibilidad.horaFin;num++){
        update[num] = true
    }
    // Las viejas se mantendrán
    reference.get().then(snapshot => {
        snapshot.forEach(data => {
            if(update[data.key]!=null && data.key >= disponibilidad.horaInicio && data.key < disponibilidad.horaFin){
                update[data.key] = data.val()
                functions.logger.info({"key":data.key, "value":data.val()});
            }
        })

        // Se guardan en la db
        reference.update(update).then(() => {

            // Se aumenta en 1 la cuenta de espacios
            admin.database().ref("espacios/"+disponibilidad.keyEspacio+"/horariosDisponibles")
            .transaction((current_value) => {
                return (current_value || 0) + 1;
            });

            response.status(200)
            response.send({"status": "OK", "data": {update}})
        })
        .catch(error => {
            functions.logger.error({error});
            console.log(error)
            response.status(400)
            response.send({"status": "ERROR","data": "Hubo un error al guardar el espacio"})
        })
    })
});
