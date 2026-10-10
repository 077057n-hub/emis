/* teacher-roster.js — نزول صفوف المعلم من الجدول المشترك + نقل الطلاب (يُحمّل تلقائياً من teacher-link.js) */
(()=>{
let un=null,grades=null,st='';
const norm=s=>String(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim();
function cls(g,s){
 const k=g+'|'+s,n=g+' / '+s;
 let c=D.cl.find(x=>x.k===k)||D.cl.find(x=>x.n===n);
 if(!c){c={id:uid(),n};D.cl.push(c)}
 c.k=k;return c;
}
function apply(list){
 let ch=0;
 list.sort((a,b)=>norm(a.n).localeCompare(norm(b.n),'ar'));
 list.forEach(r=>{
  if(r.del||!grades.includes(r.g))return;
  const c=cls(r.g,r.s||'—');
  let s=D.st.find(x=>x.eid===r.eid);
  if(!s){
   s=D.st.find(x=>!x.eid&&norm(x.n)===norm(r.n));
   if(s){s.eid=r.eid;ch++}
   else{D.st.push({id:uid(),c:c.id,n:r.n,eid:r.eid});ch++;return}
  }
  if(s.c!==c.id){s.c=c.id;ch++}
 });
 if(ch){save();render()}
}
async function start(){
 if(un){un();un=null}
 const T=window.TL;
 if(!T||!T.user){grades=null;st='';render();return}
 const {F,db,user}=T;
 try{
  const t=await F.getDoc(F.doc(db,'teachers',(user.email||'').toLowerCase()));
  grades=t.exists()?(t.data().grades||[]):[];
 }catch(e){grades=null;st='تعذر: '+(e.code||e.message);render();return}
 if(!grades.length){st='لم يخصص لك المالك صفوفاً بعد';render();return}
 un=F.onSnapshot(F.collection(db,'roster'),snap=>{
  apply(snap.docs.map(d=>({eid:d.id,...d.data()})));
  st='✅ صفوفك من المدرسة: '+grades.join('، ');render();
 },e=>{st='تعذرت المزامنة: '+(e.code||'');render()});
}
addEventListener('tl-user',start);
if(window.TL&&window.TL.user)start();

/* واجهة تبويب الطلاب */
const o=TABS[0][3];
TABS[0][3]=()=>(st?`<p class="mu">${esc(st)}</p>`:'')+o()+(grades&&grades.length?'<button class="b g" onclick="rsMove()">↔️ نقل طالب لشعبة ثانية</button>':'');

async function mv(s,to,g,from){
 const T=window.TL;
 try{
  await T.F.updateDoc(T.F.doc(T.db,'roster',s.eid),{s:to,u:Date.now()});
  await T.F.addDoc(T.F.collection(T.db,'moves'),{eid:s.eid,n:s.n,g,from,to,by:T.user.email,at:Date.now()});
  toast('تم النقل إلى شعبة '+to+' ✅');
 }catch(e){toast(e.code==='permission-denied'?'لا تملك صلاحية النقل':'تعذر النقل')}
}
window.rsMove=()=>{
 const c=D.cl.find(x=>x.id===D.cur);
 if(!c||!c.k)return toast('هذا الصف غير مربوط بالمدرسة');
 const [g,from]=c.k.split('|'),L=D.st.filter(s=>s.c===c.id&&s.eid);
 if(!L.length)return toast('لا يوجد طلاب مربوطون بهذا الصف');
 const m=modal('↔️ نقل طالب',`<p class="mu">${esc(c.n)}</p><select id="ms2">${L.map(s=>`<option value="${s.id}">${esc(s.n)}</option>`).join('')}</select><p class="mu">إلى شعبة:</p><select id="mt">${['أ','ب'].filter(x=>x!==from).map(x=>`<option>${x}</option>`).join('')}</select><div class="warn" id="mw" style="display:none">⚠️ هذا الطالب عنده درجات مسجلة بدفترك. الدرجات المنزّلة عند مرشد الصف تبقى بشعبته القديمة.</div><p class="mu">النقل يظهر عند كل المعلمين.</p>`,m=>{
  const s=D.st.find(x=>x.id===v(m,'#ms2'));if(s)mv(s,v(m,'#mt'),g,from)},'نقل');
 const chk=()=>{const id=m.querySelector('#ms2').value;m.querySelector('#mw').style.display=Object.values(D.gr[id]||{}).some(x=>x!==''&&x!==undefined)?'block':'none'};
 m.querySelector('#ms2').onchange=chk;chk();
};
})();
