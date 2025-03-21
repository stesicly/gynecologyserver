const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const queryForPatient =  `
        SELECT 
            LTRIM(Cognome) as Cognome,
            LTRIM(Nome) as Nome,
            RTRIM(LTRIM(elencocomuni.NomeComune)) as NomeComune,
            elencoprovincie.SiglaProvincia as Provincia,
            RTRIM(LTRIM(elencocitta.NomeComune)) as citta,
            elencocitta.CAP,
            elencoprov.SiglaProvincia as provcitta,
            paziente.GruppoSanguigno as grsang,
            paziente.*
        FROM 
            paziente
        LEFT JOIN 
            elencocomuni ON paziente.LuogoNascita=elencocomuni.CodiceComune
        LEFT JOIN 
            elencoprovincie ON elencoprovincie.CodiceProvincia=elencocomuni.CodiceProvincia
        LEFT JOIN 
            elencocomuni as elencocitta ON paziente.Città=elencocitta.CodiceComune
        LEFT JOIN 
            elencoprovincie as elencoprov ON elencoprov.CodiceProvincia=elencocitta.CodiceProvincia
        WHERE 
            CodicePaz = ?
    `

function createQueryForPrint(nomeTabella, codicePaziente, codiceVisita){
    let testForLast = !isNaN(codiceVisita) && codiceVisita!==-1 ? " and id=" + codiceVisita + " " : " "
    switch(nomeTabella){
        case "ginecologica":
            return `
                    SELECT ginecologica.*,
                           contraccezione.Tipo as "contraccezione", 
                           DataVisitaGin as dataVisita,
                           ecooffice.Tipo as 'ecooffice',
                           genesterni.Tipo as "genEsterni",
                           motivovisita.Tipo as "motivoVisita",
                           seno.Tipo as "seno",
                           sintomi.Tipo as "sintomi", 
                           vagina.Tipo as "vagina"
                    FROM ginecologica
                             LEFT JOIN contraccezione ON ginecologica.Contraccezione=contraccezione.Codice
                             LEFT JOIN motivovisita ON ginecologica.MotivoVisita=motivovisita.Codice
                             LEFT JOIN sintomi ON ginecologica.Sintomi=sintomi.Codice
                             LEFT JOIN genesterni ON ginecologica.GenEsterni=genesterni.Codice
                             LEFT JOIN vagina ON ginecologica.Vagina=vagina.Codice
                             LEFT JOIN seno ON ginecologica.Seno=seno.Codice
                             LEFT JOIN ecooffice ON ginecologica.ecooffice=ecooffice.Codice
                    WHERE CodicePaz=${codicePaziente} ${testForLast}
                    ORDER BY id DESC LIMIT 1`;

        case "ostetrica":
            return `
                    SELECT ostetrica.*,
                           DataVisitaOst as dataVisita,
                           motivovisitaost.Tipo as "MotivoVisitaOst",
                           anamposnegh.Tipo as "HIVOst", 
                           anamidrs.Tipo as "RosoliaOst", 
                           epatiteb.Tipo as "EpatiteBOst", 
                           anamposneg.Tipo as "EpatiteCOst", 
                           anamidr.Tipo as "ToxoOst", 
                           trattotal.Tipo as "TrattoTalOst",
                           addome.Tipo as "AddomeOst",
                           colloutero.Tipo as "ColloUtOst", 
                           corpoutero.Tipo as "CorpoUtOst", 
                           speculum.Tipo as "SpeculumOst",
                           partepresentata.Tipo as "PartePresentata", 
                           situazioneost.Tipo as "Situazione", 
                           membrane.Tipo as "Membrane",
                           esbattvag.Tipo as "EsBattVag",
                           testgenetico.Tipo as "testgenvalue"
                    FROM ostetrica
                             LEFT JOIN motivovisitaost ON ostetrica.MotivoVisitaOst=motivovisitaost.Codice
                             LEFT JOIN addome ON ostetrica.AddomeOst=addome.Codice
                             LEFT JOIN anamposnegh ON ostetrica.HIVOst=anamposnegh.Codice
                             LEFT JOIN anamidrs ON ostetrica.RosoliaOst=anamidrs.Codice
                             LEFT JOIN colloutero ON ostetrica.ColloUtOst=colloutero.Codice
                             LEFT JOIN corpoutero ON ostetrica.CorpoUtOst=corpoutero.Codice
                             LEFT JOIN epatiteb ON ostetrica.EpatiteBOst=epatiteb.Codice
                             LEFT JOIN anamposneg ON ostetrica.EpatiteCOst=anamposneg.Codice
                             LEFT JOIN anamidr ON ostetrica.ToxoOst=anamidr.Codice
                             LEFT JOIN esbattvag ON ostetrica.EsBattVag=esbattvag.Codice
                             LEFT JOIN membrane ON ostetrica.Membrane=membrane.Codice
                             LEFT JOIN partepresentata ON ostetrica.PartePresentata=partepresentata.Codice
                             LEFT JOIN situazioneost ON ostetrica.Situazione=situazioneost.Codice
                             LEFT JOIN speculum ON ostetrica.SpeculumOst=speculum.Codice
                             LEFT JOIN trattotal ON ostetrica.TrattoTalOst=trattotal.Codice
                             LEFT JOIN testgenetico ON ostetrica.testgenvalue=testgenetico.Codice
                    WHERE CodicePaz=${codicePaziente} ${testForLast}
                    ORDER BY id DESC LIMIT 1`;


        case "senologica":
            return `
                    SELECT * FROM senologica
                    WHERE CodicePaz=${codicePaziente} ${testForLast}
                    ORDER BY id DESC LIMIT 1`;

        case "colposcopia":
            return `
                    SELECT * FROM colposcopia
                    WHERE CodicePaz=${codicePaziente}
                    ORDER BY CodicePaz DESC`;

        default:
            return ""

    }
}

