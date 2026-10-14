/* teacher-link.js — ربط دفتر المعلم (teacher-app.html) بسجل الدرجات عند مرشد الصف
   ضعه بجانب teacher-app.html وأضف قبل </body> سطر:  <script type="module" src="teacher-link.js"></script> */
(async()=>{
import('./teacher-roster.js').catch(()=>{});
import('./teacher-cloud.js').catch(()=>{});
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
const nrm=s=>String(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim();
/* تقسيم الدرجات حسب المادة (يبقى بدفتر المعلم، والمجموع فقط يصل للمرشد) */
const SCH={
 'التربية الإسلامية':[['الامتحان',80],['نشاط',20]],
 'اللغة العربية':[['قواعد',30],['تعبير',20],['إملاء',10],['خط',10],['قراءة',10],['دفتر',10],['سلوك',10]],
 'اللغة الإنكليزية':[['Speaking',20],['Reading',10],['Listening',10],['الامتحان',60]]
};
const SCHN={};Object.keys(SCH).forEach(k=>SCHN[nrm(k)]=SCH[k]);
const schOf=sub=>{const k=nrm(sub);return SCHN[k]||(/ان[كج]ليزي/.test(k)?SCH['اللغة الإنكليزية']:undefined)};
const ptk=(l,sid,m)=>l.code+'|'+l.subject+'|'+sid+'|'+m;
const PT=(l,sid,m)=>(D.pt&&D.pt[ptk(l,sid,m)])||[];

/* ---- التبويب ---- */
function vLk(){
 if(!ready)return empty('☁️',fail?'تعذر تحميل السحابة، تأكد من الإنترنت':'جاري التحميل…');
 if(!user)return empty('🔗','سجّل دخولك لتربط شعبتك بمرشد الصف')+'<button class="b" onclick="lkLogin()">☁️ تسجيل الدخول</button>';
 if(LK.cur!==null&&links[LK.cur]&&links[LK.cur].cid&&links[LK.cur].cid!==D.cur){flush();LK.cur=null}
 const l=cur();
 const vis=links.map((x,i)=>[x,i]).filter(([x])=>!x.cid||x.cid===D.cur);
 if(!l)return `<p class="mu">الصف الحالي: ${esc(cn(D.cur))} — غيّر الصف من القائمة بالأعلى لتشوف شعبة ثانية</p><button class="b" onclick="lkAdd()">➕ ربط شعبة لهذا الصف</button>`
  +(vis.length?vis.map(([x,i])=>`<div class="card" onclick="lkOpen(${i})"><span class="n">🔗</span><b>${esc(x.name)}<br><span class="mu">المادة: ${esc(x.subject)}</span></b><button class="ic s" onclick="event.stopPropagation();lkDel(${i})">🗑</button></div>`).join(''):empty('🔗','لا توجد شعبة مربوطة بهذا الصف. اطلب رمز شعبته من مرشد الصف وأضفه'))
  +`<button class="b g" onclick="lkOut()">🚪 تسجيل الخروج (${esc(user.email||'')})</button>`;
 const d=DATA[key(l)];
 const head=`<button class="b g" onclick="lkBack()">⬅️ رجوع</button><p class="mu">${esc(l.name)} — ${esc(l.subject)}</p>`;
 if(!d)return head+empty('⏳','جاري تحميل الشعبة…');
 return head+`<div class="days">${CO.map((x,i)=>`<button class="${i===LK.m?'on':''}" onclick="lkM(${i})">${x}</button>`).join('')}</div>`
  +'<div id="lkst"></div>'+(setTimeout(()=>window.lkStat&&window.lkStat(),0),'')
  +(window.sqBox?window.sqBox():'')+body(d,l)+(setTimeout(()=>window.sqFlt&&window.sqFlt(),0),'');
}
TABS.push(['lk','🔗','المرشد',vLk]);
render();

/* ---- جدول الدرجات (بسيط أو بتقسيم المادة) ---- */
function body(d,l){
 if(!d.roster.length)return empty('👥','لا يوجد طلاب بهذه الشعبة');
 const sc=schOf(l.subject);
 if(!sc)return d.roster.map((s,i)=>`<div class="card"><span class="n">${i+1}</span><b>${esc(s.n)}</b><input type="number" inputmode="decimal" min="0" max="100" style="width:76px;margin:0;text-align:center;font-weight:700" value="${fmt((d.docs[s.id]||{})[LK.m])}" data-sid="${s.id}" oninput="lkIn('${s.id}',this.value)"></div>`).join('');
 return '<p class="mu">تُدخل درجات التقسيم، والمجموع فقط يصل لمرشد الصف.</p><div class="tw"><table><tr><th>الاسم الثلاثي</th>'+sc.map(([n,mx])=>`<th>${n}<br>${mx}</th>`).join('')+'<th>المجموع</th></tr>'
  +d.roster.map((s,i)=>{
   const p=PT(l,s.id,LK.m),f=sc.map((_,j)=>p[j]).filter(v=>v!==undefined&&v!==''),
    tot=f.length?Math.round(f.reduce((a,b)=>a+ +b,0)*100)/100:fmt((d.docs[s.id]||{})[LK.m]);
   return `<tr><td>${i+1}. ${esc(s.n)}</td>`+sc.map(([n,mx],j)=>`<td><input type="number" inputmode="decimal" min="0" max="${mx}" value="${fmt(p[j])}" oninput="lkPt('${s.id}',${j},this)"></td>`).join('')+`<td data-tot="${s.id}"><b>${tot}</b></td></tr>`;
  }).join('')+'</table></div>';
}
window.lkPt=(sid,j,inp)=>{
 const l=cur(),sc=schOf(l.subject),mx=sc[j][1],x=dig(inp.value.trim());
 if(x!==''){const n=+x;if(isNaN(n)||n<0||n>mx){inp.value=fmt(PT(l,sid,LK.m)[j]);alert('⚠️ الحد الأقصى لهذه الخانة '+mx);return}}
 D.pt=D.pt||{};const k=ptk(l,sid,LK.m),p=(D.pt[k]=D.pt[k]||[]);p[j]=x;save();
 const f=sc.map((_,i)=>p[i]).filter(v=>v!==undefined&&v!==''),
  tot=f.length?Math.round(f.reduce((a,b)=>a+ +b,0)*100)/100:'';
 const e=document.querySelector('[data-tot="'+sid+'"]');if(e)e.innerHTML='<b>'+tot+'</b>';
 lkIn(sid,String(tot));
};

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
window.lkIn=(sid,t)=>{const l=cur(),pk=key(l)+'#'+sid+'#'+LK.m;pend[pk]={l,sid,m:LK.m,t};clearTimeout(timers[pk]);timers[pk]=setTimeout(()=>run(pk),700);window.lkStat()};
window.lkStat=()=>{
 const e=document.getElementById('lkst');if(!e)return;
 const all=[...document.querySelectorAll('input[data-sid],[data-tot]')],vals=all.map(i=>parseFloat(dig(i.tagName==='INPUT'?i.value:i.textContent))).filter(x=>!isNaN(x));
 e.innerHTML=vals.length?`<div class="chips"><span>✍️ ${vals.length}/${all.length}</span><span>📊 ${(vals.reduce((p,q)=>p+q,0)/vals.length).toFixed(1)}</span><span>❌ ${vals.filter(x=>x<50).length}</span></div><p class="mu">أعلى ${Math.max(...vals)} · أدنى ${Math.min(...vals)} (أقل من 50 = راسب)</p>`:'<p class="mu">لم تُدخل درجات لهذا الشهر بعد</p>';
};
window.lkM=async i=>{await flush();LK.m=i;render()};
window.lkBack=async()=>{await flush();LK.cur=null;render()};
window.lkDel=i=>ask('إلغاء ربط هذه الشعبة؟ (درجاتك المرسلة تبقى عند المرشد)',()=>{links.splice(i,1);keep();render()});
window.lkOpen=async i=>{
 LK.cur=i;LK.m=0;const l=links[i],k=key(l);render();
 if(DATA[k])return;
 try{
  const s=await F.getDoc(F.doc(db,'sections',l.code));
  const roster=((s.data()||{}).st||[]).slice().sort((a,b)=>nrm(a.n).localeCompare(nrm(b.n),'ar'));
  const q=await F.getDocs(F.query(F.collection(db,'sections',l.code,'grades'),F.where('sub','==',l.subject)));
  const docs={};q.forEach(x=>{const o=x.data();docs[o.sid]=o.v||{}});
  DATA[k]={roster,docs};
 }catch(e){toast('تعذر: '+(e.code||e.message||'خطأ'));LK.cur=null}
 render();
};
window.lkAdd=()=>modal('🔗 رمز الشعبة','<input id="lc" dir="ltr" placeholder="الرمز من مرشد الصف" style="text-transform:uppercase">',m=>{
 const code=v(m,'#lc').toUpperCase();if(!code)return false;lkFetch(code)},'ربط');
async function lkFetch(code){
 try{
  const s=await F.getDoc(F.doc(db,'sections',code));
  if(!s.exists())return toast('الرمز غير صحيح');
  const d=s.data();let subs=d.sub||[];
  if(!subs.length)return toast('المرشد لم يحدد مواد لهذه الشعبة');
  try{const tt=await F.getDoc(F.doc(db,'teachers',(user.email||'').toLowerCase()));const only=tt.exists()?(tt.data().subjects||[]):[];if(only.length){subs=subs.filter(x=>only.includes(x));if(!subs.length)return toast('لا توجد مواد مخصصة لك بهذه الشعبة')}}catch(e){}
  const m=modal('اختر موادك',`<p class="mu">${esc(d.name||code)}</p>`+subs.map((x,i)=>`<label class="card"><input type="checkbox" data-i="${i}" style="width:22px;margin:0"><b>${esc(x)}</b></label>`).join('')+'<button class="b" id="lkok">🔗 ربط المواد المحددة</button>');
  m.querySelector('#lkok').onclick=()=>{
   let n=0;
   m.querySelectorAll('[data-i]:checked').forEach(b=>{
    const subject=subs[+b.dataset.i];
    if(!links.some(x=>x.code===code&&x.subject===subject)){links.push({code,name:d.name||code,subject,cid:D.cur||null});n++}});
   if(!n)return toast('اختر مادة جديدة واحدة على الأقل');
   keep();m.remove();render();toast('تم ربط '+n+' ✅')};
 }catch(e){toast('تعذر: '+(e.code||e.message||'خطأ'))}
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
 U.onAuthStateChanged(auth,u=>{user=u;ready=true;render();window.TL={F,db,auth,user:u};dispatchEvent(new Event('tl-user'))});
}catch(e){fail=true;ready=false;render()}
})();
