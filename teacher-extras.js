/* teacher-extras.js — ملخص الغياب والتأخر + ملاحظات دائمة لكل طالب (يُحمّل تلقائياً من teacher-link.js) */
(()=>{
const CH=['ما جاب دفتر','ما جاب الواجب','ما جاب الكتاب','نسي الأدوات','شغب بالصف','ممتاز اليوم'];
const att=(id,pref)=>{
 let a=0,l=0,p=0;
 for(const k in D.at){
  if(!k.endsWith('|'+id)||(pref&&!k.startsWith(pref)))continue;
  const x=D.at[k];if(x==='a')a++;else if(x==='l')l++;else if(x==='p')p++;
 }
 return {a,l,p};
};

/* ---- ملاحظات الطالب ---- */
window.exNotes=sid=>{
 const s=D.st.find(x=>x.id===sid);if(!s)return;
 const L=(D.sn&&D.sn[sid])||[];
 const body=`<div style="max-height:34vh;overflow:auto">${L.length?L.slice().reverse().map(n=>`<div class="card"><b>${esc(n.t).replace(/\n/g,'<br>')}<br><span class="mu">${esc(n.d)}</span></b><button class="ic s" onclick="exDel('${sid}','${n.id}')">🗑</button></div>`).join(''):'<p class="mu">لا توجد ملاحظات لهذا الطالب بعد</p>'}</div>`
  +'<hr><p class="mu">ملاحظة جديدة (اضغط جملة جاهزة أو اكتب بحرية)</p>'
  +`<div class="chips" style="flex-wrap:wrap">${CH.map(c=>`<span onclick="exChip(this)" style="flex:none;cursor:pointer;padding:6px 10px;font-size:13px">${c}</span>`).join('')}</div>`
  +'<textarea id="exn" rows="6" placeholder="اكتب الملاحظة هنا…"></textarea>';
 modal('📝 '+esc(s.n),body,m=>{
  const t=v(m,'#exn');if(!t)return false;
  (D.sn=D.sn||{})[sid]=(D.sn[sid]||[]).concat([{id:uid(),d:today(),t}]);
  save();render();toast('تم حفظ الملاحظة ✅');
 },'حفظ الملاحظة');
};
window.exChip=el=>{const t=document.getElementById('exn');t.value=(t.value?t.value+'\n':'')+el.textContent};
window.exDel=(sid,id)=>ask('حذف هذه الملاحظة؟',()=>{
 D.sn[sid]=(D.sn[sid]||[]).filter(n=>n.id!==id);save();render();
 document.querySelectorAll('.ov').forEach(x=>x.remove());exNotes(sid);
});

/* ---- ملخص الغياب والتأخر ---- */
window.exSum=()=>{
 const m=modal('📊 ملخص الحضور','<p class="mu">اختر الشهر</p><input type="month" id="exm"><div class="tw" id="exb"></div>');
 const inp=m.querySelector('#exm');inp.value=(typeof AD==='string'?AD:today()).slice(0,7);
 const fill=()=>{
  const pf=inp.value;
  m.querySelector('#exb').innerHTML='<table><tr><th>الطالب</th><th>❌ غياب</th><th>⏰ تأخر</th><th>✅ حضور</th><th>غياب الكل</th></tr>'
   +S().map((s,i)=>{const a=att(s.id,pf),t=att(s.id,'');return `<tr><td>${i+1}. ${esc(s.n)}</td><td${a.a>=3?' style="color:#d23f37;font-weight:700"':''}>${a.a}</td><td>${a.l}</td><td>${a.p}</td><td>${t.a}</td></tr>`}).join('')+'</table>';
 };
 inp.onchange=fill;fill();
};

/* ---- أزرار على بطاقات الطلاب ---- */
function deco(){
 if(tab!=='st'&&tab!=='at')return;
 const L=S(),cards=[...document.querySelectorAll('main .card')];
 if(!L.length||cards.length!==L.length)return;
 cards.forEach((c,i)=>{
  const s=L[i];
  if(!c.querySelector('.exn')){
   const n=((D.sn||{})[s.id]||[]).length,b=document.createElement('button');
   b.className='ic s exn';b.innerHTML='📝'+(n?'<small style="font-size:11px">'+n+'</small>':'');
   b.onclick=e=>{e.stopPropagation();exNotes(s.id)};
   const an=c.querySelector('.ic');an?c.insertBefore(b,an):c.appendChild(b);
  }
  if(tab==='at'){
   const bb=c.querySelector('b');
   if(bb&&!bb.querySelector('.exa')){
    const m=att(s.id,AD.slice(0,7)),t=att(s.id,'');
    bb.insertAdjacentHTML('beforeend',`<br><span class="mu exa">هذا الشهر: ❌ ${m.a} · ⏰ ${m.l} — الكل: ❌ ${t.a}</span>`);
   }
  }
 });
}
const w0=TABS[0][3];TABS[0][3]=()=>w0()+(setTimeout(deco,0),'');
const w1=TABS[1][3];TABS[1][3]=()=>'<button class="b g" onclick="exSum()">📊 ملخص الغياب والتأخر</button>'+w1()+(setTimeout(deco,0),'');
render();
})();
