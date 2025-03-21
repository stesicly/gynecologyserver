const bodyParser = require("body-parser");
const cors = require("cors");
const Docxtemplater = require('docxtemplater'); // Per manipolare il file .docx
const { exec } = require("child_process");
const express = require("express");
const fs = require('fs');
const https = require('https');
const mysql = require("mysql");
const multer = require("multer"); // Importa WebSocket
const nodemailer = require('nodemailer');
const path = require("path");
const PizZip = require('pizzip'); // Per leggere i file .docx
const { WebSocketServer } = require("ws");
const {diskStorage} = require("multer");
const { generatePdf } = require("./api/prints/generate-pdf");

const config = require("./config.nogit.js");
const {generateDoc, createQueryForPrint} = require("./api/prints/hub-doc");



const app = express();

// Carica i certificati SSL
const server = https.createServer({
    key: fs.readFileSync('./certs/private-key.pem'),  // La chiave privata
    cert: fs.readFileSync('./certs/certificate.pem')  // Il certificato
}, app);


const db = mysql.createPool({
    host    : config.DB.host,
    user    : config.DB.user,
    password: config.DB.password,
    port : config.DB.port,
    database: config.DB.database
})

app.use(cors({
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json())
app.use(bodyParser.urlencoded({extended:true}))

app.get("/", (require, response) => {
    response.send("<h1>hello worldddd {process.env.NODE_ENV}</h1>")
})

app.post('/generate-pdf', async (req, res) => {
    const { nomeUtente, indirizzo } = req.body; // Dati inviati dalla tua applicazione React

    try {
        // Usa la funzione per creare il PDF
        const pdfBytes = await generatePdf({
            nomeUtente : nomeUtente,
            indirizzo : indirizzo,
            visita : "ginecologica"
        });

        // Imposta il tipo di contenuto della risposta come PDF
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=report.pdf",
            "Content-Length": pdfBytes.length // Imposta la lunghezza del file
        });

        // Invia il PDF modificato come buffer
        res.send(pdfBytes);

    } catch (error) {
        console.error('Errore durante la creazione del PDF:', error);
        res.status(500).send('Errore nel generare il PDF');
    }
});

