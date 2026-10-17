/* Avaliações dos clientes (cardápio). Dados no Google Firebase (Firestore), configurado no painel do dono -> firebase.json */
(function(){
  var css='.av-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 16px 12px}'+
  '.av-avg{display:flex;align-items:baseline;gap:8px}.av-avg b{font-size:28px;font-weight:800}.av-avg span{color:var(--muted);font-size:13px}'+
  '.av-st{color:var(--gold);letter-spacing:1px}.av-btn{font:inherit;font-weight:700;border:0;border-radius:999px;padding:9px 16px;background:var(--acai2);color:#fff;cursor:pointer}'+
  '.av-it{padding:12px 16px;border-top:1px solid var(--line)}.av-it .h{display:flex;justify-content:space-between;gap:8px;font-size:14px}.av-it .h b{font-weight:700}.av-it .h small{color:var(--muted)}'+
  '.av-it p{margin:4px 0 0;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}.av-rp{margin:8px 0 0 10px;padding:8px 10px;border-left:3px solid var(--acai2);background:color-mix(in srgb,var(--acai2) 8%,transparent);border-radius:0 8px 8px 0;font-size:13px}.av-rp b{display:block;font-size:12px;color:var(--acai2)}'+
  '.av-fm{margin:0 16px 12px;padding:14px;border:1px solid var(--line);border-radius:12px;display:grid;gap:10px}.av-fm input,.av-fm textarea{font:inherit;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink)}'+
  '.av-stars{display:flex;gap:4px}.av-stars button{font-size:30px;line-height:1;background:none;border:0;padding:0 2px;cursor:pointer;color:var(--line)}.av-stars button.on{color:var(--gold)}'+
  '.av-ok{margin:0 16px 12px;padding:10px 14px;border-radius:10px;background:color-mix(in srgb,var(--ok) 16%,transparent);font-size:14px}.av-err{color:#c0392b;font-size:13px}.av-more{display:block;margin:10px auto 0;font:inherit;font-weight:600;background:none;border:0;color:var(--acai2);cursor:pointer}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  var CFG=null,LIST=[],SHOW=10;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function stars(n){var s='';for(var i=1;i<=5;i++)s+=i<=n?'★':'☆';return s}
  function dt(s){try{return new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return''}}
  function base(){return 'https://firestore.googleapis.com/v1/projects/'+CFG.projectId+'/databases/(default)/documents/avaliacoes'}
  function val(f,k){var v=f[k];if(!v)return '';return v.stringValue!=null?v.stringValue:v.integerValue!=null?+v.integerValue:v.timestampValue||''}
  function fromDoc(d){var f=d.fields||{};return{nome:val(f,'nome'),nota:+val(f,'nota')||0,texto:val(f,'texto'),data:val(f,'data'),resposta:val(f,'resposta')}}

  function load(){var out=[];function page(tok){return fetch(base()+'?key='+CFG.apiKey+'&pageSize=300&orderBy=data%20desc'+(tok?'&pageToken='+tok:'')).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){(j.documents||[]).forEach(function(d){out.push(fromDoc(d))});if(j.nextPageToken&&out.length<3000)return page(j.nextPageToken);return out})}
    return page('')}

  function avg(){if(!LIST.length)return 0;return LIST.reduce(function(a,b){return a+b.nota},0)/LIST.length}
  function fmt(n){return n.toFixed(1).replace('.',',')}
  function render(){
    var box=document.getElementById('avBox');if(!box)return;var a=avg(),n=LIST.length;
    var h='<div class="av-top"><div class="av-avg">'+(n?'<b>'+fmt(a)+'</b><div><div class="av-st">'+stars(Math.round(a))+'</div><span>'+n+' avaliaç'+(n>1?'ões':'ão')+'</span></div>':'<span>Seja o primeiro a avaliar!</span>')+'</div><button type="button" class="av-btn" id="avNew">Avaliar</button></div><div id="avForm"></div>';
    h+=LIST.slice(0,SHOW).map(function(r){return '<div class="av-it"><div class="h"><b>'+esc(r.nome||'Cliente')+' <span class="av-st">'+stars(r.nota)+'</span></b><small>'+dt(r.data)+'</small></div>'+(r.texto?'<p>'+esc(r.texto)+'</p>':'')+(r.resposta?'<div class="av-rp"><b>Resposta da Açaí Imperial</b>'+esc(r.resposta)+'</div>':'')+'</div>'}).join('');
    if(n>SHOW)h+='<button type="button" class="av-more" id="avMore">Ver mais avaliações</button>';
    box.innerHTML=h;
    var sEl=document.querySelector('.store .star');if(sEl&&n)sEl.textContent='★ '+fmt(a)+' ('+n+')';
  }
  function form(){
    var f=document.getElementById('avForm'),nota=0;
    f.innerHTML='<div class="av-fm"><b>Como foi seu pedido?</b><div class="av-stars" id="avS">'+[1,2,3,4,5].map(function(i){return '<button type="button" data-avs="'+i+'" aria-label="'+i+' estrela'+(i>1?'s':'')+'">★</button>'}).join('')+'</div>'+
      '<input id="avNome" maxlength="40" placeholder="Seu nome" autocomplete="name"><textarea id="avTxt" rows="3" maxlength="600" placeholder="Conte o que achou (opcional)"></textarea><div class="av-err" id="avErr"></div><button type="button" class="av-btn" id="avSend">Enviar avaliação</button></div>';
    try{document.getElementById('avNome').value=localStorage.getItem('ai-nome')||document.getElementById('fNome').value||''}catch(e){}
    f.querySelector('#avS').onclick=function(e){var b=e.target.closest('[data-avs]');if(!b)return;nota=+b.dataset.avs;[].forEach.call(this.children,function(x,i){x.classList.toggle('on',i<nota)})};
    f.querySelector('#avSend').onclick=function(){
      var nome=document.getElementById('avNome').value.trim().slice(0,40),txt=document.getElementById('avTxt').value.trim().slice(0,600),err=document.getElementById('avErr'),btn=this;
      if(!nota){err.textContent='Toque nas estrelas para dar sua nota.';return}if(!nome){err.textContent='Digite seu nome.';return}
      btn.disabled=true;btn.textContent='Enviando…';err.textContent='';var now=new Date().toISOString();
      fetch(base()+'?key='+CFG.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{nome:{stringValue:nome},nota:{integerValue:String(nota)},texto:{stringValue:txt},data:{timestampValue:now}}})})
      .then(function(r){if(!r.ok)throw 0;try{localStorage.setItem('ai-nome',nome)}catch(e){}LIST.unshift({nome:nome,nota:nota,texto:txt,data:now,resposta:''});render();
        document.getElementById('avForm').innerHTML='<div class="av-ok">Obrigado pela avaliação! 💜</div>'})
      .catch(function(){btn.disabled=false;btn.textContent='Enviar avaliação';err.textContent='Não foi possível enviar agora. Tente de novo.'});
    };
  }
  document.addEventListener('click',function(e){if(e.target.id==='avNew')form();else if(e.target.id==='avMore'){SHOW+=10;render()}});

  window.AV_INIT=function(){
    fetch('firebase.json?v='+Date.now()).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(c){
      if(!c||!c.apiKey||!c.projectId){var s=document.getElementById('avaliacoes'),t=document.querySelector('.tabs a[href="#avaliacoes"]');if(s)s.remove();if(t)t.remove();return}
      CFG=c;render();return load().then(function(l){LIST=l;render()}).catch(function(){});
    });
  };
})();
if(document.getElementById('avBox'))window.AV_INIT();
