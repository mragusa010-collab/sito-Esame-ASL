# Esame di Teoria · Soccorritori ASL Napoli

Contiene una sola pagina:
- `public/esame.html` — Esame di Teoria (login candidato con credenziali,
  timer 30 minuti, pannello istruttori con gestione domande e candidati)

`public/index.html` reindirizza automaticamente a `/esame.html`.

## IMPORTANTE: funzioni che NON funzioneranno fuori da Claude

La pagina usa, in alcuni punti del codice JavaScript, questa chiamata:

    await claude.use('db')

L'oggetto globale `claude` esiste SOLO quando la pagina è aperta dentro
Claude.ai (claude.ai/artifact/...). Su Railway, o su qualunque altro
hosting, quell'oggetto non esiste: ogni chiamata a `claude.use('db')`
fallirà (la pagina non si romperà, è dentro un blocco try/catch, ma le
funzioni che dipendono dal salvataggio dati smetteranno di funzionare).
In pratica, così com'è, su Railway:

- le credenziali generate dall'istruttore per i candidati non verranno
  salvate da nessuna parte (il pulsante "Genera credenziali" non avrà
  effetto persistente);
- le domande modificate nel pannello "Domande" non verranno salvate: al
  ricaricamento della pagina torna sempre il set di domande di base
  incluso nel codice;
- i punteggi degli esami completati non verranno registrati.

La pagina resterebbe quindi utilizzabile solo a scopo dimostrativo/grafico,
non per condurre un vero esame con più candidati.

## Come avviare su Railway

1. Carica questa cartella in un repository Git (GitHub/GitLab) e collega il
   repository a un nuovo progetto Railway, oppure usa la CLI (`railway up`)
   da questa cartella.
2. Railway rileva `package.json`, esegue `npm install` e poi `npm start`.
3. Il server Express pubblica `public/esame.html` su `/esame.html` (e `/`
   reindirizza lì). Nessuna variabile d'ambiente è richiesta per questo
   avvio "solo vetrina".

## Per farla funzionare davvero su Railway

Serve sostituire ogni `claude.use('db')` con vere chiamate a un backend:
un paio di endpoint Express (per esempio `GET/POST /api/candidates` e
`GET/POST /api/questions`) appoggiati a un database — Railway offre un
plugin Postgres con un clic, oppure basta un file JSON su disco per un
singolo esame alla volta. Se vuoi, preparo questa versione con backend
reale pronta per il deploy: dimmi solo se preferisci Postgres o un
semplice file di dati.
