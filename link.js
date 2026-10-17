/* link.js — ربط سجل الدرجات (مرشد الصف) بدفتر الصف (المعلمين)
   ضعه بجانب index.html وأضف قبل </body> سطر:  <script type="module" src="link.js"></script> */
(async()=>{
/* ---- إصلاح الطباعة: ورقة A4 بصفحة وحدة + ترتيب السنة ---- */
const st=document.createElement('style');
st.textContent='@media print{.pp{height:279mm!important;max-height:279mm!important}}';
document.head.appendChild(st);
const p0=window.pdf;
window.pdf=r=>{const y=document.querySelector('#yr');if(y&&!y.value.includes('\u202D'))y.value='\u202D'+y.value.replace(/[\u202D\u202C]/g,'')+'\u202C';p0(r)};

/* ---- زر 🔗 بالشريط العلوي ---- */
const btn=()=>{
 const r=document.querySelector('#app .top .row'),old=document.getElementById('lk');
 if(r){if(r.contains(old))return;if(old)old.remove();
  const b=document.createElement('button');b.className='ic';b.id='lk';b.textContent='🔗';b.onclick=()=>linkUI();r.insertBefore(b,r.firstChild)}
 else if(!old){const b=document.createElement('button');b.id='lk';b.textContent='🔗';b.onclick=()=>linkUI();
  b.style.cssText='position:fixed;top:10px;left:10px;z-index:8;width:44px;height:44px;border:0;border-radius:12px;font-size:20px';document.body.appendChild(b)}
};
new MutationObserver(btn).observe(document.getElementById('app'),{childList:true,subtree:true});
btn();

/* ---- Firebase (نفس مشروعك) ---- */
const G='https://www.gstatic.com/firebasejs/10.12.2/';
const [A,U,F]=await Promise.all([import(G+'firebase-app.js'),import(G+'firebase-auth.js'),import(G+'firebase-firestore.js')]);
for(let i=0;i<100&&!window.cloud;i++)await new Promise(r=>setTimeout(r,300));
if(!window.cloud)return;
const app=A.getApp(),auth=U.getAuth(app),db=F.getFirestore(app);
let user=null,lastLm=-1;
const sent={},known=new Set(),unsubs={},LU={};
const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const gen=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>AL[x%32]).join('');
const linked=()=>D.cl.filter(c=>c.code);

/* قائمة الطلاب والمواد (يقرأها المعلم) */
const pushSec=c=>F.setDoc(F.doc(db,'sections',c.code),{owner:user.uid,name:cname(c),g:c.g,s:c.s,sub:c.sub,
 st:D.st.filter(s=>s.c===c.id).sort((a,b)=>a.no-b.no).map(s=>({id:s.id,no:s.no,n:s.n,adm:s.adm||''})),u:Date.now()});

/* درجات المرشد: ترفع فقط الخانات التي تغيّرت، كل طالب+مادة بمستند مستقل */
async function pushGr(c){
 for(const s of D.st.filter(s=>s.c===c.id))for(const sb of c.sub){
  const key=s.id+'|'+sb,a=D.g[key];if(!a)continue;
  const prev=sent[key],ch={};let n=0;
  for(let i=0;i<11;i++){const x=num(a[i]),p=prev?(prev[i]??null):null;
   if(x!==p&&!(x===null&&!prev)){ch[i]=x;n++}}
  if(!n)continue;
  sent[key]=Array.from({length:11},(_,i)=>num(a[i]));
  const d={sid:s.id,sub:sb,v:ch,u:Date.now()};
  if(!known.has(key))d.t=user.uid;
  try{await F.setDoc(F.doc(db,'sections',c.code,'grades',s.id+'__'+sb.replace(/\//g,'-')),d,{merge:true});known.add(key)}
  catch(e){sent[key]=prev}
 }
}

/* استقبال درجات المعلمين */
function listen(){
 Object.values(unsubs).forEach(f=>f());for(const k in unsubs)delete unsubs[k];
 if(!user)return;
 linked().forEach(c=>{unsubs[c.code]=F.onSnapshot(F.collection(db,'sections',c.code,'grades'),snap=>{
  let ch=0;
  snap.docChanges().forEach(x=>{
   const d=x.doc;if(d.metadata.hasPendingWrites)return;
   const o=d.data(),key=o.sid+'|'+o.sub;known.add(key);LU[c.code+'|'+o.sub]=Math.max(LU[c.code+'|'+o.sub]||0,o.u||0);
   const a=D.g[key]=D.g[key]||[],sv=sent[key]=sent[key]||Array(11).fill(null);
   for(const i in (o.v||{})){const val=o.v[i];
    if(val!==num(a[i])){a[i]=val===null?'':String(val);ch++}
    sv[i]=val}
  });
  if(ch){save();render();toast('وصلت درجات جديدة 📥')}
 },()=>{})});
}

U.onAuthStateChanged(auth,u=>{user=u;lastLm=-1;listen();rosterListen();if(u)F.getDoc(F.doc(db,'users',u.uid,'data','main')).catch(e=>toast('خطأ المزامنة: '+(e.code||e.message)))});
setInterval(()=>{if(!user||D.lm===lastLm)return;lastLm=D.lm;
 linked().forEach(c=>{pushSec(c).catch(()=>{});pushGr(c)})},2500);

/* ---- واجهة الربط ---- */
function linkUI(){
 if(!user)return toast('سجّل دخولك بالسحابة ☁️ أولاً');
 const c=C();if(!c)return toast('أضف شعبة أولاً ➕');
 if(!c.code)return modal('🔗 ربط الشعبة بالمعلمين',`<p>سينشأ رمز انضمام لهذه الشعبة (${esc(cname(c))}). المعلم يدخله بدفتر الصف فتصلك درجات مادته هنا تلقائياً، وكل معلم يكتب مادته فقط.</p>`,()=>{
  c.code=gen();save();listen();pushSec(c).then(()=>pushGr(c)).catch(()=>toast('تعذر الرفع، تأكد من الإنترنت وقواعد Firestore'));render();setTimeout(linkUI,250)},'إنشاء الرمز');
 const m=modal('🔗 ربط الشعبة',`<p>رمز الانضمام للمعلمين:</p><h2 dir="ltr" style="text-align:center;letter-spacing:4px;margin:10px 0">${c.code}</h2><p class="mu">اكتب هذا الرمز بدفتر الصف. المواد المربوطة: ${c.sub.map(esc).join('، ')||'—'}</p><button class="b" id="lr">🔄 تحديث قائمة الطلاب والمواد</button><button class="b g" id="lq">🛑 إيقاف الربط</button>`);
 m.querySelector('#lr').onclick=()=>{pushSec(c).then(()=>{pushGr(c);toast('تم التحديث ✅')}).catch(()=>toast('تعذر التحديث'))};
 m.querySelector('#lq').onclick=()=>{delete c.code;save();listen();m.remove();render()};
}
/* ---- استيراد طلاب الشعبة من جدول المدرسة المشترك ---- */
const nrm=s=>String(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim();
window.impSchool=async()=>{
 if(!user)return toast('سجّل دخولك بالسحابة ☁️ أولاً');
 const c=C();if(!c)return toast('أضف شعبة أولاً ➕');
 try{
  const q=await F.getDocs(F.collection(db,'roster'));
  const L=[];
  q.forEach(d=>{const r=d.data();if(!r.del&&nrm(r.g)===nrm(c.g)&&nrm(r.s)===nrm(c.s))L.push({eid:d.id,n:r.n})});
  L.sort((a,b)=>nrm(a.n).localeCompare(nrm(b.n),'ar'));
  const mine=S();let no=Math.max(0,...mine.map(s=>s.no||0)),add=0;
  L.forEach(r=>{
   const s=mine.find(x=>x.eid===r.eid||x.id===r.eid)||mine.find(x=>nrm(x.n)===nrm(r.n));
   if(!s){D.st.push({id:r.eid,eid:r.eid,c:D.cur,n:r.n,adm:'',nt:'',no:++no});add++}
   else if(!s.eid)s.eid=r.eid;
  });
  S().slice().sort((a,b)=>nrm(a.n).localeCompare(nrm(b.n),'ar')).forEach((s,i)=>s.no=i+1);
  const ids=new Set(L.map(r=>r.eid));
  const gone=mine.filter(s=>s.eid&&!ids.has(s.eid)).length;
  save();render();
  toast(L.length?`تمت إضافة ${add} طالب${gone?` — ${gone} لم يعد بهذه الشعبة`:''}`:'لا يوجد طلاب بهذه الشعبة بجدول المدرسة');
 }catch(e){toast(e.code==='permission-denied'?'اطلب من المالك إضافتك معلماً لهذا الصف':'تعذر: '+(e.code||e.message))}
};
const v0=TABS[0][3];
window.sortAr=()=>{S().slice().sort((a,b)=>nrm(a.n).localeCompare(nrm(b.n),'ar')).forEach((s,i)=>s.no=i+1);save();render();toast('تم الترتيب الأبجدي ✅')};
TABS[0][3]=()=>(D.cur?'<button class="b g" onclick="impSchool()">📥 استيراد طلاب الشعبة من المدرسة</button><button class="b g" onclick="sortAr()">🔤 ترتيب الطلاب أبجدياً</button>':'')+v0();
render();

/* ---- النواقص والمراجعة السريعة ---- */
const MS={m:0};let ROWS=[];
function vMs(){
 const c=C();if(!c)return empty('📉','أضف شعبة أولاً ➕');
 const L=S();if(!L.length)return empty('👥','لا يوجد طلاب');
 if(!c.sub.length)return empty('📚','اختر مواد الشعبة من تبويب الطلاب');
 ROWS=c.sub.map(sb=>{
  const miss=[],low=[];
  L.forEach(s=>{const x=num((D.g[s.id+'|'+sb]||[])[MS.m]);if(x===null)miss.push(s);else if(x<50)low.push(s)});
  return {sb,miss,low,lu:LU[(c.code||'')+'|'+sb]};
 });
 const ok=ROWS.filter(r=>!r.miss.length).length;
 return `<div class="days">${CO.map((x,i)=>`<button class="${i===MS.m?'on':''}" onclick="msM(${i})">${x}</button>`).join('')}</div>`
  +`<div class="chips"><span>✅ ${ok} من ${ROWS.length} مواد مكتملة</span></div>`
  +ROWS.map((r,i)=>`<div class="card" onclick="msOpen(${i})"><b>${esc(r.sb)}<br><span class="mu">${r.lu?'آخر تحديث: '+new Date(r.lu).toLocaleDateString('ar-IQ'):'لم تصل درجات من معلم'}</span></b>${r.low.length?`<span class="pill neg">أقل من 50: ${r.low.length}</span>`:''}<span class="pill ${r.miss.length?'wn':'ok'}">${r.miss.length?'ناقص '+r.miss.length:'✅ مكتمل'}</span></div>`).join('')
  +'<p class="mu">اضغط المادة لعرض أسماء الطلاب الناقصين أو الراسبين.</p>';
}
window.msM=i=>{MS.m=i;render()};
window.msOpen=i=>{
 const r=ROWS[i];if(!r)return;
 const nm=s=>`<div class="card"><span class="n">${s.no}</span><b>${esc(s.n)}</b></div>`;
 modal(esc(r.sb)+' — '+CO[MS.m],(r.miss.length?'<p><b>لم تُدخل درجتهم:</b></p>'+r.miss.map(nm).join(''):'<p>✅ كل الدرجات مدخلة</p>')+(r.low.length?'<p><b>أقل من 50:</b></p>'+r.low.map(nm).join(''):''));
};
TABS.push(['ms','📉','النواقص',vMs]);

/* ---- بحث يتجاهل (أ/ا) و(ى/ي) ---- */
window.list=function(){
 const q=nrm(Q);
 return S().filter(s=>!q||nrm(s.n).includes(q)||(s.adm||'').includes(Q.trim())).map(s=>`<div class="card"><span class="n">${s.no}</span><b>${esc(s.n)}<br><span class="mu">رقم القبول: ${esc(s.adm||'—')}</span>${s.nt?` <span class="pill wn">${esc(s.nt)}</span>`:''}</b><button class="ic s" onclick="editS('${s.id}')">✏️</button><button class="ic s" onclick="delS('${s.id}')">🗑</button></div>`).join('')||empty('👥','لا يوجد طلاب');
};
render();

/* ---- مزامنة تلقائية لطلاب الشعب من جدول المدرسة ---- */
let unR=null;
function rosterListen(){
 if(unR){unR();unR=null}
 if(!user)return;
 unR=F.onSnapshot(F.collection(db,'roster'),snap=>{
  const R=snap.docs.map(d=>({eid:d.id,...d.data()}));
  const x=syncR(R);
  if(x.add||x.ch){save();render();if(x.add)toast('أضيف '+x.add+' طالب جديد من المدرسة 📥')}
 },()=>{});
}
function syncR(R){
 let add=0,ch=0;
 const cmp=(a,b)=>nrm(a.n).localeCompare(nrm(b.n),'ar');
 D.cl.forEach(c=>{
  const mine=D.st.filter(s=>s.c===c.id);
  const same=r=>nrm(r.g)===nrm(c.g)&&nrm(r.s)===nrm(c.s);
  const L=R.filter(r=>!r.del&&same(r)).sort(cmp);
  let no=Math.max(0,...mine.map(s=>s.no||0)),added=0;
  L.forEach(r=>{
   const s=mine.find(y=>y.eid===r.eid||y.id===r.eid)||mine.find(y=>!y.eid&&nrm(y.n)===nrm(r.n));
   if(!s){
    const ns={id:D.st.some(y=>y.id===r.eid)?uid():r.eid,eid:r.eid,c:c.id,n:r.n,adm:'',nt:'',no:++no};
    D.st.push(ns);mine.push(ns);add++;added++;
   }else if(!s.eid){s.eid=r.eid;ch++}
  });
  mine.forEach(s=>{
   if(!s.eid)return;
   const r=R.find(y=>y.eid===s.eid);
   let note='';
   if(!r||r.del)note='غير موجود بجدول المدرسة';
   else if(!same(r))note='انتقل إلى '+r.g+' / '+r.s;
   const auto=!s.nt||s.nt.startsWith('انتقل إلى ')||s.nt==='غير موجود بجدول المدرسة';
   if(auto&&(s.nt||'')!==note){s.nt=note;ch++}
  });
  if(added)D.st.filter(s=>s.c===c.id).sort(cmp).forEach((s,i)=>s.no=i+1);
 });
 return {add,ch};
}

/* ---- تنظيف الإيميل عند الدخول (رموز مخفية من لوحة المفاتيح العربية أو النسخ) ---- */
const clean=s=>String(s||'').replace(/[\s\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).toLowerCase();
window.ca=async kind=>{
 const e=clean($('#cem').value),p=$('#cpw').value;
 if(!e)return toast('اكتب الإيميل');
 try{
  if(kind==='reset'){await cloud.reset(e);return toast('أرسلنا رابط تغيير كلمة المرور لإيميلك 📧')}
  if(!p)return toast('اكتب كلمة المرور');
  await cloud[kind](e,p);document.querySelectorAll('.ov').forEach(x=>x.remove());toast('تم تسجيل الدخول ✅');
 }catch(x){toast(ERR[x.code]||'تعذر: '+(x.code||x.message))}
};

})();
