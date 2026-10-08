const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function requireSupabase(res){
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
    res.status(500).json({error:'Supabase non configurato: imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'});
    return false;
  }
  return true;
}

async function supabase(pathname, options={}){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`,{
    ...options,
    headers:{
      apikey:SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json',
      ...(options.headers||{})
    }
  });
  const text=await r.text();
  let data=null;
  try{data=text?JSON.parse(text):null;}catch(e){data=text;}
  if(!r.ok){
    const err=new Error(typeof data==='string'?data:(data?.message||'Errore Supabase'));
    err.status=r.status;
    throw err;
  }
  return data;
}

async function getGoogleUser(accessToken){
  if(!SUPABASE_URL || !accessToken) return null;
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{
    method:'GET',
    headers:{
      apikey:SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${accessToken}`
    }
  });
  if(!r.ok) return null;
  return await r.json();
}

app.get('/api/config',(req,res)=>{
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
    return res.status(500).json({error:'Supabase non configurato.'});
  }
  res.json({url:SUPABASE_URL,anonKey:SUPABASE_ANON_KEY});
});

app.get('/api/candidates',async(req,res)=>{
  if(!requireSupabase(res)) return;
  try{res.json(await supabase('candidates?select=*',{method:'GET'}));}
  catch(e){res.status(e.status||500).json({error:e.message});}
});

app.get('/api/candidates/:username',async(req,res)=>{
  if(!requireSupabase(res)) return;
  try{
    const rows=await supabase(`candidates?username=eq.${encodeURIComponent(req.params.username)}&select=*`,{method:'GET'});
    if(!rows.length) return res.status(404).json({error:'Candidato non trovato.'});
    res.json(rows[0]);
  }catch(e){res.status(e.status||500).json({error:e.message});}
});

app.post('/api/candidates',async(req,res)=>{
  if(!requireSupabase(res)) return;
  try{
    const body={...req.body};
    if(!body.username||!body.password||!body.name||!body.email)
      return res.status(400).json({error:'Dati candidato incompleti.'});
    const rows=await supabase('candidates?on_conflict=username',{
      method:'POST',
      headers:{Prefer:'resolution=error,return=representation'},
      body:JSON.stringify(body)
    });
    res.status(201).json(Array.isArray(rows)?rows[0]:rows);
  }catch(e){res.status(e.status||500).json({error:e.message});}
});

app.patch('/api/candidates/:username',async(req,res)=>{
  if(!requireSupabase(res)) return;
  try{
    const rows=await supabase(`candidates?username=eq.${encodeURIComponent(req.params.username)}`,{
      method:'PATCH',
      headers:{Prefer:'return=representation'},
      body:JSON.stringify(req.body)
    });
    if(!rows.length) return res.status(404).json({error:'Candidato non trovato.'});
    res.json(rows[0]);
  }catch(e){res.status(e.status||500).json({error:e.message});}
});

// Login candidato: richiede una sessione Google valida.
// L'email restituita da Supabase Auth viene confrontata server-side
// con quella registrata dall'istruttore.
app.post('/api/candidates/:username/login',async(req,res)=>{
  if(!requireSupabase(res)) return;

  try{
    const auth=req.headers.authorization||'';
    const match=auth.match(/^Bearer\s+(.+)$/i);
    if(!match) return res.status(401).json({error:'Accesso Google obbligatorio.'});

    const googleUser=await getGoogleUser(match[1]);
    const googleEmail=String(googleUser?.email||'').trim().toLowerCase();
    if(!googleEmail) return res.status(401).json({error:'Account Google non valido.'});

    const rows=await supabase(`candidates?username=eq.${encodeURIComponent(req.params.username)}&select=*`,{method:'GET'});
    if(!rows.length) return res.status(401).json({error:'Credenziali non valide.'});

    const candidate=rows[0];
    const candidateEmail=String(candidate.email||'').trim().toLowerCase();

    if(!candidateEmail || candidateEmail!==googleEmail)
      return res.status(403).json({error:'L\'account Google non corrisponde alla mail autorizzata per questa credenziale.'});

    if(candidate.password !== req.body?.password)
      return res.status(401).json({error:'Credenziali non valide.'});

    res.json(candidate);
  }catch(e){
    res.status(e.status||500).json({error:e.message||'Errore durante il login.'});
  }
});

app.get('/api/questions',async(req,res)=>{
  if(!requireSupabase(res)) return;
  try{
    const rows=await supabase('questions?id=eq.exam&select=*',{method:'GET'});
    res.json(rows[0]||null);
  }catch(e){res.status(e.status||500).json({error:e.message});}
});

app.put('/api/questions',async(req,res)=>{
  if(!requireSupabase(res)) return;
  try{
    const body={id:'exam',mcq:req.body.mcq||[],open:req.body.open||[],cases:req.body.cases||[]};
    const rows=await supabase('questions?on_conflict=id',{
      method:'POST',
      headers:{Prefer:'resolution=merge-duplicates,return=representation'},
      body:JSON.stringify(body)
    });
    res.json(Array.isArray(rows)?rows[0]:rows);
  }catch(e){res.status(e.status||500).json({error:e.message});}
});

app.get('*',(req,res)=>{
  res.sendFile(path.join(__dirname,'public','esame.html'));
});

module.exports=app;

if(require.main===module){
  app.listen(port,()=>console.log('Server avviato sulla porta '+port));
}
