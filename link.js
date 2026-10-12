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
const sent={},known=new Set(),unsubs={};
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
   const o=d.data(),key=o.sid+'|'+o.sub;known.add(key);
   const a=D.g[key]=D.g[key]||[],sv=sent[key]=sent[key]||Array(11).fill(null);
   for(const i in (o.v||{})){const val=o.v[i];
    if(val!==num(a[i])){a[i]=val===null?'':String(val);ch++}
    sv[i]=val}
  });
  if(ch){save();render();toast('وصلت درجات جديدة 📥')}
 },()=>{})});
}

U.onAuthStateChanged(auth,u=>{user=u;lastLm=-1;listen();if(u)F.getDoc(F.doc(db,'users',u.uid,'data','main')).catch(e=>toast('خطأ المزامنة: '+(e.code||e.message)))});
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
  const ids=new Set(L.map(r=>r.eid));
  const gone=mine.filter(s=>s.eid&&!ids.has(s.eid)).length;
  save();render();
  toast(L.length?`تمت إضافة ${add} طالب${gone?` — ${gone} لم يعد بهذه الشعبة`:''}`:'لا يوجد طلاب بهذه الشعبة بجدول المدرسة');
 }catch(e){toast(e.code==='permission-denied'?'اطلب من المالك إضافتك معلماً لهذا الصف':'تعذر: '+(e.code||e.message))}
};
const v0=TABS[0][3];
TABS[0][3]=()=>(D.cur?'<button class="b g" onclick="impSchool()">📥 استيراد طلاب الشعبة من المدرسة</button>':'')+v0();
render();

})();
