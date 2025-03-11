const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const generateDoc = (nomeUtente, indirizzo, templatePath, outputDir) => {
    return new Promise((resolve, reject) => {
        try {
            // Carica il template .docx
            const content = fs.readFileSync(templatePath, 'binary');
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
            const outputDocx = doc.getZip().generate({ type: 'nodebuffer' });

            // Crea la cartella temporanea per il file docx
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            // Definisci il percorso del file .docx
            const docxPath = path.join(outputDir, `visita-ginecologica-${nomeUtente}.docx`);

            // Salva il file .docx sul server
            fs.writeFileSync(docxPath, outputDocx);

            // Aggiungi il percorso di LibreOffice (soffice) al PATH (puoi configurarlo in base al sistema)
            const libreOfficePath = 'C:\\Program Files\\LibreOffice\\program'; // Adatta per il tuo sistema
            const command = `"${path.join(libreOfficePath, 'soffice.exe')}" --headless --convert-to pdf --outdir ${outputDir} ${docxPath}`;

            // Esegui il comando di conversione
            exec(command, { env: { PATH: process.env.PATH + `:${libreOfficePath}` } }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Errore nella conversione: ${stderr}`);
                    return reject(new Error('Errore durante la conversione del documento in PDF'));
                }

                // Percorso del PDF generato (usando il nome dell'utente)
                const pdfPath = path.join(outputDir, `visita-ginecologica-${nomeUtente}.pdf`);

                // Verifica che il PDF sia stato creato
                if (fs.existsSync(pdfPath)) {
                    const pdfData = fs.readFileSync(pdfPath);
                    resolve({ pdfData, filename: `visita-ginecologica-${nomeUtente}.pdf` });  // Restituisci anche il nome del file
                } else {
                    console.error('Errore: Il PDF non è stato trovato.');
                    reject(new Error('Errore durante la creazione del PDF.'));
                }
            });

        } catch (error) {
            console.error('Errore durante la creazione o la stampa del documento:', error);
            reject(new Error('Errore nel generare il documento o nel convertirlo in PDF'));
        }
    });
};
module.exports = {
    generateDoc
};
