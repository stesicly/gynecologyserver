const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const { createProxyMiddleware } = require('http-proxy-middleware');


const db = mysql.createPool({
    host    : "localhost",
    user    : "root",
    password: "",
    port : 3306,
    database: "gynecology"
})
/*
const db2 = mysql.createPool({
    host    : "31.11.39.100",
    user    : "Sql1702274@62.149.186.129",
    password: "Mh$Dom4Mh$Dom4",
    database: "Sql1702274_1",
    port : 3306,
    connectTimeout : 5000,
    acquireTimeout: 5000
})
// dopo lo user @62.149.186.129/*
// *  host: config.mysql.host,
//       port: config.mysql.port,
//       user: config.mysql.user,
//       password: config.mysql.password,
//       database: config.mysql.database,
//       connectionLimit: config.mysql.connectionLimit,
//       ssl: config.mysql.ssl
// * */

/* reverse proxy
app.use("/api/*", createProxyMiddleware({
    target: "http://localhost:80", // Indirizzo del server PHP (XAMPP)
    changeOrigin: true
})); */

app.use(cors());
app.use(express.json())
app.use(bodyParser.urlencoded({extended:true}))
app.get("/", (require, response) => {
    /*const sqlINSERT = "INSERT INTO Vdrl (Codice, Tipo) VALUES (3, 'Test')"
    db.query(sqlSELECT, (error,result)=>{
    })*/
    response.send("<h1>hello worldddd {process.env.NODE_ENV}</h1>")
})

app.post("/api/save/addItemToDropDownTable", (req, res)=>{

    const value = req.body.value,
          tableName = req.body.tableName;

    const verifySQL = "SELECT EXISTS (" +
        "    SELECT 1" +
        "    FROM information_schema.columns" +
        "    WHERE table_name = '" + tableName + "'" +
        "    AND (column_name = 'CodicePaz' OR column_name = 'Codice' OR column_name = 'titolo')" +
        ") AS ispresente;"

    //console.log("addItemToDropDownTable ver===> ", verifySQL)

    db.query(verifySQL, (error,result)=>{

        //console.log("addItemToDropDownTable result===> ", result, result.ispresente, result[0].ispresente)
        const fieldName = result[0].ispresente>0 ? "Tipo" : "titolo";
        const sqlINSERT = "INSERT INTO " + tableName + " (" + fieldName + ") VALUES ('" + value + "')";

        //console.log("addItemToDropDownTable ins===> ", sqlINSERT)

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
    console.log("sqlSelect===> ", verifySQL);

    db.query(verifySQL, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'estrazione del campo della tabella" });
        }
        if (!error && result && result[0] && result[0].name){
            const fieldName = result[0].name
            console.log("nomeCampo==> ", fieldName);

            const sqlDELETE = "DELETE FROM " + tableName + " WHERE " + fieldName + " = '" + value + "'";

            console.log("DELETE query===> ", sqlDELETE)

            db.query(sqlDELETE, (error,result)=>{
                res.send(result)
            })
        }
    })

});

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

