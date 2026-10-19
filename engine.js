/* Original author: Horlacher (10ab) — gemeinsame Funktionen für die Übungsseiten (Tabs, Quiz-Engine).
   Not authorized for redistribution under a different author's name. */
// ===== Haupt-Tabs =====
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('body > .wrap > .panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ===== Subnav-Gruppen =====
document.querySelectorAll('.subnav-group').forEach(group=>{
  const btns = group.querySelectorAll(':scope > .subnav .subnav-btn');
  const panels = group.querySelectorAll(':scope > .subpanel');
  btns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      btns.forEach(b=>b.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });
});

function stripAccents(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,''); }
function normalize(s){
  return stripAccents(s.toLowerCase())
    .replace(/[.,!?;:]/g,'')
    .replace(/['’]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function shuffle(arr){
  const a = arr.slice();
  if(a.length < 2) return a;
  for(let t=0;t<12;t++){
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    if(a.join('|') !== arr.join('|')) break;
  }
  return a;
}

// ===================== ÜBUNGS-ENGINE =====================
// Aufgabentypen: mc (Auswahl), fill (Eintippen), puz (Wörter-Puzzle)
function mountQuiz(root, items){
  let cur = 0, score = 0, timer = null;
  root.innerHTML = `<div class="quiz-progress"></div><div class="qarea"></div>
    <div class="score-bar"><span class="sc"></span><button class="rs" type="button">Neu starten</button></div>`;
  const prog = root.querySelector('.quiz-progress');
  const area = root.querySelector('.qarea');
  const sc = root.querySelector('.sc');
  function setScore(){ sc.textContent = `Punkte: ${score} / ${items.length}`; }
  function next(fb, delay){
    timer = setTimeout(()=>{
      if(cur < items.length-1){ cur++; render(); }
      else { fb.textContent += `  —  Fertig! ${score} von ${items.length} richtig. Mit „Neu starten“ kannst du wiederholen.`; }
    }, delay);
  }
  function render(){
    const it = items[cur];
    prog.textContent = `Aufgabe ${cur+1} von ${items.length}`;
    area.innerHTML = '';
    const div = document.createElement('div'); div.className = 'q';
    area.appendChild(div);

    if(it.t === 'mc'){
      const order = shuffle(it.o.map((_,i)=>i));
      div.innerHTML = `<div class="prompt"><span class="fr">${it.q}</span></div>
        <div class="opts">${order.map(i=>`<button type="button" class="opt" data-i="${i}">${it.o[i]}</button>`).join('')}</div>
        <div class="feedback"></div>`;
      const fb = div.querySelector('.feedback');
      const btns = div.querySelectorAll('.opt');
      btns.forEach(btn=>btn.addEventListener('click', ()=>{
        const i = parseInt(btn.dataset.i);
        btns.forEach(b=>b.disabled = true);
        if(i === it.c){ btn.classList.add('correct'); score++; fb.textContent = '✓ Richtig. ' + it.e; }
        else{
          btn.classList.add('wrong');
          btns.forEach(b=>{ if(parseInt(b.dataset.i)===it.c) b.classList.add('correct'); });
          fb.textContent = '✗ ' + it.e;
        }
        setScore(); next(fb, 2200);
      }));
    }

    else if(it.t === 'fill'){
      div.innerHTML = `<div class="prompt"><span class="fr">${it.q}</span></div>
        <div class="input-row">
          <input type="text" placeholder="deine Antwort …" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button type="button" class="btn check-fill">Prüfen</button>
        </div>
        <div class="feedback"></div>`;
      const input = div.querySelector('input');
      const btn = div.querySelector('.check-fill');
      const fb = div.querySelector('.feedback');
      function check(){
        if(btn.disabled) return;
        const ok = it.a.some(a => normalize(a) === normalize(input.value));
        btn.disabled = true; input.disabled = true;
        if(ok){ input.style.borderColor = 'var(--teal)'; score++; fb.textContent = '✓ Richtig. ' + it.e; }
        else{ input.style.borderColor = 'var(--rouge)'; fb.textContent = `✗ Lösung: „${it.a[0]}“. ` + it.e; }
        setScore(); next(fb, 2600);
      }
      btn.addEventListener('click', check);
      input.addEventListener('keydown', e=>{ if(e.key === 'Enter') check(); });
    }

    else if(it.t === 'puz'){
      const order = shuffle(it.w.map((_,i)=>i));
      let placed = [], done = false;
      div.innerHTML = `<div class="prompt"><span class="de">${it.de}</span></div>
        <div class="answer-line"></div>
        <div class="tiles"></div>
        <div class="input-row">
          <button type="button" class="btn check-puz">Prüfen</button>
          <button type="button" class="btn secondary clear-puz">Zurücksetzen</button>
        </div>
        <div class="feedback"></div>`;
      const line = div.querySelector('.answer-line');
      const tiles = div.querySelector('.tiles');
      const fb = div.querySelector('.feedback');
      const checkBtn = div.querySelector('.check-puz');
      const clearBtn = div.querySelector('.clear-puz');
      function draw(){
        line.innerHTML = '';
        if(!placed.length){ const ph = document.createElement('span'); ph.className = 'ph'; ph.textContent = 'Hier entsteht dein Satz …'; line.appendChild(ph); }
        placed.forEach(idx=>{
          const t = document.createElement('button');
          t.type = 'button'; t.className = 'tile placed'; t.textContent = it.w[idx];
          t.addEventListener('click', ()=>{ if(done) return; placed = placed.filter(x=>x!==idx); draw(); });
          line.appendChild(t);
        });
        tiles.innerHTML = '';
        order.forEach(idx=>{
          const t = document.createElement('button');
          t.type = 'button'; t.className = 'tile' + (placed.includes(idx) ? ' used' : ''); t.textContent = it.w[idx];
          t.addEventListener('click', ()=>{ if(done) return; placed.push(idx); draw(); });
          tiles.appendChild(t);
        });
      }
      draw();
      clearBtn.addEventListener('click', ()=>{ if(done) return; placed = []; draw(); });
      checkBtn.addEventListener('click', ()=>{
        if(done) return;
        if(placed.length < it.w.length){ fb.textContent = 'Setze erst alle Wörter ein.'; return; }
        done = true; checkBtn.disabled = true; clearBtn.disabled = true;
        const given = placed.map(i=>it.w[i]).join(' ');
        const right = it.w.join(' ');
        if(given === right){ line.classList.add('ok'); score++; fb.textContent = `✓ Richtig: ${right}.`; }
        else{ line.classList.add('bad'); fb.textContent = `✗ Richtig wäre: ${right}.`; }
        setScore(); next(fb, 2400);
      });
    }
  }
  root.querySelector('.rs').addEventListener('click', ()=>{
    clearTimeout(timer); cur = 0; score = 0; setScore(); render();
  });
  setScore(); render();
}
