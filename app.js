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

  /* play a visual's animation once it reaches the reading zone. People read in the top
     half of the screen while scrolling, so wait until the visual's top edge passes 55%
     of the way down, not the moment it peeks in at the bottom. */
  var plays=document.querySelectorAll('.vis');
  if(plays.length && !reduce && 'IntersectionObserver' in window){
    var po=new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('play'); po.unobserve(en.target); } });
    },{rootMargin:'0px 0px -45% 0px',threshold:0});
    plays.forEach(function(el){el.classList.add('armed');po.observe(el);});
    /* near the end of the page the last visuals may never climb that high, so reaching
       the bottom plays whatever is still waiting */
    var atEnd=function(){
      if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-40){
        document.querySelectorAll('.vis.armed:not(.play)').forEach(function(el){el.classList.add('play');po.unobserve(el);});
        window.removeEventListener('scroll',atEnd);
      }
    };
    window.addEventListener('scroll',atEnd,{passive:true}); atEnd();
  }

  /* prefetch the next page before the click. Chromium browsers get speculation rules
     (fetch on hover or press); others get a <link rel=prefetch> on hover or touch. Only
     same-site pages, never the PDF. */
  (function prefetch(){
    var sameSite=function(a){return a.origin===location.origin && /\.html$|\/$/.test(a.pathname) && a.pathname!==location.pathname;};
    if(HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')){
      var s=document.createElement('script'); s.type='speculationrules';
      s.textContent=JSON.stringify({prefetch:[{where:{and:[{href_matches:'/*'},{not:{href_matches:'/*.pdf'}}]},eagerness:'moderate'}]});
      document.head.appendChild(s); return;
    }
    var done={};
    var warm=function(e){
      var a=e.target.closest && e.target.closest('a[href]'); if(!a||!sameSite(a)||done[a.href]) return;
      done[a.href]=1; var l=document.createElement('link'); l.rel='prefetch'; l.href=a.href; document.head.appendChild(l);
    };
    document.addEventListener('mouseover',warm,{passive:true});
    document.addEventListener('touchstart',warm,{passive:true});
  })();

  /* More cases: two other case studies, picked fresh on every visit. The HTML ships with
     two fixed links so this works with JavaScript off; Math.random() (no seed, no date,
     nothing derived from the page) swaps them, never picking the page you are on. */
  var moreRow=document.getElementById('moreCases');
  if(moreRow){
    var CASES=[
      {url:'case-tools-agree.html',   title:"Our tools never agree on what's booked", topic:'Systems built'},
      {url:'case-wrong-quotes.html',  title:'Salespeople keep sending wrong quotes',  topic:'Systems built'},
      {url:'case-silent-failures.html',title:'We only find out something broke when someone happens to look', topic:'Systems built'},
      {url:'case-cutover.html',      title:'Can we switch systems without stopping the business?', topic:'Systems built'},
      {url:'case-matchday-payroll.html', title:'Matchday payroll eats a whole morning after every game', topic:'Systems built'},
      {url:'case-profit-gap.html', title:'Why is our profit lower than the report says?', topic:'Money found'},
      {url:'case-double-payments.html', title:'Are we paying anyone twice?', topic:'Money found'},
      {url:'case-reconciliation.html', title:'Can 15,000 payments a month match themselves?', topic:'Money found'},
      {url:'case-supplier-invoices.html', title:'Supplier invoices eat hours of data entry', topic:'Systems built'}
    ];
    var here=(location.pathname.split('/').pop()||'').toLowerCase();
    var pool=CASES.filter(function(c){return c.url.toLowerCase()!==here;});
    if(pool.length>1){
      for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
      moreRow.innerHTML=pool.slice(0,2).map(function(c){
        return '<a class="mc" href="'+c.url+'"><span class="mc-k">'+c.topic+'</span><span class="mc-t">'+c.title+'</span></a>';
      }).join('');
    }
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

  /* mark the current page in the header nav */
  (function markCurrentNav(){
    var path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(path==='') path='index.html';
    document.querySelectorAll('.site-header .nav a').forEach(function(a){
      var href=a.getAttribute('href');
      if(!href||href.charAt(0)==='#'||href.indexOf('mailto:')===0) return;
      var file=href.split('/').pop().split('#')[0].split('?')[0].toLowerCase();
      if(file===path||(path==='index.html'&&file==='')){ a.setAttribute('aria-current','page'); }
    });
  })();
})();
