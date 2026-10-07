# ASL Napoli · siti del gioco di ruolo

Contiene due pagine:
- `public/fad.html` — Portale FAD (nickname, admin, moduli, chat)
- `public/esame.html` — Esame Teorico Soccorritori (codici di accesso)

## IMPORTANTE: funzioni che NON funzioneranno fuori da Claude

Entrambe le pagine, per salvare i dati condivisi (chi è collegato, i messaggi
di chat, i codici d'esame generati, i punteggi), usano in alcuni punti del
codice JavaScript queste chiamate:

    await claude.use('db')
    await claude.use('room')

L'oggetto globale `claude` esiste SOLO quando la pagina è aperta dentro
Claude.ai (claude.ai/artifact/...). Su Railway, o su qualunque altro hosting,
quell'oggetto non esiste: ogni chiamata a `claude.use(...)` fallirà (la
pagina non si romperà, perché sono tutte dentro blocchi try/catch, ma le
funzioni che dipendono da quei dati smetteranno di funzionare), in pratica:

- **fad.html**: la sincronizzazione live tra istruttore e partecipanti, la
  lista dei presenti e la chat non funzioneranno. Login, scelta modulo e
  visualizzazione della presentazione selezionata invece restano operativi
  (sono gestiti solo con variabili locali alla pagina).
- **esame.html**: i codici d'accesso generati dall'istruttore e i risultati
  degli esami non verranno salvati da nessuna parte: ogni candidato potrebbe
  entrare con qualunque codice, e i punteggi andranno persi al ricaricamento
  della pagina.

## Come avviare su Railway

1. Carica questa cartella in un repository Git (GitHub/GitLab) e collega il
   repository a un nuovo progetto Railway, oppure usa la CLI (`railway up`)
   da questa cartella.
2. Railway rileva `package.json`, esegue `npm install` e poi `npm start`.
3. Il server Express pubblica le pagine come file statici su `/`,
   `/fad.html` e `/esame.html`. Nessuna variabile d'ambiente è richiesta per
   questo avvio "solo vetrina".

Questo basta per ospitare le pagine, ma — per le ragioni spiegate sopra — le
funzioni di salvataggio condiviso non funzioneranno finché non si collega un
backend reale (vedi sotto).

## Per farle funzionare davvero su Railway

Serve sostituire ogni `claude.use('db')` / `claude.use('room')` con vere
chiamate a un backend: per esempio un paio di endpoint Express
(`GET/POST /api/state`, `GET/POST /api/codes`) appoggiati a un database
(Railway offre un plugin Postgres o Redis con un clic), più un sistema di
notifica in tempo reale (WebSocket, per esempio con `socket.io`) al posto
di `room`. È un lavoro di riscrittura mirato ma non enorme: se mi dici quale
delle due pagine ti serve rendere funzionante per prima, ti preparo la
versione con backend reale pronta per il deploy.
