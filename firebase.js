//Inicializa la conexion a firebase para poder usar la base de datos en el proyecto
const admin = require('firebase-admin');
//Carga la clave de firebase para conectarse a la base de datos del archivo key
const serviceAccount = require('./key.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
module.exports = db;