app.post("/api/get/listFromTable2", (req,res)=>{
    const nomeTabella = req.body.nomeTabella;
    const sqlSELECT =
        "SELECT * " +
        "FROM " +
        nomeTabella  ;

    //console.log("listaFromTable===> ", sqlSELECT)
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
    console.log("sqlSelect===> ", sqlSelect);

    db.query(sqlSelect, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'estrazione del campo della tabella" });
        }
        if (!error && result && result[0] && result[0].name){
            const nomeCampo = result[0].name
            console.log("nomeCampo==> ", nomeCampo);

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
      // console.log("generate sessionId====>", sessionId)
        if (!error && result && result[0] && result[0].id && !isNaN(result[0].id)){
                sqlSELECT =
                    "INSERT INTO loggeduser(user, sessionid, ip) " +
                    "VALUES(" + result[0].id + ",'" + sessionId + "','" + req.ip + "')";  /**/


                db.query(sqlSELECT, (error,result)=>{
                    if (!error && result && result[0]){
                        //console.log("fatto");//res.send('{"message":"ok"}')
                    }
                })

        }
        res.send('{"msg":"ok","description":"utente valido",  ' +
            '"userid":"' + result[0].id + '", "sessionid" : "' + sessionId + '"}')
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

    //console.log("GET VISITE ===> ", sqlSELECT)
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

    //console.log("GET first VISIT ===> ", sqlSELECT)
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
    //console.log("cancella visita===> ", sqlSELECT)
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

app.post("/api/get/getLastVisitForPrint", (req,res)=>{
    const
        codicePaziente = req.body.codicePaziente,
        nomeTabella = req.body.nomeTabella,
        codiceVisita = req.body.codiceVisita,
        testForLast = !isNaN(codiceVisita) && codiceVisita!==-1 ? " and id=" + codiceVisita + " " : " "

    let sqlSELECT;
    switch(nomeTabella){
        case "ginecologica":
            sqlSELECT = "SELECT id, contraccezione.Tipo as `Contraccezione`, `TerOrmRad`, `PatGinPregr`, `IntervGin`, `UltimoCPT`, " +
                "`Esito`, `UltimaMx`, `EsitoMx`, `DataVisitaGin`, `UMGin`, motivovisita.Tipo as `MotivoVisita`, " +
                "sintomi.Tipo as `Sintomi`, genesterni.Tipo as `GenEsterni`, vagina.Tipo as `Vagina`, `ColloUtero`, " +
                "`CorpoUtero`, `Annessi`, `Addome`, `Speculum`, seno.Tipo as `Seno`, `Prescrizioni`, `Accertamenti`, `NoteGin`, `ConclInd`," +
                "ecooffice.Tipo as 'ecooffice', utero, endometrio, annessodx, annessosx " +
                "FROM `ginecologica` " +
                "LEFT JOIN contraccezione ON ginecologica.Contraccezione=contraccezione.Codice " +
                "LEFT JOIN motivovisita ON ginecologica.MotivoVisita=motivovisita.Codice " +
                "LEFT JOIN sintomi ON ginecologica.Sintomi=sintomi.Codice " +
                "LEFT JOIN genesterni ON ginecologica.GenEsterni=genesterni.Codice " +
                "LEFT JOIN vagina ON ginecologica.Vagina=vagina.Codice " +
                "LEFT JOIN seno ON ginecologica.Seno=seno.Codice " +
                "LEFT JOIN ecooffice ON ginecologica.ecooffice=ecooffice.Codice " +
                "WHERE CodicePaz=" + codicePaziente + testForLast +
                "ORDER BY id DESC LIMIT 1";
            break;

        case "ostetrica":
            sqlSELECT = "SELECT `id`, `CodicePaz`, `DataVisitaOst`, motivovisitaost.Tipo as `MotivoVisitaOst`, " +
                        "anamposnegh.Tipo as `HIVOst`, anamidrs.Tipo as `RosoliaOst`, epatiteb.Tipo as `EpatiteBOst`, `dataEpB`, " +
                        "anamposneg.Tipo as `EpatiteCOst`, `dataEpC`, anamidr.Tipo as`ToxoOst`, trattotal.Tipo as `TrattoTalOst`, `dataUltimi`, " +
                        "`UltimiEsami`, `DataUltimaEcog`, `UltimaEcog`, `PAOS`, `BCF`, `Edemi`, addome.Tipo as `AddomeOst`, colloutero.Tipo as `ColloUtOst`, " +
                        "corpoutero.Tipo as `CorpoUtOst`, speculum.Tipo as `SpeculumOst`,partepresentata.Tipo as `PartePresentata`, " +
                        "situazioneost.Tipo as `Situazione`, membrane.Tipo as `Membrane`, esbattvag.Tipo as `EsBattVag`, `UMDich`, `EPPDich`, `UmEco`, `EPPEco`, " +
                        "`Prescrizioni`, `Accertamenti`, `NoteOst`, `ConclInd`, testintcomb, datatestintcomb, testgenetico.Tipo as 'testgenvalue' , " +
                        "testgen, datatestgen, ecoofficeost  " +
                "FROM `ostetrica` " +
                "LEFT JOIN motivovisitaost ON ostetrica.MotivoVisitaOst=motivovisitaost.Codice " +
                "LEFT JOIN addome ON ostetrica.AddomeOst=addome.Codice " +
                "LEFT JOIN anamposnegh ON ostetrica.HIVOst=anamposnegh.Codice " +
                "LEFT JOIN anamidrs ON ostetrica.RosoliaOst=anamidrs.Codice " +
                "LEFT JOIN colloutero ON ostetrica.ColloUtOst=colloutero.Codice " +
                "LEFT JOIN corpoutero ON ostetrica.CorpoUtOst=corpoutero.Codice " +
                "LEFT JOIN epatiteb ON ostetrica.EpatiteBOst=epatiteb.Codice " +
                "LEFT JOIN anamposneg ON ostetrica.EpatiteCOst=anamposneg.Codice " +
                "LEFT JOIN anamidr ON ostetrica.ToxoOst=anamidr.Codice " +
                "LEFT JOIN esbattvag ON ostetrica.EsBattVag=esbattvag.Codice " +
                "LEFT JOIN membrane ON ostetrica.Membrane=membrane.Codice " +

                "LEFT JOIN partepresentata ON ostetrica.PartePresentata=partepresentata.Codice " +
                "LEFT JOIN situazioneost ON ostetrica.Situazione=situazioneost.Codice " +

                "LEFT JOIN speculum ON ostetrica.SpeculumOst=speculum.Codice " +
                "LEFT JOIN trattotal ON ostetrica.TrattoTalOst=trattotal.Codice " +
                "LEFT JOIN testgenetico ON ostetrica.testgenvalue=testgenetico.Codice " +
                "WHERE CodicePaz=" + codicePaziente + testForLast +
                "ORDER BY id DESC LIMIT 1";
            break;

        case "senologica":
            sqlSELECT = "SELECT * FROM senologica " +
                "WHERE CodicePaz=" + codicePaziente +  testForLast +
                "ORDER BY id DESC LIMIT 1";
            break;

        case "colposcopia":
            sqlSELECT = "SELECT * FROM colposcopia " +
                "WHERE CodicePaz=" + codicePaziente + " " +
                "ORDER BY CodicePaz DESC";
            break;
    }


   //console.log("GET LAST VISIT TO PRINT===> ", sqlSELECT)
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

    ////console.log("GET COLPOSCOLPIA===> ", sqlSELECT)
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
  //console.log("save patient===>", sqlSELECT)
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

          console.log("INSERT ===> ", sqlSELECT)
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
           console.log("UPDATE ===> ", sqlSELECT)
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

    //console.log("update patient===>", sqlSELECT)

    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
})

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
    //console.log("getPatient====> ",sqlSELECT)
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
        "FROM paziente LEFT JOIN elencocomuni ON paziente.LuogoNascita=elencocomuni.CodiceComune LEFT JOIN elencoprovincie ON elencoprovincie.CodiceProvincia=elencocomuni.CodiceProvincia LEFT JOIN elencocomuni as elencocitta ON paziente.Città=elencocitta.CodiceComune LEFT JOIN elencoprovincie as elencoprov ON elencoprov.CodiceProvincia=elencocitta.CodiceProvincia ORDER BY Cognome, Nome";
    db.query(sqlSELECT, (error,result)=>{
        res.send(result)
    })
});

app.get("/api/get/listaEsami", (req,res)=>{
    const sqlSELECT = "SELECT * from listaesami"
    /*SELECT esamiraccoglitore.id as folderID, esamiraccoglitore.titolo as foldertitle, esami.id, esami.titolo, esame.id, esame.nome FROM esamiraccoglitore left JOIN esamiraccoglitoreesami ON esamiraccoglitore.id=esamiraccoglitoreesami.esameraccoglitoreid LEFT JOIN esami ON esami.id=esamiraccoglitoreesami.esamiid LEFT JOIN esamiesame ON esamiesame.esamiid=esami.id LEFT JOIN esame ON esame.id=esamiesame.esameid;*/
    //console.log("listaEsami===> ", sqlSELECT)
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
            //console.log("result b===>", result)
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
            //console.log("result b===>", result)
            res.send('{"msg":"ok","description":"esame inserito", "idparent":' + result.insertId + ', "id" : "' + esameID + '"}')
        })
    })
})




app.get("/api/get/listaPrescrizioni", (req,res)=>{
    const sqlSELECT = "SELECT * From listaprescrizioni";

     //console.log("lista prescrizioni===> ", sqlSELECT)
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
            //console.log("result b===>", result)
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

    //console.log("inserimento farmaco===> ==> ", sqlINSERT)

    db.query(sqlINSERT, (error,result)=>{
        if (error) {
            return res.status(500).json({ error: "Errore durante l'inserimento dell'esame" });
        }
        const farmacoID = result.insertId;
        let sqlINSERT =
            "INSERT INTO prescrizionifarmaco(prescrizioniid,farmacoid) " +
            "VALUES(" + esamiID + "," + farmacoID +")";

        //console.log("inserimento prescrizionifarmaco===>", sqlINSERT)

        db.query(sqlINSERT, (error,result)=>{
            //console.log("result b===>", result)
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
            //console.log("result b===>", result)
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
            //console.log("result b===>", result)
            res.send('{"msg":"ok","description":"posologia inserita", "idparent":' + result.insertId + ', "id" : "' + indicazioniID + '"}')
        })
    })
})
const serverPath = "3001";
app.listen(serverPath, ()=>{})
