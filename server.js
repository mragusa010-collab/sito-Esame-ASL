const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Client Supabase (Recupera credenziali da variabili d'ambiente)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// API Admin per Creazione Utente
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
    res.json({ message: 'Utente registrato nel Database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Consegna Esame
app.post('/api/esame/submit', async (req, res) => {
  const { username, risposte, tempoImpiegato } = req.body;

  if (!username || !risposte) {
    return res.status(400).json({ error: 'Dati incompleti' });
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
    res.json({ message: 'Esame salvato con successo nel Database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server attivo sulla porta ' + port));
