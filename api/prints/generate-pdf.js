const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const ginecologica = () => {

}

const sheet = {
    default : {
        path : "./api/prints/test-stampa.pdf",
        printFields : function(page, nomeUtente, indirizzo, helveticaFont){
            page.drawText(nomeUtente, {
                x: 270,
                y: 482,
                size: 12,
                font: helveticaFont,
            });

            page.drawText(indirizzo, {
                x: 100,
                y: 450,
                size: 12,
                font: helveticaFont,
            });
            return page
        }
    },
    ginecologica : {
        path : "./api/prints/ginecologica.pdf",
        printFields : function(page, nomeUtente, indirizzo, helveticaFont){
            page.drawText(nomeUtente, {
                x: 270,
                y: 482,
                size: 12,
                font: helveticaFont,
            });

            page.drawText(indirizzo, {
                x: 100,
                y: 450,
                size: 12,
                font: helveticaFont,
            });
        }
    }
}

async function generatePdf({visita, nomeUtente, indirizzo}) {
    try {
        const pdfPath = path.resolve(sheet?.[visita]?.path || sheet.default.path);

        if (!fs.existsSync(pdfPath)) {
            throw new Error(`File non trovato: ${pdfPath}`);
        }

        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPages()[0];

        // Carica il font corretto
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        //sheet?.[visita]?.printFields(page, nomeUtente, indirizzo, helveticaFont);
        // Aggiungi testo al PDF con il font corretto

        page.drawText(nomeUtente, {
            x: 270,
            y: 482,
            size: 12,
            font: helveticaFont,
        });

        page.drawText(indirizzo, {
            x: 100,
            y: 450,
            size: 12,
            font: helveticaFont,
        });
        const modifiedPdfBytes = await pdfDoc.save();
        return Buffer.from(modifiedPdfBytes);
    } catch (error) {
        console.error("Errore nella generazione del PDF:", error.message);
        throw error;
    }
}

module.exports = {
    generatePdf
};
