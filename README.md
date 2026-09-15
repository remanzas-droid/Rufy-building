# Rufy-building — PWA V1.1

## Pubblicazione consigliata: GitHub Pages

Questa cartella è pronta per essere pubblicata direttamente come sito statico.

1. Crea un nuovo repository GitHub, per esempio `rufy-building`.
2. Carica nella radice del repository tutti i file di questa cartella:
   - index.html
   - styles.css
   - app.js
   - manifest.webmanifest
   - sw.js
   - icon.svg
   - .nojekyll
3. Vai in **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**.
5. Seleziona il branch **main** e la cartella **/(root)**.
6. Salva.
7. GitHub Pages pubblicherà l'app su un indirizzo del tipo:
   `https://TUO-USERNAME.github.io/rufy-building/`
8. Apri quell'indirizzo su Android e usa l'opzione del browser per installare la PWA.

## Dati e privacy
- Le sedute sono salvate localmente in IndexedDB nel browser/dispositivo.
- Nessun cloud.
- Nessun account interno all'app.
- Puoi esportare lo storico in CSV.
- Puoi esportare/importare un backup JSON dalla modalità “Modifica programma”.

## Funzioni V1
- Home con prossimo A/B/C, ultima seduta e recupero recente
- Rotazione A→B→C automatica + scelta manuale
- Check sonno/fatica/DOMS/stress/dolore
- Registrazione kg/reps/RIR
- Precompilazione dall’ultima esecuzione
- Serie extra
- Esercizi saltati/ridotti/sostituiti
- Esercizi personalizzati
- Storico separato
- Statistiche essenziali
- Serie per gruppo muscolare
- Segnale semplice di possibile deload
- Modifica programma A/B/C
- Funzionamento offline dopo il primo caricamento

## Novità V1.1
- Nome installato: Rufy-building
- Icone Android 192/512 e splash coerente col tema dark/lapislazzuli
- Eliminazione di una seduta dallo Storico con doppia conferma
- Ricalcolo automatico della rotazione A/B/C dopo l'eliminazione
