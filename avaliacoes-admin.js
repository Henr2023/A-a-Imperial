/* Painel do dono: aba de Avaliações (ver, contar, responder e excluir). Dados no Google Firebase (Firestore). */
(function(){
  var css='#avSec .avb{padding:4px 14px 14px}#avSec .row3{display:grid;gap:8px;margin:8px 0}#avSec input,#avSec textarea{font:inherit;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)}'+
  '#avSec .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 10px}#avSec .stats div{background:var(--bg);border-radius:10px;padding:10px;text-align:center}#avSec .stats b{display:block;font-size:22px}#avSec .stats small{color:var(--muted);font-size:12px}'+
  '#avSec .tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}#avSec .tools .sp{flex:1}#avSec .lnk{background:none;border:0;color:var(--muted);text-decoration:underline;padding:4px;font-weight:600}'+
  '#avSec .rv{border-top:1px solid var(--line);padding:12px 0}#avSec .rv .h{display:flex;justify-content:space-between;gap:8px}#avSec .rv .h small{color:var(--muted);font-size:12px}#avSec .st{color:#f4b400;letter-spacing:1px}'+
  '#avSec .rv p{margin:4px 0 8px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}#avSec .rv .rp{font-size:13px;padding:8px 10px;border-left:3px solid var(--acai2);background:var(--bg);border-radius:0 8px 8px 0;margin-bottom:8px;white-space:pre-wrap}#avSec .rv .rp b{display:block;font-size:12px;color:var(--acai2)}'+
  '#avSec .rv .bt{display:flex;gap:6px;margin-top:6px}#avSec .rv .bt button{padding:8px 12px}#avSec .new{display:inline-block;background:var(--bad);color:#fff;font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;margin-left:6px}'+
  '#avSec pre{background:var(--bg);padding:10px;border-radius:10px;font-size:11px;overflow:auto;max-height:220px}#avSec .er{color:var(--bad);font-size:13px;margin-top:6px}#avSec .okm{color:var(--ok);font-size:13px;margin-top:6px}#avSec ol{padding-left:20px;font-size:13px;color:var(--muted)}#avSec ol b{color:var(--ink)}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var REPO='Henr2023/A-a-Imperial',sec=document.getElementById('avSec'),body=sec.querySelector('.avb'),cnt=sec.querySelector('.n');
  var CFG=null,ID='',LIST=[],onlyNew=false,SHOW=20;
  function $(s){return body.querySelector(s)}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function stars(n){var s='';for(var i=1;i<=5;i++)s+=i<=n?'★':'☆';return s}
  function dt(s){try{return new Date(s).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return''}}
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}}
  function b64e(s){return btoa(unescape(encodeURIComponent(s)))}

  function rules(email){return "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{db}/documents {\n    match /avaliacoes/{id} {\n      allow read: if true;\n      allow create: if request.resource.data.keys().hasOnly(['nome','nota','texto','data'])\n        && request.resource.data.nota is int && request.resource.data.nota >= 1 && request.resource.data.nota <= 5\n        && request.resource.data.nome is string && request.resource.data.nome.size() > 0 && request.resource.data.nome.size() <= 40\n        && request.resource.data.texto is string && request.resource.data.texto.size() <= 600\n        && request.resource.data.data is timestamp;\n      allow update, delete: if request.auth != null && request.auth.token.email == '"+(email||'SEU-EMAIL')+"';\n    }\n  }\n}"}

  /* ---------- 1) Configuração (uma vez só) ---------- */
  function setup(){
    cnt.textContent='configurar';
    body.innerHTML='<p style="font-size:13px;color:var(--muted)">Para receber avaliações pelo cardápio, conecte uma conta grátis do Google Firebase. É só uma vez:</p>'+
    '<ol><li>Abra <a href="https://console.firebase.google.com/" target="_blank" rel="noopener">console.firebase.google.com</a> e crie um projeto (ex.: <b>acai-imperial</b>). O Google Analytics pode ficar desligado.</li>'+
    '<li>No menu, <b>Firestore Database → Criar banco de dados</b> (modo produção, local <b>southamerica-east1</b>).</li>'+
    '<li>Na aba <b>Regras</b> do Firestore, apague tudo, cole as regras abaixo e toque em <b>Publicar</b>.</li>'+
    '<li><b>Authentication → Começar → E-mail/senha → Ativar</b>.</li>'+
    '<li><b>Configurações do projeto</b> (engrenagem) → <b>Seus apps</b> → ícone <b>&lt;/&gt;</b> → registre o app. Copie o <b>apiKey</b> e o <b>projectId</b> e cole aqui embaixo.</li></ol>'+
    '<div class="row3"><input id="avEm" type="email" placeholder="Seu e-mail (para entrar e responder)" value="'+esc(ls('ai-fb-em')||'')+'"><input id="avKey" placeholder="apiKey (começa com AIza…)"><input id="avPid" placeholder="projectId (ex.: acai-imperial)"></div>'+
    '<b style="font-size:13px">Regras para colar no Firestore:</b><pre id="avRules"></pre><button type="button" class="sec" id="avCopy">Copiar regras</button> '+
    '<button type="button" id="avSaveCfg">Salvar configuração</button><div id="avMsg"></div>';
    function upR(){$('#avRules').textContent=rules($('#avEm').value.trim())}upR();$('#avEm').oninput=upR;
    $('#avCopy').onclick=function(){var t=$('#avRules').textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){$('#avMsg').innerHTML='<div class="okm">Regras copiadas.</div>'}).catch(function(){})};
    $('#avSaveCfg').onclick=function(){
      var em=$('#avEm').value.trim(),k=$('#avKey').value.trim().replace(/^["']|["',]+$/g,''),p=$('#avPid').value.trim().replace(/^["']|["',]+$/g,''),m=$('#avMsg'),tok=ls('ai-gh');
      if(!/@/.test(em)||!/^AIza/.test(k)||!p){m.innerHTML='<div class="er">Preencha o e-mail, o apiKey (começa com AIza) e o projectId.</div>';return}
      if(!tok){m.innerHTML='<div class="er">Configure primeiro a chave do GitHub em "Conexão para salvar".</div>';return}
      var btn=this;btn.disabled=true;btn.textContent='Salvando…';var cfg={apiKey:k,projectId:p,dono:em};
      var api='https://api.github.com/repos/'+REPO+'/contents/firebase.json',H={'Accept':'application/vnd.github+json','Authorization':'Bearer '+tok};
      fetch(api+'?ref=main&t='+Date.now(),{headers:H,cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){
        var b={message:'Painel do dono: configura avaliações',content:b64e(JSON.stringify(cfg,null,2)+'\n'),branch:'main'};if(j)b.sha=j.sha;
        return fetch(api,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},H),body:JSON.stringify(b)})}).then(function(r){if(!r.ok)throw new Error(r.status)})
      .then(function(){ls('ai-fb-em',em);CFG=cfg;login()})
      .catch(function(e){btn.disabled=false;btn.textContent='Salvar configuração';m.innerHTML='<div class="er">Não foi possível salvar ('+esc(e.message)+').</div>'});
    };
  }

  /* ---------- 2) Entrar (Firebase Auth e-mail/senha) ---------- */
  function idt(path,data){return fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+path+'?key='+CFG.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j.error&&j.error.message)||r.status);return j})})}
  function errTxt(m){return /INVALID_LOGIN|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(m)?'E-mail ou senha incorretos.':/EMAIL_EXISTS/.test(m)?'Esse e-mail já tem senha. Use "Entrar".':/WEAK_PASSWORD/.test(m)?'A senha precisa ter pelo menos 6 caracteres.':/OPERATION_NOT_ALLOWED|CONFIGURATION_NOT_FOUND/.test(m)?'Ative "E-mail/senha" em Authentication no Firebase.':/API_KEY|API key/.test(m)?'O apiKey parece errado. Use "Refazer configuração".':/TOO_MANY/.test(m)?'Muitas tentativas. Espere alguns minutos.':'Erro: '+m}
  function login(){
    cnt.textContent='entrar';
    body.innerHTML='<p style="font-size:13px;color:var(--muted)">Entre para ver e responder as avaliações. No primeiro acesso, toque em <b>Criar minha senha</b>.</p><div class="row3"><input id="avE" type="email" autocomplete="username" value="'+esc(CFG.dono||ls('ai-fb-em')||'')+'" placeholder="E-mail"><input id="avP" type="password" autocomplete="current-password" placeholder="Senha (mín. 6 caracteres)"></div>'+
    '<button type="button" id="avIn">Entrar</button> <button type="button" class="sec" id="avUp">Criar minha senha</button> <button type="button" class="lnk" id="avReset">Esqueci a senha</button><div id="avMsg"></div><p style="margin-top:14px"><button type="button" class="lnk" id="avRecfg">Refazer configuração do Firebase</button></p>';
    function go(path){var e=$('#avE').value.trim(),p=$('#avP').value,m=$('#avMsg');if(!e||!p){m.innerHTML='<div class="er">Digite e-mail e senha.</div>';return}
      if(path==='signUp'&&CFG.dono&&e.toLowerCase()!==CFG.dono.toLowerCase()){m.innerHTML='<div class="er">Use o e-mail do dono: '+esc(CFG.dono)+'</div>';return}
      m.innerHTML='<div class="okm">Aguarde…</div>';idt(path==='signUp'?'signUp':'signInWithPassword',{email:e,password:p,returnSecureToken:true}).then(function(j){ID=j.idToken;ls('ai-fb-rt',j.refreshToken);ls('ai-fb-em',e);list()}).catch(function(er){m.innerHTML='<div class="er">'+esc(errTxt(er.message))+'</div>'})}
    $('#avIn').onclick=function(){go('signIn')};$('#avUp').onclick=function(){go('signUp')};
    $('#avP').onkeydown=function(e){if(e.key==='Enter')go('signIn')};
    $('#avReset').onclick=function(){var e=$('#avE').value.trim(),m=$('#avMsg');if(!e){m.innerHTML='<div class="er">Digite seu e-mail.</div>';return}
      idt('sendOobCode',{requestType:'PASSWORD_RESET',email:e}).then(function(){m.innerHTML='<div class="okm">Enviamos um link para criar nova senha no seu e-mail.</div>'}).catch(function(er){m.innerHTML='<div class="er">'+esc(errTxt(er.message))+'</div>'})};
    $('#avRecfg').onclick=setup;
  }
  function refresh(){var rt=ls('ai-fb-rt');if(!rt)return Promise.reject(new Error('sem sessão'));
    return fetch('https://securetoken.googleapis.com/v1/token?key='+CFG.apiKey,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(rt)})
    .then(function(r){if(!r.ok)throw new Error('sessão expirada');return r.json()}).then(function(j){ID=j.id_token;ls('ai-fb-rt',j.refresh_token);return ID})}

  /* ---------- 3) Lista, contagem e respostas ---------- */
  function base(){return 'https://firestore.googleapis.com/v1/projects/'+CFG.projectId+'/databases/(default)/documents/avaliacoes'}
  function val(f,k){var v=f[k];if(!v)return '';return v.stringValue!=null?v.stringValue:v.integerValue!=null?+v.integerValue:v.timestampValue||''}
  function fetchAll(){var out=[];function page(t){return fetch(base()+'?key='+CFG.apiKey+'&pageSize=300&orderBy=data%20desc'+(t?'&pageToken='+t:''),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Não consegui ler as avaliações ('+r.status+'). Confira se o Firestore foi criado e as regras publicadas.');return r.json()}).then(function(j){(j.documents||[]).forEach(function(d){var f=d.fields||{};out.push({id:d.name.split('/').pop(),nome:val(f,'nome'),nota:+val(f,'nota')||0,texto:val(f,'texto'),data:val(f,'data'),resposta:val(f,'resposta')})});return j.nextPageToken&&out.length<5000?page(j.nextPageToken):out})}return page('')}
  function authed(method,url,data){function run(){return fetch(url,{method:method,headers:Object.assign({'Authorization':'Bearer '+ID},data?{'Content-Type':'application/json'}:{}),body:data?JSON.stringify(data):undefined})}
    return (ID?Promise.resolve():refresh()).then(run).then(function(r){if(r.status===401)return refresh().then(run);return r}).then(function(r){if(r.status===403)throw new Error('Sem permissão. Confira se as regras do Firestore têm o seu e-mail.');if(!r.ok)throw new Error('Erro '+r.status);return r})}
  function list(){
    body.innerHTML='<div class="load" style="padding:20px">Carregando avaliações…</div>';
    fetchAll().then(function(l){LIST=l;draw()}).catch(function(e){body.innerHTML='<div class="er">'+esc(e.message)+'</div><p><button type="button" class="lnk" id="avRecfg">Refazer configuração do Firebase</button></p>';$('#avRecfg').onclick=setup});
  }
  function draw(){
    var n=LIST.length,pend=LIST.filter(function(r){return !r.resposta}).length,a=n?LIST.reduce(function(s,r){return s+r.nota},0)/n:0;
    cnt.textContent=pend?pend+' sem resposta':'';
    var dist=[5,4,3,2,1].map(function(s){return s+'★ '+LIST.filter(function(r){return r.nota===s}).length}).join(' · ');
    var items=LIST.filter(function(r){return !onlyNew||!r.resposta});
    body.innerHTML='<div class="stats"><div><b>'+n+'</b><small>avaliações</small></div><div><b>'+(n?a.toFixed(1).replace('.',','):'–')+'</b><small>média</small></div><div><b>'+pend+'</b><small>sem resposta</small></div></div>'+
      (n?'<div style="font-size:12px;color:var(--muted);margin-bottom:8px">'+dist+'</div>':'')+
      '<div class="tools"><button type="button" class="sec'+(onlyNew?' on':'')+'" id="avOnly">'+(onlyNew?'Mostrar todas':'Só sem resposta')+'</button><button type="button" class="sec" id="avRe">Atualizar</button><span class="sp"></span><button type="button" class="lnk" id="avOut">Sair</button></div><div id="avMsg"></div>'+
      (items.length?items.slice(0,SHOW).map(function(r){return '<div class="rv" data-id="'+esc(r.id)+'"><div class="h"><b>'+esc(r.nome||'Cliente')+' <span class="st">'+stars(r.nota)+'</span>'+(r.resposta?'':'<span class="new">nova</span>')+'</b><small>'+dt(r.data)+'</small></div>'+(r.texto?'<p>'+esc(r.texto)+'</p>':'<p style="color:var(--muted)">(sem comentário)</p>')+
        (r.resposta?'<div class="rp"><b>Sua resposta</b>'+esc(r.resposta)+'</div>':'')+
        '<textarea rows="2" maxlength="600" placeholder="Escreva sua resposta…" hidden>'+esc(r.resposta)+'</textarea><div class="bt"><button type="button" data-a="rep">'+(r.resposta?'Editar resposta':'Responder')+'</button><button type="button" class="sec" data-a="del">Excluir</button></div></div>'}).join('')+(items.length>SHOW?'<button type="button" class="lnk" id="avMoreA">Ver mais</button>':''):'<div class="load" style="padding:20px">'+(n?'Todas respondidas! 🎉':'Nenhuma avaliação ainda.')+'</div>');
    $('#avOnly').onclick=function(){onlyNew=!onlyNew;draw()};$('#avRe').onclick=list;
    $('#avOut').onclick=function(){ID='';ls('ai-fb-rt',null);login()};
    var mm=$('#avMoreA');if(mm)mm.onclick=function(){SHOW+=20;draw()};
  }
  body.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var box=b.closest('.rv'),id=box.dataset.id,r=LIST.filter(function(x){return x.id===id})[0],ta=box.querySelector('textarea'),m=$('#avMsg');if(!r)return;
    if(b.dataset.a==='rep'){if(ta.hidden){ta.hidden=false;ta.focus();b.textContent='Salvar resposta';return}
      var txt=ta.value.trim().slice(0,600);b.disabled=true;b.textContent='Salvando…';
      authed('PATCH',base()+'/'+id+'?updateMask.fieldPaths=resposta&updateMask.fieldPaths=respData&currentDocument.exists=true&key='+CFG.apiKey,{fields:{resposta:{stringValue:txt},respData:{timestampValue:new Date().toISOString()}}})
      .then(function(){r.resposta=txt;draw();$('#avMsg').innerHTML='<div class="okm">Resposta salva! Já aparece no cardápio.</div>'})
      .catch(function(er){b.disabled=false;b.textContent='Salvar resposta';m.innerHTML='<div class="er">'+esc(er.message==='sem sessão'||er.message==='sessão expirada'?'Entre de novo para responder.':er.message)+'</div>'})}
    else if(b.dataset.a==='del'){if(!confirm('Excluir a avaliação de "'+(r.nome||'Cliente')+'"? Isso não pode ser desfeito.'))return;b.disabled=true;
      authed('DELETE',base()+'/'+id+'?key='+CFG.apiKey).then(function(){LIST=LIST.filter(function(x){return x.id!==id});draw();$('#avMsg').innerHTML='<div class="okm">Avaliação excluída.</div>'})
      .catch(function(er){b.disabled=false;m.innerHTML='<div class="er">'+esc(er.message)+'</div>'})}
  });

  /* ---------- Início ---------- */
  var started=false;
  function start(){if(started)return;started=true;
    fetch('firebase.json?v='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(c){
      if(!c||!c.apiKey||!c.projectId)return setup();CFG=c;if(!ls('ai-fb-rt'))return login();refresh().then(list).catch(login)});
  }
  sec.addEventListener('toggle',function(){if(sec.open)start()});
  /* contador de "sem resposta" no título, mesmo com a aba fechada */
  fetch('firebase.json?v='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(c){if(!c||!c.apiKey)return;CFG=c;fetchAll().then(function(l){if(started)return;var p=l.filter(function(r){return !r.resposta}).length;cnt.textContent=p?p+' sem resposta':''}).catch(function(){})});
})();
