/* teacher-cloud.js — حفظ بيانات دفتر المعلم بالسحابة على إيميله (يُحمّل تلقائياً من teacher-link.js) */
(()=>{
const LM='dm_lm';
let user=null,db,F,last=localStorage.getItem('dm')||'',timer=null,st='',pushing=false,applying=false;
const has=o=>o&&((o.cl&&o.cl.length)||(o.st&&o.st.length));
const ref=()=>F.doc(db,'users',user.uid,'data','teacher');
const lml=()=>+localStorage.getItem(LM)||0;
const show=()=>{const e=document.getElementById('tcs');if(e)e.textContent=st};

async function push(){
 if(!user||pushing)return;
 pushing=true;st='🔄 جاري الحفظ بالسحابة…';show();
 const raw=localStorage.getItem('dm')||'',lm=lml()||Date.now();
 try{await F.setDoc(ref(),{data:raw,lm,at:Date.now()});last=raw;st='✅ بياناتك محفوظة بالسحابة'}
 catch(e){st='⚠️ تعذر الحفظ بالسحابة، سيعاد عند رجوع الاتصال'}
 pushing=false;show();
}
function take(c,lm){
 try{localStorage.setItem('dm_prev',localStorage.getItem('dm')||'')}catch(e){}
 applying=true;D=Object.assign(E0(),c);save();
 localStorage.setItem(LM,String(lm||Date.now()));last=localStorage.getItem('dm')||'';
 applying=false;st='✅ تم تنزيل بياناتك من السحابة';render();toast('تم تنزيل بياناتك من السحابة ☁️');
}
function ask(title,body,b1,f1,b2,f2){
 const m=modal(title,body+`<button class="b" id="k1">${b1}</button><button class="b g" id="k2">${b2}</button>`);
 m.querySelector('#k1').onclick=()=>{m.remove();f1()};
 m.querySelector('#k2').onclick=()=>{m.remove();f2()};
}
async function start(){
 const T=window.TL;
 if(!T||!T.user){user=null;st='';return}
 if(user&&user.uid===T.user.uid)return;
 F=T.F;db=T.db;user=T.user;
 const uid=user.uid,flag='tc_'+uid;
 try{
  const s=await F.getDoc(ref());
  let c=null,cl=0;
  if(s.exists()){try{c=JSON.parse(s.data().data)}catch(e){}cl=s.data().lm||0}
  let local={};try{local=JSON.parse(localStorage.getItem('dm')||'{}')}catch(e){}
  const owner=localStorage.getItem('dm_owner'),done=()=>{localStorage.setItem(flag,'1');localStorage.setItem('dm_owner',uid)};
  if(owner&&owner!==uid&&has(local)){
   return ask('⚠️ بيانات حساب آخر','<p>بيانات هذا الجهاز تخص حساباً ثانياً. شنو تريد؟</p>',
    'بدء نظيف بهذا الحساب',()=>{c&&has(c)?take(c,cl):(localStorage.setItem('dm_prev',localStorage.getItem('dm')||''),D=E0(),save(),localStorage.setItem(LM,String(Date.now())),render());done()},
    'استخدام بيانات الجهاز',()=>{done();localStorage.setItem(LM,String(Date.now()));push()});
  }
  if(!has(c)){if(has(local)){if(!lml())localStorage.setItem(LM,String(Date.now()));await push()}else st='✅ السحابة جاهزة';done();show();return}
  if(!has(local)){take(c,cl);done();return}
  if(cl===lml()){st='✅ بياناتك محفوظة بالسحابة';done();show();return}
  if(!localStorage.getItem(flag)){
   return ask('☁️ يوجد بيانات بالجهاز وبالسحابة',`<p class="mu">السحابة: ${(c.st||[]).length} طالب · الجهاز: ${(local.st||[]).length} طالب</p><p class="mu">اختر النسخة الي تريد الاحتفاظ بها.</p>`,
    '☁️ استخدم بيانات السحابة',()=>{take(c,cl);done()},
    '📱 استخدم بيانات الجهاز',()=>{done();localStorage.setItem(LM,String(Date.now()));push()});
  }
  if(cl>lml())take(c,cl);else await push();
  done();
 }catch(e){st='⚠️ تعذر الاتصال بالسحابة: '+(e.code||'');show()}
}
addEventListener('tl-user',start);
if(window.TL&&window.TL.user)start();

setInterval(()=>{
 if(!user||applying||pushing)return;
 const cur=localStorage.getItem('dm')||'';
 if(cur!==last){localStorage.setItem(LM,String(Date.now()));clearTimeout(timer);timer=setTimeout(push,1500)}
},3000);

const o=TABS[0][3];
TABS[0][3]=()=>`<p class="mu" id="tcs">${user?esc(st):'☁️ سجّل دخولك من تبويب 🔗 المرشد لحفظ بياناتك بالسحابة'}</p>`+o();
})();
