RUFY BUILDING v1.3.2 — Gestione CSV + Backup completo JSON

CARICAMENTO SU GITHUB
1. Sostituisci index.html con quello di questo pacchetto.
2. Sostituisci sw.js con quello di questo pacchetto.
3. Aggiungi backup-ui-v132.js come nuovo file nella root del repository.
4. NON modificare features-v13.js: deve rimanere la hotfix v1.3.1 già installata.
5. NON modificare app.js, import-csv.js, styles.css, manifest o icone.

DOPO IL COMMIT
- Chiudi completamente Rufy Building sul telefono.
- Riaprila, attendi qualche secondo, chiudila e riaprila una seconda volta per attivare la cache v1.3.2.
- Non cancellare dati o cache dell'app.

NUOVA SEZIONE IN STORICO
Dati CSV:
- Esporta CSV
- Importa CSV
- È pensato per consultare/modificare/trasferire lo storico delle serie.

Backup completo:
- Esporta backup JSON
- Ripristina backup JSON
- Include storico, note, check pre-seduta, programma A/B/C, libreria esercizi e impostazioni.

SICUREZZA RIPRISTINO
Quando selezioni un backup JSON da ripristinare, Rufy Building crea PRIMA un backup JSON di sicurezza dello stato corrente e solo dopo chiede conferma per sostituire i dati.

I backup automatici dopo salvataggio/modifica seduta restano JSON e continuano a funzionare.
