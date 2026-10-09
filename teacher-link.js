/* teacher-link.js — ربط دفتر المعلم (teacher-app.html) بسجل الدرجات عند مرشد الصف
   ضعه بجانب teacher-app.html وأضف قبل </body> سطر:  <script type="module" src="teacher-link.js"></script> */
(async()=>{
const cfg={apiKey:"AIzaSyBkyhe6WrXrBz_jraFt1O0aIW5UoI-oE_g",authDomain:"grades-record-1a3bd.firebaseapp.com",projectId:"grades-record-1a3bd",storageBucket:"grades-record-1a3bd.firebasestorage.app",messagingSenderId:"250496527897",appId:"1:250496527897:web:98d1eedf8b62695f1f0488"};
const CO=['تشرين 1','تشرين 2','كانون 1','كانون 2','نصف السنة','شباط','آذار','نيسان','أيار','النهائي','الدور الثاني'];
const ERR={'auth/invalid-credential':'الإيميل أو كلمة المرور غير صحيحة','auth/wrong-password':'كلمة المرور غير صحيحة','auth/user-not-found':'لا يوجد حساب بهذا الإيميل','auth/email-already-in-use':'هذا الإيميل مسجّل مسبقاً، اضغط دخول','auth/weak-password':'كلمة المرور قصيرة (6 أحرف على الأقل)','auth/invalid-email':'صيغة الإيميل غير صحيحة','auth/network-request-failed':'لا يوجد اتصال بالإنترنت'};
const LS='tl_links';
let links=[];try{links=JSON.parse(localStorage.getItem(LS)||'[]')}catch(e){}
const keep=()=>{try{localStorage.setItem(LS,JSON.stringify(links))}catch(e){}};
let ready=false,fail=false,user=null,A,U,F,db,auth;
const LK={cur:null,m:0},DATA={},pend={},timers={};
const key=l=>l.code+'|'+l.subject;
const cur=()=>links[LK.cur];
const dig=s=>{const a='٠١٢٣٤٥٦٧٨٩';let o=s.replace(/٫|,/g,'.');for(let i=0;i<10;i++)o=o.split(a[i]).join(i);return o};
const fmt=x=>x===undefined||x===null?'':String(x);

/* ---- التبويب ---- */
function vLk(){
 if(!ready)return empty('☁️',fail?'تعذر تحميل السحابة، تأكد من الإنترنت':'جاري التحميل…');
 if(!user)return empty('🔗','سجّل دخولك لتربط شعبتك بمرشد الصف')+'<button class="b" onclick="lkLogin()">☁️ تسجيل الدخول</button>';
 const l=cur();
 if(!l)return '<button class="b" onclick="lkAdd()">➕ إضافة رمز شعبة</button>'
  +(links.length?links.map((x,i)=>`<div class="card" onclick="lkOpen(${i})"><span class="n">🔗</span><b>${esc(x.name)}<br><span class="mu">المادة: ${esc(x.subject)}</span></b><button class="ic s" onclick="event.stopPropagation();lkDel(${i})">🗑</button></div>`).join(''):empty('🔗','اطلب رمز الشعبة من مرشد الصف وأضفه هنا'))
  +`<button class="b g" onclick="lkOut()">🚪 تسجيل الخروج (${esc(user.email||'')})</button>`;
 const d=DATA[key(l)];
 const head=`<button class="b g" onclick="lkBack()">⬅️ رجوع</button><p class="mu">${esc(l.name)} — ${esc(l.subject)}</p>`;
 if(!d)return head+empty('⏳','جاري تحميل الشعبة…');
 return head+`<div class="days">${CO.map((x,i)=>`<button class="${i===LK.m?'on':''}" onclick="lkM(${i})">${x}</button>`).join('')}</div>`
  +(d.roster.length?d.roster.map(s=>`<div class="card"><span class="n">${esc(s.no??'')}</span><b>${esc(s.n)}</b><input type="number" inputmode="decimal" min="0" max="100" style="width:76px;margin:0;text-align:center;font-weight:700" value="${fmt((d.docs[s.id]||{})[LK.m])}" oninput="lkIn('${s.id}',this.value)"></div>`).join(''):empty('👥','لا يوجد طلاب بهذه الشعبة'));
}
TABS.push(['lk','🔗','المرشد',vLk]);
render();

/* ---- حفظ الدرجات (مستند لكل طالب+مادة، والمعلم يكتب مادته فقط) ---- */
async function put(l,sid,m,text){
 const d=DATA[key(l)];if(!d||!user)return;
 const t=dig(text.trim());let val=null;
 if(t){val=+t;if(isNaN(val)||val<0||val>100)return toast('الدرجة بين 0 و 100')}
 else if((d.docs[sid]||{})[m]==null)return;
 const isNew=!d.docs[sid];(d.docs[sid]=d.docs[sid]||{})[m]=val;
 const data={sid,sub:l.subject,v:{[m]:val},u:Date.now()};
 if(isNew)data.t=user.uid;
 try{await F.setDoc(F.doc(db,'sections',l.code,'grades',sid+'__'+l.subject.replace(/\//g,'-')),data,{merge:true})}
 catch(e){toast(e.code==='permission-denied'?'لا تملك صلاحية تعديل هذه الدرجة':'تعذر الحفظ')}
}
async function run(pk){const p=pend[pk];if(!p)return;delete pend[pk];await put(p.l,p.sid,p.m,p.t)}
async function flush(){for(const pk of Object.keys(pend)){clearTimeout(timers[pk]);await run(pk)}}
addEventListener('visibilitychange',()=>{if(document.hidden)flush()});

/* ---- الواجهة ---- */
window.lkIn=(sid,t)=>{const l=cur(),pk=key(l)+'#'+sid+'#'+LK.m;pend[pk]={l,sid,m:LK.m,t};clearTimeout(timers[pk]);timers[pk]=setTimeout(()=>run(pk),700)};
window.lkM=async i=>{await flush();LK.m=i;render()};
window.lkBack=async()=>{await flush();LK.cur=null;render()};
window.lkDel=i=>ask('إلغاء ربط هذه الشعبة؟ (درجاتك المرسلة تبقى عند المرشد)',()=>{links.splice(i,1);keep();render()});
window.lkOpen=async i=>{
 LK.cur=i;LK.m=0;const l=links[i],k=key(l);render();
 if(DATA[k])return;
 try{
  const s=await F.getDoc(F.doc(db,'sections',l.code));
  const roster=((s.data()||{}).st||[]).slice().sort((a,b)=>(a.no||0)-(b.no||0));
  const q=await F.getDocs(F.query(F.collection(db,'sections',l.code,'grades'),F.where('sub','==',l.subject)));
  const docs={};q.forEach(x=>{const o=x.data();docs[o.sid]=o.v||{}});
  DATA[k]={roster,docs};
 }catch(e){toast('تعذر تحميل الشعبة، تأكد من الإنترنت');LK.cur=null}
 render();
};
window.lkAdd=()=>modal('🔗 رمز الشعبة','<input id="lc" dir="ltr" placeholder="الرمز من مرشد الصف" style="text-transform:uppercase">',m=>{
 const code=v(m,'#lc').toUpperCase();if(!code)return false;lkFetch(code)},'ربط');
async function lkFetch(code){
 try{
  const s=await F.getDoc(F.doc(db,'sections',code));
  if(!s.exists())return toast('الرمز غير صحيح');
  const d=s.data(),subs=d.sub||[];
  if(!subs.length)return toast('المرشد لم يحدد مواد لهذه الشعبة');
  const m=modal('اختر مادتك',`<p class="mu">${esc(d.name||code)}</p>`+subs.map((x,i)=>`<button class="b g" data-i="${i}">${esc(x)}</button>`).join(''));
  m.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{
   const subject=subs[+b.dataset.i];
   if(links.some(x=>x.code===code&&x.subject===subject)){m.remove();return toast('مربوطة مسبقاً')}
   links.push({code,name:d.name||code,subject});keep();m.remove();render();toast('تم الربط ✅')});
 }catch(e){toast('تعذر الاتصال، تأكد من الإنترنت')}
}
window.lkLogin=()=>modal('☁️ تسجيل الدخول','<p class="mu">سجّل بإيميلك حتى تصل درجاتك لمرشد الصف.</p><input id="le" type="email" dir="ltr" placeholder="الإيميل"><input id="lp" type="password" dir="ltr" placeholder="كلمة المرور (6 أحرف على الأقل)"><button class="b" onclick="lkAuth(0)">دخول</button><button class="b g" onclick="lkAuth(1)">إنشاء حساب جديد</button>');
window.lkAuth=async s=>{
 const e=$('#le').value.trim(),p=$('#lp').value;if(!e||!p)return toast('اكتب الإيميل وكلمة المرور');
 try{if(s)await U.createUserWithEmailAndPassword(auth,e,p);else await U.signInWithEmailAndPassword(auth,e,p);
  document.querySelectorAll('.ov').forEach(x=>x.remove());toast('تم تسجيل الدخول ✅')}
 catch(x){toast(ERR[x.code]||'تعذر: '+(x.code||''))}
};
window.lkOut=async()=>{await flush();await U.signOut(auth);LK.cur=null};

/* ---- Firebase ---- */
const G='https://www.gstatic.com/firebasejs/10.12.2/';
try{
 [A,U,F]=await Promise.all([import(G+'firebase-app.js'),import(G+'firebase-auth.js'),import(G+'firebase-firestore.js')]);
 const app=A.getApps().length?A.getApp():A.initializeApp(cfg);
 auth=U.getAuth(app);
 try{db=F.initializeFirestore(app,{localCache:F.persistentLocalCache()})}catch(e){db=F.getFirestore(app)}
 U.onAuthStateChanged(auth,u=>{user=u;ready=true;render()});
}catch(e){fail=true;ready=false;render()}
})();
