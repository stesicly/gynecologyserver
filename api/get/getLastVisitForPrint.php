<?php
require "../connect.php";

    $request_body = file_get_contents('php://input');
    $data = json_decode($request_body);

    $codicePaziente = $data->codicePaziente;
    $nomeTabella = $data->nomeTabella;
    $codiceVisita = $data->codiceVisita;
    $testForLast = (!is_nan($codiceVisita) && $codiceVisita !== -1) ? " and id=" . $codiceVisita . " " : " ";

    switch ($nomeTabella) {
        case "ginecologica":
            $query =
                "SELECT id, contraccezione.Tipo as `Contraccezione`, `TerOrmRad`, `PatGinPregr`, `IntervGin`, `UltimoCPT`," .
                "`Esito`, `UltimaMx`, `EsitoMx`, `DataVisitaGin`, `UMGin`, motivovisita.Tipo as `MotivoVisita`, " .
                "sintomi.Tipo as `Sintomi`, genesterni.Tipo as `GenEsterni`, vagina.Tipo as `Vagina`, `ColloUtero`, " .
                "`CorpoUtero`, `Annessi`, `Addome`, `Speculum`, seno.Tipo as `Seno`, `Prescrizioni`, `Accertamenti`, `NoteGin`, `ConclInd`," .
                "ecooffice.Tipo as 'ecooffice', utero, endometrio, annessodx, annessosx " .
                "FROM `ginecologica` " .
                "LEFT JOIN contraccezione ON ginecologica.Contraccezione=contraccezione.Codice " .
                "LEFT JOIN motivovisita ON ginecologica.MotivoVisita=motivovisita.Codice " .
                "LEFT JOIN sintomi ON ginecologica.Sintomi=sintomi.Codice " .
                "LEFT JOIN genesterni ON ginecologica.GenEsterni=genesterni.Codice " .
                "LEFT JOIN vagina ON ginecologica.Vagina=vagina.Codice " .
                "LEFT JOIN seno ON ginecologica.Seno=seno.Codice " .
                "LEFT JOIN ecooffice ON ginecologica.ecooffice=ecooffice.Codice " .
                "WHERE CodicePaz=" . $codicePaziente . $testForLast . " ORDER BY id DESC LIMIT 1";
            break;

        case "ostetrica":
            $query =
                "SELECT `id`, `CodicePaz`, `DataVisitaOst`, motivovisitaost.Tipo as `MotivoVisitaOst`, " .
                "anamposnegh.Tipo as `HIVOst`, anamidrs.Tipo as `RosoliaOst`, epatiteb.Tipo as `EpatiteBOst`, `dataEpB`, " .
                "anamposneg.Tipo as `EpatiteCOst`, `dataEpC`, anamidr.Tipo as`ToxoOst`, trattotal.Tipo as `TrattoTalOst`, `dataUltimi`, " .
                "`UltimiEsami`, `DataUltimaEcog`, `UltimaEcog`, `PAOS`, `BCF`, `Edemi`, addome.Tipo as `AddomeOst`, colloutero.Tipo as `ColloUtOst`, " .
                "corpoutero.Tipo as `CorpoUtOst`, speculum.Tipo as `SpeculumOst`,partepresentata.Tipo as `PartePresentata`, " .
                "situazioneost.Tipo as `Situazione`, membrane.Tipo as `Membrane`, esbattvag.Tipo as `EsBattVag`, `UMDich`, `EPPDich`, `UmEco`, `EPPEco`, " .
                "`Prescrizioni`, `Accertamenti`, `NoteOst`, `ConclInd`, testintcomb, datatestintcomb, testgenetico.Tipo as 'testgenvalue' , " .
                "testgen, datatestgen, ecoofficeost  " .
                "FROM `ostetrica` " .
                "LEFT JOIN motivovisitaost ON ostetrica.MotivoVisitaOst=motivovisitaost.Codice " .
                "LEFT JOIN addome ON ostetrica.AddomeOst=addome.Codice " .
                "LEFT JOIN anamposnegh ON ostetrica.HIVOst=anamposnegh.Codice " .
                "LEFT JOIN anamidrs ON ostetrica.RosoliaOst=anamidrs.Codice " .
                "LEFT JOIN colloutero ON ostetrica.ColloUtOst=colloutero.Codice " .
                "LEFT JOIN corpoutero ON ostetrica.CorpoUtOst=corpoutero.Codice " .
                "LEFT JOIN epatiteb ON ostetrica.EpatiteBOst=epatiteb.Codice " .
                "LEFT JOIN anamposneg ON ostetrica.EpatiteCOst=anamposneg.Codice" .
                "LEFT JOIN anamidr ON ostetrica.ToxoOst=anamidr.Codice " .
                "LEFT JOIN esbattvag ON ostetrica.EsBattVag=esbattvag.Codice" .
                "LEFT JOIN membrane ON ostetrica.Membrane=membrane.Codice " .
                "LEFT JOIN partepresentata ON ostetrica.PartePresentata=partepresentata.Codice " .
                "LEFT JOIN situazioneost ON ostetrica.Situazione=situazioneost.Codice " .
                "LEFT JOIN speculum ON ostetrica.SpeculumOst=speculum.Codice " .
                "LEFT JOIN trattotal ON ostetrica.TrattoTalOst=trattotal.Codice " .
                "LEFT JOIN testgenetico ON ostetrica.testgenvalue=testgenetico.Codice " .
                "WHERE CodicePaz=" . $codicePaziente . $testForLast . "ORDER BY id DESC LIMIT 1";
            break;

        case "senologica":
            $query =
                "SELECT * FROM senologica " .
                "WHERE CodicePaz=" . $codicePaziente . $testForLast . "ORDER BY id DESC LIMIT 1";
            break;

        case "colposcopia":
            $query =
                "SELECT * FROM colposcopia " .
                "WHERE CodicePaz=" . $codicePaziente .
                " ORDER BY CodicePaz DESC";
            break;
    }


echo generateJsonFromCall($query, $conn);


?>