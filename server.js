const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inizializzazione client Supabase dalle variabili d'ambiente Vercel
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// API per la creazione di un account da parte dell'Admin
app.post('/api/admin/create-user', async (req, res) => {
  const { username, password, ruolo } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password obbligatori' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('utenti')
      .insert([{ username, password: hashedPassword, ruolo: ruolo || 'candidato' }]);

    if (error) throw error;
    res.json({ message: 'Utente creato e salvato nel database con successo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API per l'invio delle risposte dell'esame
app.post('/api/esame/submit', async (req, res) => {
  const { username, risposte, tempoImpiegato } = req.body;

  if (!username || !risposte) {
    return res.status(400).json({ error: 'Dati esame mancanti' });
  }

  try {
    const { data, error } = await supabase
      .from('risposte_esami')
      .insert([
        {
          username: username,
          risposte: risposte,
          tempo_secondi: tempoImpiegato,
          data_invio: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    res.json({ message: 'Esame inviato e salvato con successo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server avviato sulla porta ' + port));