app.post('/generate-docxold', async (req, res) => {
    const { nomeUtente, indirizzo, visita } = req.body; // Dati inviati dalla tua applicazione React

    try {
        // Carica il template .docx
        const content = fs.readFileSync("./api/prints/visita-ginecologica.docx", 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip);

        // Imposta i dati dinamici
        doc.setData({
            nomeUtente: nomeUtente,
            indirizzo: indirizzo
        });

        // Esegui il rendering del documento
        doc.render();

        // Ottieni il file .docx risultante
        const output = doc.getZip().generate({ type: 'nodebuffer' });

        // Imposta le intestazioni per il download del file
        res.set({
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename=visita-ginecologica-${nomeUtente}.odt`,
            "Content-Length": output.length
        });

        // Invia il file .docx come buffer
        res.send(output);

    } catch (error) {
        console.error('Errore durante la creazione del documento Word:', error);
        res.status(500).send('Errore nel generare il documento Word');
    }
});

const getTableNameByTypeOfSheetID = async (typeofsheet) => {
    const sqlSELECT = "SELECT name FROM typeofsheet WHERE id = ?";
    try {
        const result = await new Promise((resolve, reject) => {
            db.query(sqlSELECT, [typeofsheet], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });

        if (result.length === 0) {
            throw new Error('Tipo di documento non trovato.');
        }

        return result[0].name; // Restituisce il nome della tabella

    } catch (error) {
        console.error('Errore nel recupero del tipo di documento:', error);
        throw error; // Rilancia l'errore per gestirlo nel chiamante
    }
};

app.post('/generate-doc', async (req, res) => {
    const { codicePaz, visita, typeofsheet } = req.body;



    // Primo try: eseguire la query per ottenere il nome della tabella


    try {

        const tableName = typeofsheet;//await getTableNameByTypeOfSheetID(typeofsheet);
        console.log("Tabella selezionata:", tableName);

        const templatePath = path.join(__dirname, `api/prints/visita-${tableName}.docx`);
        const outputDir = path.join(__dirname, 'temp');
        // Genera il documento e convertilo in PDF
        const { pdfData, filename } = await generateDoc(db, codicePaz, visita, tableName, templatePath, outputDir);
        console.log("filename====>", filename)
        // Verifica che pdfData sia valido e che il PDF esista
        if (!pdfData || pdfData.length === 0) {
            console.log('Errore: il PDF generato è vuoto.');
            return res.status(500).send('Errore nella generazione del PDF.');
        }

        // Imposta le intestazioni per il download del file PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfData.length
        });

        // Invia il PDF come risposta
        res.send(pdfData);

    } catch (error) {
        console.error('Errore durante la generazione o la conversione:', error);
        res.status(500).send('Errore nel generare il documento o nel convertirlo in PDF');
    }
});



app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, body, codicePaz, visita,typeofsheet } = req.body;
        const tableName = typeofsheet;//await getTableNameByTypeOfSheetID(typeofsheet);

        const templatePath = path.join(__dirname, `api/prints/visita-${tableName}.docx`);
        const outputDir = path.join(__dirname, 'temp');

        // Genera il documento e convertilo in PDFawait generateDoc(db, codicePaz, visita, typeofsheet, templatePath, outputDir);
        const { pdfData, filename } = await generateDoc(db, codicePaz, visita, tableName, templatePath, outputDir);
        console.log("PDF generato per l'email:", filename);

        if (!pdfData || pdfData.length === 0) {
            console.log('Errore: il PDF generato è vuoto.');
            return res.status(500).send('Errore nella generazione del PDF.');
        }

        // Configura l'email con il PDF allegato
        const mailOptions = {
            from: config.EMAIL_USER,
            to: to,
            cc: "siclaristefano@yahoo.it",
            subject: subject,
            text: body,
            attachments: [
                {
                    filename: filename,
                    content: pdfData
                }
            ]
        };

        // Invia l'email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email inviata con successo:', info);

        return res.status(200).json({ message: 'Email inviata con successo', info });

    } catch (error) {
        console.error("Errore nell'invio dell'email:", error);
        return res.status(500).json({ message: 'Errore nell\'invio dell\'email' });
    }
});


const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage });


app.post("/api/upload", upload.array("files", 20), (req, res) => {
    const { codicePaziente, idTab, idVisit } = req.body;

    if (!codicePaziente && !idVisit) {
        return res.status(400).json({ error: "codicePaziente o idVisit mancante" });
    }
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Nessun file caricato" });
    }
    const patientDir = path.join(uploadDir, codicePaziente, idTab, idVisit || "");
    if (!fs.existsSync(patientDir)) {
        fs.mkdirSync(patientDir, { recursive: true });
    }

    let errorOccurred = false;
    let filesToDelete = [];
console.log("req.files===>", req.files.length, req.files)
    const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
            const tempFilePath = file.path;  // Questo è il percorso temporaneo
            const finalFilePath = path.join(patientDir, file.originalname); // Utilizza file.originalname per il nome del file finale


            // Prima spostiamo il file
            console.log("finalFilePath=>>%o - %o", file.originalname, finalFilePath);
            fs.writeFile(finalFilePath, file.buffer, (err) => {
                if (err) {
                    errorOccurred = true;
                    filesToDelete.push(tempFilePath); // Aggiungi il file temporaneo da eliminare se c'è stato un errore nello spostamento
                    return reject(new Error(`Errore nel spostare il file ${file.originalname}: ${err.message}`));
                }
                // Solo dopo che il file è stato spostato correttamente, inseriamo nel DB
                const sqlINSERT = `INSERT INTO attachments(CodicePaz, filename, typeofsheet, idvisit) 
                                   VALUES (?, ?, ?, ?)`;

                console.log("sqlINSERT=>>%o ", sqlINSERT);
                db.query(sqlINSERT, [codicePaziente, file.originalname, idTab, idVisit || 0], (error) => {
                    if (error) {
                        errorOccurred = true;
                        filesToDelete.push(finalFilePath); // Aggiungi il file finale da eliminare in caso di errore nel DB
                        fs.unlinkSync(finalFilePath); // Rimuovi il file appena spostato
                        return reject(new Error(`Errore nella query SQL per il file ${file.originalname}: ${error.message}`));
                    }
                    resolve(`File ${file.originalname} caricato e spostato con successo!`);
                });
            });
        });
    });

    // Attendere tutte le promesse di caricamento file
    Promise.all(uploadPromises)
        .then(() => {
            // Se c'è stato un errore, cancella i file temporanei
            if (errorOccurred) {
                filesToDelete.forEach(filePath => {
                    fs.unlinkSync(filePath); // Rimuovi il file temporaneo
                });
                return res.status(500).json({ error: "Errore durante il caricamento di alcuni file" });
            }

            // Rispondi se tutto è andato bene
            res.status(200).json({ message: "Tutti i file sono stati caricati con successo!" });
        })
        .catch((error) => {
            // Se una promessa ha fallito, cancella i file temporanei
            filesToDelete.forEach(filePath => {
                fs.unlinkSync(filePath); // Rimuovi il file temporaneo
            });

            // Rispondi con un errore
            res.status(500).json({ error: error.message });
        });

});

// Configura il trasportatore per l'invio delle email (ad esempio, Gmail)
const transporter = nodemailer.createTransport({
    service: config.EMAIL_PROVIDER, // O un altro servizio SMTP (Outlook, SMTP personalizzato, ecc.)
    auth: {
        user: config.EMAIL_USER, // La tua email
        pass: config.EMAIL_PASS, // La tua password o password generata per app
    }
});




app.post("/api/save/addItemToDropDownTable", (req, res)=>{

    const value = req.body.value,
          tableName = req.body.tableName;

    const verifySQL = "SELECT EXISTS (" +
        "    SELECT 1" +
        "    FROM information_schema.columns" +
        "    WHERE table_name = '" + tableName + "'" +
        "    AND (column_name = 'CodicePaz' OR column_name = 'Codice' OR column_name = 'titolo')" +
        ") AS ispresente;"


    db.query(verifySQL, (error,result)=>{

        const fieldName = result[0].ispresente>0 ? "Tipo" : "titolo";
        const sqlINSERT = "INSERT INTO " + tableName + " (" + fieldName + ") VALUES ('" + value + "')";


        db.query(sqlINSERT, (error,result)=>{
            res.send(result)
        })
    })
/*
* db.query(sqlSELECT, (error,result)=>{

        if (result.length===0){
            for (let key in paziente){
                fields.push(key);
                values.push(paziente[key]!=="" ? '"' + paziente[key] + '"': '\"\"' )
            }
            fields.push("CodicePaz");
            values.push(codicePaz);
            sqlSELECT = "INSERT INTO " + nomeTabella + " (" + fields.join(",") + ") " +
                "VALUES  (" + values.join(",") + ") ";

            db.query(sqlSELECT, (error,result)=>{})
        }
        else{
            for (let key in paziente){
                values.push(' ' + key + '="' + (paziente[key]!=="" ? paziente[key] + '"': '"') )
            }
            sqlSELECT= "UPDATE " + nomeTabella + " " +
                "SET " + values.join(",") + " " +
                "WHERE CodicePaz='" + paziente.CodicePaz + "'";
            db.query(sqlSELECT, (error,result)=>{})
        }
    })
*
* */

});

app.post("/api/del/delItemToDropDownTable", (req, res)=>{

    const value = req.body.value,
        tableName = req.body.tableName;

    let verifySQL =
        "SELECT COLUMN_NAME as name " +
        "FROM INFORMATION_SCHEMA.COLUMNS " +
        "WHERE TABLE_NAME = '" + tableName + "' AND COLUMN_NAME IN ('CodicePaz', 'Codice', 'CodiceComune')";

    db.query(verifySQL, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'estrazione del campo della tabella" });
        }
        if (!error && result && result[0] && result[0].name){
            const fieldName = result[0].name

            const sqlDELETE = "DELETE FROM " + tableName + " WHERE " + fieldName + " = '" + value + "'";

            db.query(sqlDELETE, (error,result)=>{
                res.send(result)
            })
        }
    })

});

app.post("/api/get/attachments", (req,res)=>{
    const codicePaziente = req.body.codicePaziente;
    const idTab = req.body.idTab;
    const dateFieldName = req.body.dateFieldName;
    const idVisit = req.body.idVisit;

    let sqlSELECT = `
        SELECT a.id, filename, t.name, idvisit, t.id as idtab, COALESCE(g.DataVisitaGin, o.DataVisitaOst, s.DataEsameSen) AS datavisita

        FROM attachments a
                 INNER JOIN typeofsheet t ON a.typeofsheet=t.id

                 LEFT JOIN ginecologica g ON a.idvisit = g.id AND t.name = "ginecologica"
                 LEFT JOIN ostetrica o ON a.idvisit = o.id AND t.name = "ostetrica"
                 LEFT JOIN senologica s ON a.idvisit = s.id AND t.name = "senologica"

        WHERE a.CodicePaz=${codicePaziente}
        order by filename `;

    let sqlTEST = `SET @sql = NULL;
            SELECT GROUP_CONCAT(
                CONCAT(' LEFT JOIN ', name, ' AS t ON t.id = t1.ref_id') 
                SEPARATOR ' '
            ) INTO @joins
            FROM tabella_switch;
            
            SET @final_query = CONCAT(
                'SELECT t1.*, t.nomecampo 
                 FROM tabella1 t1 
                 ', @joins, ';'
            );
            
            PREPARE stmt FROM @final_query;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;`

    console.log("sqlTEST====> ", sqlTEST)
    if (idTab && idVisit){
        sqlSELECT += ` and typeofsheet=${idTab} and idvisit=${idvisit}`
    }

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/comuni", (req,res)=>{
    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        "elencocomuni " +
        "ORDER BY NomeComune";

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/defaults", (req,res)=>{
    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        "defaults "

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.post("/api/get/listFromTable2", (req,res)=>{
    const nomeTabella = req.body.nomeTabella;
    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        nomeTabella  ;

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.post("/api/get/listFromTable", (req,res)=>{
    const nomeTabella = req.body.nomeTabella;
    let sqlSelect =
        "SELECT COLUMN_NAME as name " +
        "FROM INFORMATION_SCHEMA.COLUMNS " +
        "WHERE TABLE_NAME = '" + nomeTabella + "' AND COLUMN_NAME IN ('Nome', 'Tipo', 'NomeComune')";

    db.query(sqlSelect, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'estrazione del campo della tabella" });
        }
        if (!error && result && result[0] && result[0].name){
            const nomeCampo = result[0].name

            sqlSELECT =
                "SELECT * " +
                "FROM " +
                nomeTabella +
                " ORDER BY " + nomeCampo


            db.query(sqlSELECT, (error,result)=>{
                res.send(result)
            })
        }
    })


})



function generateSessionId() {
    // Genera un timestamp univoco
    const timestamp = Date.now().toString(36);

    // Genera un numero casuale univoco
    const random = Math.random().toString(36).substr(2);

    // Combina il timestamp e il numero casuale per creare un ID univoco
    const sessionId = timestamp + random;

    return sessionId;
}

app.post( "/api/dbms/login", (req,res)=>{
    const username = req.body.username,
        password = req.body.password;

    let sqlSELECT =
        "SELECT id,username, password " +
        "FROM user " +
        "WHERE username='" + username + "' and password='" + password + "'";
    db.query(sqlSELECT, (error,result)=>{
        const sessionId = generateSessionId();

        if (!error && result && result[0] && result[0].id && !isNaN(result[0].id)){
                sqlSELECT =
                    "INSERT INTO loggeduser(user, sessionid, ip) " +
                    "VALUES(" + result[0].id + ",'" + sessionId + "','" + req.ip + "')";  /**/


                db.query(sqlSELECT, (error,result)=>{
                    if (!error && result && result[0]){
                    }
                })

        }
        res.send('{"msg":"ok","description":"utente valido",  ' +
            '"userid":"' + result[0]?.id + '", "sessionid" : "' + sessionId + '"}')
    })
})

app.post( "/api/dbms/logincheck", (req,res)=>{
    const userid = req.body.userId,
        sessionId = req.body.sessionId;

    const sqlSELECT =
        "SELECT * " +
        "FROM loggeduser " +
        "WHERE ip='" + req.ip + "' and user='" + userid + "' and sessionid='" +  sessionId + "'";

   db.query(sqlSELECT, (error,result)=>{
        res.send('{"message":"ok"}')
    })
})

app.get("/api/get/typeofsheet", (req,res)=>{

    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        "typeofsheet " +
        "ORDER BY id";

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })

})

app.post("/api/get/visite", (req,res)=>{
    const codicePaziente = req.body.codicePaziente,
        dataFieldName = req.body.dataFieldName,
        tabId = req.body.tabId;

    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        tabId + " " +
        "WHERE CodicePaz=" + codicePaziente + " " +
        "ORDER BY " + dataFieldName +  " DESC";

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.post("/api/get/getFirstVisit", (req,res)=>{
    const
        codicePaziente = req.body.codicePaziente;

    const sqlSELECT =
        "(SELECT DataVisitaGin AS PrimaVisita " +
        "FROM ginecologica " +
        "WHERE CodicePaz = " + codicePaziente + " AND DataVisitaGin IS NOT NULL) " +
        "UNION " +
        "(SELECT DataVisitaOst AS PrimaVisita " +
        "FROM ostetrica " +
        "WHERE CodicePaz = " + codicePaziente + " AND DataVisitaOst IS NOT NULL) " +
        "UNION " +
        "(SELECT DataEsameSen AS PrimaVisita " +
        "FROM senologica " +
        "WHERE CodicePaz = " + codicePaziente + " AND DataEsameSen IS NOT NULL) " +
        "ORDER BY PrimaVisita " +
        "LIMIT 1";

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})


app.post("/api/get/getLastVisit", (req,res)=>{
    const
        codicePaziente = req.body.codicePaziente,
        nomeTabella = req.body.nomeTabella;

    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        nomeTabella + " " +
        "WHERE CodicePaz=" + codicePaziente + " " +
        "ORDER BY id DESC Limit 1";

    //("GET LAST VISIT ===> ", sqlSELECT)
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})


app.post("/api/save/cancelVisit", (req,res)=>{
    const
        codicePaziente = req.body.codicePaziente,
        nomeTabella = req.body.currentTab,
        idVisita = req.body.idVisita
    const sqlSELECT = "DELETE FROM " + nomeTabella + " WHERE id=" + idVisita;

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.post("/api/save/defaults", (req,res)=>{
    let sqlSELECT =
        "SELECT * " +
        "FROM " +
        "defaults ";
    const defaults = req.body.defaults,
        fields = [],
        values = [];
    db.query(sqlSELECT, (error,result)=>{
        if (!error){
            if (result && result[0] && result[0].addome){

                for (let key in defaults){
                    values.push(' ' + key + '="' + (defaults[key]!=="" ? defaults[key] + '"': '"') )
                }
                sqlSELECT= "UPDATE defaults " +
                    "SET " + values.join(",");
                //console.log("UPDATE defaults===> ", sqlSELECT)
                db.query(sqlSELECT, (error,result)=>{
                    res.send(result)})
            }
            else{
                for (let key in defaults){
                    if (key!=="undefined"){
                        fields.push(key);
                        values.push(defaults[key]!=="" ? '"' + defaults[key] + '"': '\"\"' )
                    }
                }

                sqlSELECT = "INSERT INTO defaults (" + fields.join(",") + ") " +
                    "VALUES  (" + values.join(",") + ") ";

                //console.log("INSERT defaults ===> ", sqlSELECT)
                db.query(sqlSELECT, (error,result)=>{
                    res.send(result)}
                )
            }
        }
    })
})

app.post("/api/get/getLastVisitForPrint", (req,res)=>{
    const sqlSELECT = createQueryForPrint(req.body.nomeTabella, req.body.codicePaziente, req.body.codiceVisita )

    /*console.log("getLastVisitForPrint last visit of %o ===> %o", nomeTabella, sqlSELECT)*/
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})


app.post("/api/get/colposcopia", (req,res)=>{
    const codicePaziente = req.body.codicePaziente;
    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        "colposcopia " +
        "WHERE CodicePaz=" + codicePaziente + " " +
        "ORDER BY DataColpo DESC";


    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/newCodicePaz", (req, res)=>{
    /* elencopazienti è una vista */

    /* "SELECT LTRIM(Cognome) as Cognome, LTRIM(Nome) as Nome, RTRIM(LTRIM(elencocomuni.NomeComune)) as NomeComune, elencoprovincie.SiglaProvincia as Provincia, RTRIM(LTRIM(elencocitta.NomeComune)) as citta, elencocitta.CAP, elencoprov.SiglaProvincia as provcitta, paziente.* FROM paziente LEFT JOIN elencocomuni ON paziente.LuogoNascita=elencocomuni.CodiceComune LEFT JOIN elencoprovincie ON elencoprovincie.CodiceProvincia=elencocomuni.CodiceProvincia LEFT JOIN elencocomuni as elencocitta ON paziente.Città=elencocitta.CodiceComune LEFT JOIN elencoprovincie as elencoprov ON elencoprov.CodiceProvincia=elencocitta.CodiceProvincia ORDER BY Cognome, Nome"
*/
    const sqlSELECT =
        "SELECT max(CodicePaz) + 1 as newcodice " +
        "FROM paziente ";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
});

function setFieldValue(table, key){
    switch (table[key]){

        case "":
            return '\"\"';
            break;

        default:
            return '"' + table[key] + '"'
    }
}

app.post("/api/save/patient", (req,res)=>{
    const paziente = req.body.paziente,
        fields = [],
        values = [];

    for (let key in paziente){
        if (key!=="rank") {
            fields.push(key);
            values.push(paziente[key]!=="" ? '"' + paziente[key] + '"': '\"\"' )
            //values.push(setFieldValue(paziente, key))
        }
    }

    const sqlSELECT =
        "INSERT INTO paziente (" + fields.join(",") + ") " +
        "VALUES  (" + values.join(",") + ") ";

    db.query(sqlSELECT, (error,result)=>{

        res.send(result)
    })
})

function salvaSingolaScheda(nomeTabella, codicePaz, paziente){
    const fields = [],
        values = [];

    let sqlSELECT = "SELECT * FROM " + nomeTabella +" WHERE CodicePaz='" + codicePaz + "'";
    db.query(sqlSELECT, (error,result)=>{

        if (result.length===0){
            for (let key in paziente){
                fields.push(key);
                values.push(paziente[key]!=="" ? '"' + paziente[key] + '"': '\"\"' )
                //values.push(setFieldValue(paziente, key))
            }
            fields.push("CodicePaz");
            values.push(codicePaz);
            sqlSELECT = "INSERT INTO " + nomeTabella + " (" + fields.join(",") + ") " +
                "VALUES  (" + values.join(",") + ") ";

            db.query(sqlSELECT, (error,result)=>{})
        }
        else{
            for (let key in paziente){
                values.push(' ' + key + '="' + (paziente[key]!=="" ? paziente[key] + '"': '"') )

                //values.push(' ' + key + '="' + setFieldValue(paziente, key) + '"')
            }
            sqlSELECT= "UPDATE " + nomeTabella + " " +
                "SET " + values.join(",") + " " +
                "WHERE CodicePaz='" + paziente.CodicePaz + "'";
            db.query(sqlSELECT, (error,result)=>{})
        }
    })
}

function salvaVisita(nomeTabella, codicePaz, id, visita, res){
    const fields = [],
        values = [],
    whereCondition = " WHERE " + (nomeTabella!=="colposcopia" ? "id=" + id : "CodicePaz=" + codicePaz);

    let sqlSELECT;

        if (id===-1 || id===undefined){
            for (let key in visita){
                if (key!=="id" && key!=="undefined"){
                    fields.push(key);
                    values.push(visita[key]!=="" ? '"' + visita[key] + '"': '\"\"' )
                    //values.push(setFieldValue(visita, key))
                }
            }
            if (fields.indexOf("CodicePaz")===-1){
                fields.push("CodicePaz");
                values.push(codicePaz)
            }


            sqlSELECT = "INSERT INTO " + nomeTabella + " (" + fields.join(",") + ") " +
                "VALUES  (" + values.join(",") + ") ";

          //console.log("INSERT ===> ", sqlSELECT)
            db.query(sqlSELECT, (error,result)=>{
                res.send(result)})
        }
        else{
            for (let key in visita){
                values.push(' ' + key + '="' + (visita[key]!=="" ? visita[key] + '"': '"') )

                //values.push(' ' + key + '="' + setFieldValue(visita, key) + '"' )
            }
            sqlSELECT= "UPDATE " + nomeTabella + " " +
                "SET " + values.join(",") + whereCondition;
           //console.log("UPDATE ===> ", sqlSELECT)
           db.query(sqlSELECT, (error,result)=>{
               res.send(result)})
        }
}

app.post("/api/save/visit", (req,res)=>{
    salvaVisita(req.body.nomeTabella, req.body.CodicePaz, req.body.id, req.body.visita, res)
})

app.post("/api/save/updatepatient", (req,res)=>{
    const paziente = req.body.paziente,
        values = [];

    for (let key in paziente){
        if (key!=="CodicePaz" && key!=="rank"){
            if (key.substring(0,11)!=="salvascheda"){
                values.push(' ' + key + '="' + (paziente[key]!=="" ? paziente[key] + '"': '"') )

                //values.push(' ' + key + '="' + setFieldValue(paziente, key) + '"')
            }
            else{
                switch (key){
                    case "salvaschedasenologica": case "salvaschedacolposcopia":
                        salvaSingolaScheda(key.substring(11), paziente.CodicePaz, paziente[key]);
                        break;
                }
            }
        }
    }

    const sqlSELECT =
        "UPDATE paziente " +
        "SET " + values.join(",") + " " +
        "WHERE CodicePaz='" + paziente.CodicePaz + "'";


    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

// Funzione per ottenere tutti i pazienti
function getAllPatients(ws) {
    const sqlSelectAllPatients = `
        SELECT CodicePaz, LTRIM(Cognome) as Cognome, 
        LTRIM(Nome) as Nome, DataNascita 
        FROM paziente ORDER BY Cognome, Nome, CodicePaz`;
    db.query(sqlSelectAllPatients, (error, result) => {
        if (error) {
            ws.send(JSON.stringify({ error: "Errore nel recupero dei pazienti" }));
        } else {
            ws.send(JSON.stringify({ patients: result }));
        }
    });
}

// Funzione per ottenere i dati di un paziente specifico
function getPatient(ws, codicePaziente) {
    const sqlSelectPatient = `
        SELECT LTRIM(Cognome) as Cognome, 
        LTRIM(Nome) as Nome, paziente.* 
        FROM paziente WHERE CodicePaz = '${codicePaziente}'`;
    db.query(sqlSelectPatient, (error, result) => {
        if (error) {
            ws.send(JSON.stringify({ error: "Errore nel recupero dei dati del paziente" }));
        } else {
            ws.send(JSON.stringify({ patient: result }));
        }
    });
}

// Funzione per ottenere la lista degli esami
function getExamList(ws) {
    const sqlSelectExamList = "SELECT * FROM listaesami";
    db.query(sqlSelectExamList, (error, result) => {
        if (error) {
            ws.send(JSON.stringify({ error: "Errore nel recupero della lista esami" }));
        } else {
            ws.send(JSON.stringify({ exams: result }));
        }
    });
}

app.get("/api/get/allpatients", (req, res)=>{

    /* "SELECT LTRIM(Cognome) as Cognome, LTRIM(Nome) as Nome, RTRIM(LTRIM(elencocomuni.NomeComune)) as NomeComune, elencoprovincie.SiglaProvincia as Provincia, RTRIM(LTRIM(elencocitta.NomeComune)) as citta, elencocitta.CAP, elencoprov.SiglaProvincia as provcitta, paziente.* FROM paziente LEFT JOIN elencocomuni ON paziente.LuogoNascita=elencocomuni.CodiceComune LEFT JOIN elencoprovincie ON elencoprovincie.CodiceProvincia=elencocomuni.CodiceProvincia LEFT JOIN elencocomuni as elencocitta ON paziente.Città=elencocitta.CodiceComune LEFT JOIN elencoprovincie as elencoprov ON elencoprov.CodiceProvincia=elencocitta.CodiceProvincia ORDER BY Cognome, Nome"
*/
    const sqlSELECT =
        "SELECT CodicePaz, LTRIM(Cognome) as Cognome, " +
        "LTRIM(Nome) as Nome, DataNascita " +
        "FROM paziente ORDER BY Cognome, Nome, CodicePaz";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
});

app.post("/api/get/patient", (req , res) =>{
    const sqlSELECT =
        "SELECT LTRIM(Cognome) as Cognome, " +
        "LTRIM(Nome) as Nome, " +
        "paziente.* " +
        "FROM paziente WHERE CodicePaz ='" + req.body.codicePaziente + "'";

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/allpatientsOld", (req, res)=>{
    /* elencopazienti è una vista */

    /* "SELECT LTRIM(Cognome) as Cognome, LTRIM(Nome) as Nome, RTRIM(LTRIM(elencocomuni.NomeComune)) as NomeComune, elencoprovincie.SiglaProvincia as Provincia, RTRIM(LTRIM(elencocitta.NomeComune)) as citta, elencocitta.CAP, elencoprov.SiglaProvincia as provcitta, paziente.* FROM paziente LEFT JOIN elencocomuni ON paziente.LuogoNascita=elencocomuni.CodiceComune LEFT JOIN elencoprovincie ON elencoprovincie.CodiceProvincia=elencocomuni.CodiceProvincia LEFT JOIN elencocomuni as elencocitta ON paziente.Città=elencocitta.CodiceComune LEFT JOIN elencoprovincie as elencoprov ON elencoprov.CodiceProvincia=elencocitta.CodiceProvincia ORDER BY Cognome, Nome"
*/
    const sqlSELECT =
        "SELECT LTRIM(Cognome) as Cognome, " +
        "LTRIM(Nome) as Nome, " +
        "RTRIM(LTRIM(elencocomuni.NomeComune)) as NomeComune, " +
        "elencoprovincie.SiglaProvincia as Provincia, " +
        "RTRIM(LTRIM(elencocitta.NomeComune)) as citta, " +
        "elencocitta.CAP, " +
        "elencoprov.SiglaProvincia as provcitta, " +
        "paziente.* " +
        "FROM paziente " +
        "LEFT JOIN elencocomuni ON paziente.LuogoNascita=elencocomuni.CodiceComune " +
        "LEFT JOIN elencoprovincie ON elencoprovincie.CodiceProvincia=elencocomuni.CodiceProvincia " +
        "LEFT JOIN elencocomuni as elencocitta ON paziente.Città=elencocitta.CodiceComune " +
        "LEFT JOIN elencoprovincie as elencoprov ON elencoprov.CodiceProvincia=elencocitta.CodiceProvincia " +
        "ORDER BY Cognome, Nome";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
});

app.get("/api/get/listaEsami", (req,res)=>{
    const sqlSELECT = "SELECT * from listaesami"
    /*SELECT esamiraccoglitore.id as folderID, esamiraccoglitore.titolo as foldertitle, esami.id, esami.titolo, esame.id, esame.nome FROM esamiraccoglitore left JOIN esamiraccoglitoreesami ON esamiraccoglitore.id=esamiraccoglitoreesami.esameraccoglitoreid LEFT JOIN esami ON esami.id=esamiraccoglitoreesami.esamiid LEFT JOIN esamiesame ON esamiesame.esamiid=esami.id LEFT JOIN esame ON esame.id=esamiesame.esameid;*/

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/raccoglitoreEsami" ,(req,res) => {
    const sqlSELECT = "SELECT * FROM esamiraccoglitore ";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/esami" ,(req,res) => {
    const sqlSELECT = "SELECT * FROM esami ";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/esame" ,(req,res) => {
    const sqlSELECT = "SELECT * FROM esame ";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})


app.post( "/api/save/addRaccoglitore", (req,res)=>{
    const name = req.body.titolo;
    const sqlINSERT =
        "INSERT INTO esamiraccoglitore(titolo) " +
        "VALUES('" + name + "')";

    db.query(sqlINSERT, (error,result)=>{
        res.send('{"msg":"ok","description":"raccoglitore inserito", "id":' + result.insertId + '}')

    })
})

/* inserisce in esami, poi prende l'id e inserisce in esamiraccoglitoreesami esamiraccoglitoreid(args.id) e esamiid(id) */
app.post( "/api/save/addGruppoEsami", (req,res)=>{
    const titolo = req.body.titolo,
        raccoglitoreID = req.body.raccoglitoreID;
    let sqlINSERT =
        "INSERT INTO esami(titolo) " +
        "VALUES('" + titolo + "')";

    db.query(sqlINSERT, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'inserimento del gruppo esami" });
        }
        const gruppoID = result.insertId;
        let sqlINSERT =
            "INSERT INTO esamiraccoglitoreesami(esameraccoglitoreid,esamiid) " +
            "VALUES(" + raccoglitoreID + "," + gruppoID +")";

        db.query(sqlINSERT, (error,result)=>{
            res.send('{"msg":"ok","description":"esami inserito", "idparent":' + result.insertId + ', "id" : "' + gruppoID + '"}')
        })
    })
})

/* inserisce in esame, poi prende l'id e inserisce in esamiesame esamiid(fromWhat.args.examinations.id) e esameid(id) */
app.post( "/api/save/addEsame", (req,res)=>{
    const titolo = req.body.titolo,
        esamiID = req.body.esamiID;
    let sqlINSERT =
        "INSERT INTO esame(titolo) " +
        "VALUES('" + titolo + "')";


    db.query(sqlINSERT, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'inserimento dell'esame" });
        }
        const esameID = result.insertId;
        let sqlINSERT =
            "INSERT INTO esamiesame(esamiID,esameid) " +
            "VALUES(" + esamiID + "," + esameID +")";

        db.query(sqlINSERT, (error,result)=>{
            res.send('{"msg":"ok","description":"esame inserito", "idparent":' + result.insertId + ', "id" : "' + esameID + '"}')
        })
    })
})




app.get("/api/get/listaPrescrizioni", (req,res)=>{
    const sqlSELECT = "SELECT * From listaprescrizioni";

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})


app.get("/api/get/prescrizioniraccoglitore" ,(req,res) => {
    const sqlSELECT = "SELECT * FROM prescrizioniraccoglitore ";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/prescrizioni" ,(req,res) => {
    const sqlSELECT = "SELECT * FROM prescrizioni ";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.get("/api/get/farmaco" ,(req,res) => {
    const sqlSELECT = "SELECT * FROM farmaco ";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})


app.post( "/api/save/addRaccoglitorePrescrizioni", (req,res)=>{
    const name = req.body.titolo;
    const sqlINSERT =
        "INSERT INTO prescrizioniraccoglitore(titolo) " +
        "VALUES('" + name + "')";

    db.query(sqlINSERT, (error,result)=>{
        res.send('{"msg":"ok","description":"raccoglitore inserito", "id":' + result.insertId + '}')

    })
})

/* inserisce in esami, poi prende l'id e inserisce in esamiraccoglitoreesami esamiraccoglitoreid(args.id) e esamiid(id) */
app.post( "/api/save/addGruppoPrescrizioni", (req,res)=>{
    const titolo = req.body.titolo,
        raccoglitoreID = req.body.raccoglitoreID;
    let sqlINSERT =
        "INSERT INTO prescrizioni(name) " +
        "VALUES('" + titolo + "')";

    db.query(sqlINSERT, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'inserimento del gruppo esami" });
        }
        const gruppoID = result.insertId;
        let sqlINSERT =
            "INSERT INTO prescrizioniraccoglitoreprescrizioni(prescrizioniraccoglitoreid,prescrizioniid) " +
            "VALUES(" + raccoglitoreID + "," + gruppoID +")";

        db.query(sqlINSERT, (error,result)=>{
            res.send('{"msg":"ok","description":"esami inserito", "idparent":' + result.insertId + ', "id" : "' + gruppoID + '"}')
        })
    })
})

/* inserisce in esame, poi prende l'id e inserisce in esamiesame esamiid(fromWhat.args.examinations.id) e esameid(id) */
app.post( "/api/save/addFarmaco", (req,res)=>{
    const titolo = req.body.titolo,
        esamiID = req.body.esamiID;
    let sqlINSERT =
        "INSERT INTO farmaco(nome) " +
        "VALUES('" + titolo + "')";

    db.query(sqlINSERT, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'inserimento dell'esame" });
        }
        const farmacoID = result.insertId;
        let sqlINSERT =
            "INSERT INTO prescrizionifarmaco(prescrizioniid,farmacoid) " +
            "VALUES(" + esamiID + "," + farmacoID +")";

        db.query(sqlINSERT, (error,result)=>{
            res.send('{"msg":"ok","description":"esame inserito", "idparent":' + result.insertId + ', "id" : "' + farmacoID + '"}')
        })
    })
})

/* inserisce in esame, poi prende l'id e inserisce in esamiesame esamiid(fromWhat.args.examinations.id) e esameid(id) */
app.post( "/api/save/addPosologia", (req,res)=>{
    const posologia = req.body.posologia,
        farmacoID = req.body.farmacoID;
    let sqlINSERT =
        "INSERT INTO posologia(posologia) " +
        "VALUES('" + posologia + "')";


    db.query(sqlINSERT, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'inserimento della posologia" });
        }
        const posologiaID = result.insertId;
        let sqlINSERT =
            "INSERT INTO farmacoposologia(farmacoid,posologiaid) " +
            "VALUES(" + farmacoID + "," + posologiaID +")";

        db.query(sqlINSERT, (error,result)=>{
            res.send('{"msg":"ok","description":"posologia inserita", "idparent":' + result.insertId + ', "id" : "' + posologiaID + '"}')
        })
    })
})

app.post( "/api/save/addIndicazioni", (req,res)=>{
    const indicazioni = req.body.indicazioni,
        esameID = req.body.esameID;
    let sqlINSERT =
        "INSERT INTO esameindicazioni(indicazionispecifiche) " +
        "VALUES('" + indicazioni + "')";


    db.query(sqlINSERT, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'inserimento della posologia" });
        }
        const indicazioniID = result.insertId;
        let sqlINSERT =
            "INSERT INTO esameindicazioniesame(esameid,indicazioniid) " +
            "VALUES(" + esameID + "," + indicazioniID +")";

        db.query(sqlINSERT, (error,result)=>{
            res.send('{"msg":"ok","description":"posologia inserita", "idparent":' + result.insertId + ', "id" : "' + indicazioniID + '"}')
        })
    })
})

// 🔥 **AGGIUNTA: WebSocket**
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress;
    //console.log(`Nuova connessione WebSocket da ${ip}`);

    ws.send(JSON.stringify({ message: "Connessione WebSocket stabilita" }));

    // Quando il server riceve un messaggio dal client
    ws.on("message", (message) => {
        //console.log(`Messaggio ricevuto: ${message}`);

        // Gestisci il messaggio in base al tipo di richiesta
        try {
            const request = JSON.parse(message); // Assumiamo che il messaggio sia un JSON

            switch (request.type) {
                case "get_all_patients":
                    getAllPatients(ws);
                    break;

                case "get_patient":
                    if (request.codicePaziente) {
                        getPatient(ws, request.codicePaziente);
                    } else {
                        ws.send(JSON.stringify({ error: "Codice paziente mancante" }));
                    }
                    break;

                case "get_exam_list":
                    getExamList(ws);
                    break;

                default:
                    ws.send(JSON.stringify({ error: "Richiesta non valida" }));
            }
        } catch (err) {
            ws.send(JSON.stringify({ error: "Errore nel parsing della richiesta" }));
        }
    });


    ws.on("close", () => {
        //console.log(`WebSocket chiuso per ${ip}`);
    });
});

/*
const serverPath = "3001";
app.listen(serverPath, ()=>{})
*/

// Avvia il server HTTP (Express + WebSocket)
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`✅ Server HTTPS e WSS in ascolto su https://mylocalserver.local:${PORT} e https://localhost:${PORT}`);
});