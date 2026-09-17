RUFY BUILDING — UPDATE v1.3

FILE DA CARICARE NELLA ROOT DEL REPOSITORY GITHUB
1. import-csv.js      -> SOSTITUISCI il file esistente
2. sw.js              -> SOSTITUISCI il file esistente
3. features-v13.js    -> AGGIUNGI questo nuovo file

NON modificare o cancellare app.js, index.html, styles.css, manifest o icone.
L'aggiornamento non cancella il database IndexedDB locale.

NUOVE FUNZIONI
- Storico: pulsante "Modifica allenamento" su ogni seduta.
- Modifica di esercizio, stato, serie, kg, reps, RIR, modalità peso e note.
- Possibilità di aggiungere o rimuovere esercizi e serie in una seduta storica.
- Modalità "Peso: per manubrio" durante l'allenamento.
  Esempio: inserendo 5 kg viene mostrato nello storico come 5-5 kg.
- La modalità per manubrio viene ricordata per lo stesso esercizio nelle sedute successive.
- Backup JSON automatico dopo ogni nuova seduta salvata.
- Backup JSON automatico dopo ogni modifica di una seduta storica.
- CSV aggiornato con la colonna "modalita_peso".
- I vecchi CSV restano importabili.

DOPO IL CARICAMENTO SU GITHUB
1. Attendi che GitHub Pages aggiorni il sito.
2. Apri Rufy Building dal browser/PWA.
3. Chiudi e riapri una volta la PWA per permettere al service worker v1.3 di sostituire la cache precedente.
4. Se Android/Chrome chiede il permesso per i download automatici, consentilo: serve per salvare il backup JSON dopo ogni seduta/modifica.

TEST RAPIDO CONSIGLIATO
A. Apri un allenamento e sulle Alzate laterali premi "Peso: totale" per passare a "Peso: per manubrio".
B. Inserisci 5 kg e salva. Verifica che venga scaricato un file rufy-building-auto-backup-salvataggio-....json.
C. Vai in Storico: il carico deve apparire come 5-5 kg e deve esserci "Modifica allenamento".
D. Apri Modifica allenamento, cambia una nota o una serie e salva.
E. Verifica il secondo backup rufy-building-auto-backup-modifica-....json.
F. Esporta CSV: deve comparire la colonna modalita_peso con "per_manubrio" dove usato.
