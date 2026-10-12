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

## Novità V1.4 — seduta recuperabile

- Ogni modifica a kg, reps, RIR, note, serie, esercizi e modalità peso salva subito una bozza locale, senza scaricare backup.
- Dopo una chiusura o un riavvio, Home mostra “Riprendi seduta”. “Chiudi” conserva la bozza; “Scarta seduta” richiede due conferme.
- Una seduta in corso impedisce di sovrascriverla iniziandone un'altra.
- “Salva seduta” registra storico e impostazioni in una sola transazione. Solo dopo il completamento elimina la bozza e crea il backup automatico. Se il salvataggio fallisce la seduta rimane modificabile.
- Ripristinato il caricamento del modulo esistente per modalità peso, modifica storico e backup automatico.
- La bozza resta sullo stesso dispositivo e indirizzo dell'app. Non è un backup: cancellare i dati del sito la elimina. Non recupera dati persi prima dell'aggiornamento.
- Per aggiornare una PWA già installata, aprirla online, chiuderla e riaprirla dopo l'installazione del nuovo service worker. Non cancellare i dati del sito.

## Correzione V1.4.1 — scarta seduta

- Doppia conferma nella stessa finestra dell'app, senza due finestre di conferma bloccanti del browser.
- Dopo lo scarto vengono rimossi anche i controlli della vecchia seduta e azzerata la modalità peso, senza ridisegnare esercizi nascosti.
- I recuperi asincroni della modalità peso non agiscono su sedute chiuse o scartate.
- Annullare uno dei due passaggi conserva la bozza. Dopo la conferma definitiva si può iniziare una nuova seduta o navigare normalmente.
