/* shared behaviours: theme toggle, scroll reveal, count-up, chaos resolve */
(function(){
  var root=document.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* theme (persists) */
  var saved=null; try{saved=localStorage.getItem('theme');}catch(e){}
  if(saved){root.setAttribute('data-theme',saved);}
  var btn=document.getElementById('themeToggle');
  function isDark(){var t=root.getAttribute('data-theme');
    if(t)return t==='dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;}
  function paint(){ if(btn) btn.textContent=isDark()?'☀':'☾'; }
  paint();
  if(btn){btn.addEventListener('click',function(){
    var next=isDark()?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem('theme',next);}catch(e){}
    paint();
  });}

  /* chaos -> order (landing only) */
  var chaos=document.getElementById('chaos');
  if(chaos){
    if(reduce){chaos.classList.add('resolved');}
    else{requestAnimationFrame(function(){setTimeout(function(){chaos.classList.add('resolved');},120);});}
  }

  /* count-up */
  function countUp(el){
    var target=parseFloat(el.getAttribute('data-count'));
    var pre=el.getAttribute('data-prefix')||'';
    var suf=el.getAttribute('data-suffix')||'';
    if(reduce){el.textContent=pre+target+suf;return;}
    var dur=1000,start=null;
    function step(ts){ if(!start)start=ts;
      var p=Math.min((ts-start)/dur,1); var e=1-Math.pow(1-p,3);
      el.textContent=pre+Math.round(target*e)+suf;
      if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  }

  /* reveal on scroll (+ trigger count-up) */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){
        en.target.classList.add('in');
        if(en.target.querySelectorAll){en.target.querySelectorAll('.n[data-count]').forEach(countUp);}
        io.unobserve(en.target);
      }});
    },{threshold:.18});
    document.querySelectorAll('[data-reveal]').forEach(function(el){io.observe(el);});
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function(el){el.classList.add('in');});
  }

  /* copy-to-clipboard buttons */
  function fallbackCopy(txt,cb){
    try{var t=document.createElement('textarea');t.value=txt;t.setAttribute('readonly','');
      t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);
      t.select();document.execCommand('copy');document.body.removeChild(t);cb();}catch(e){}
  }
  document.querySelectorAll('.copy-btn').forEach(function(b){
    var label=b.textContent;
    b.addEventListener('click',function(){
      var txt=b.getAttribute('data-copy')||'';
      var done=function(){b.textContent='Copied ✓';b.classList.add('copied');
        setTimeout(function(){b.textContent=label;b.classList.remove('copied');},1600);};
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(done,function(){fallbackCopy(txt,done);});
      }else{fallbackCopy(txt,done);}
    });
  });
})();