const generateDoc = async(db, codicePaz, visita, tableName, templatePath, outputDir) => {

    function execQuery(sql, params) {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
    }

    const queryForVisit = createQueryForPrint(tableName, codicePaz, visita)

    function isValidDate(value) {
        return value instanceof Date && !isNaN(value);
    }
    console.log("queryForVisit===>", queryForVisit)
    return new Promise(async(resolve, reject) => {
        try {
            // Carica il template .docx
            const [resultsForPatient, resultsForVisit] = await Promise.all([
                execQuery(queryForPatient, [codicePaz]),
                execQuery(queryForVisit, [isNaN ? codicePaz : visita])
            ]);

            // Verifica risultati
            if (resultsForPatient.length === 0 || resultsForVisit.length === 0) {
                throw new Error('Dati non trovati');
            }

            console.log("visita====> ", resultsForVisit)

            const paziente = resultsForPatient[0];
            const visitaFromDB =  resultsForVisit[0]
            const nomeUtente = paziente.Cognome + "-" + paziente.Nome;

            // Converti i campi di tipo data in formato leggibile
            Object.keys(visitaFromDB).forEach(key => {
                if (visitaFromDB[key] instanceof Date) {
                    visitaFromDB[key] = isValidDate(visitaFromDB[key]) ? visitaFromDB[key].toLocaleDateString() : null;
                } else if (typeof visitaFromDB[key] === "string" && visitaFromDB[key].includes("T")) {
                    // Gestisce i timestamp SQL in formato stringa (es: "2024-03-20T12:00:00.000Z")
                    let dateValue = new Date(visitaFromDB[key]);
                    visitaFromDB[key] = isValidDate(dateValue) ? dateValue.toLocaleDateString() : visitaFromDB[key];
                }
                if (visitaFromDB[key] === null || visitaFromDB[key] === undefined) {
                    visitaFromDB[key] = '';
                }
            });

            const dati = {
                nomeUtente: `${paziente.Cognome} ${paziente.Nome}`,
                indirizzo: paziente.Via + ", " + paziente.NomeComune,
                ...paziente,
                ...visitaFromDB
            };

            console.log("dati====>")

            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip);

            // Imposta i dati dinamici
            doc.setData(dati);

            // Esegui il rendering del documento
            doc.render();

            // Ottieni il file .docx risultante
            const outputDOC = doc.getZip().generate({ type: 'nodebuffer' });

            // Crea la cartella temporanea per il file docx
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            // Definisci il percorso del file .docx
            const docPath = path.join(outputDir, `visita-${tableName}-${nomeUtente}.docx`);

            // Salva il file .docx sul server
            fs.writeFileSync(docPath, outputDOC);

            // Aggiungi il percorso di LibreOffice (soffice) al PATH (puoi configurarlo in base al sistema)
            const libreOfficePath = 'C:\\Program Files\\LibreOffice\\program'; // Adatta per il tuo sistema
            const command = `"${path.join(libreOfficePath, 'soffice.exe')}" --headless --convert-to pdf --outdir ${outputDir} ${docPath}`;

            // Esegui il comando di conversione
            exec(command, { env: { PATH: process.env.PATH + `:${libreOfficePath}` } }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Errore nella conversione: ${stderr}`);
                    return reject(new Error('Errore durante la conversione del documento in PDF'));
                }

                // Percorso del PDF generato (usando il nome dell'utente)
                const pdfPath = path.join(outputDir, `visita-${tableName}-${nomeUtente}.pdf`);

                // Verifica che il PDF sia stato creato
                if (fs.existsSync(pdfPath)) {
                    const pdfData = fs.readFileSync(pdfPath);
                    resolve({ pdfData, filename: `visita-${tableName}-${nomeUtente}.pdf` });  // Restituisci anche il nome del file
                } else {
                    console.error('Errore: Il PDF non è stato trovato.');
                    reject(new Error('Errore durante la creazione del PDF.'));
                }
            });




        } catch (error) {
            console.error('Errore durante la creazione o la stampa del documento:', error);
            reject(new Error('Errore nel generare il documento o nel convertirlo in PDF'));
        }
    }); // <-- Questo ) chiude la promessa
};




module.exports = {
    createQueryForPrint,
    generateDoc
};
