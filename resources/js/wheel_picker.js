/* ============================================================
   HF 휠 피커 (Wheel Picker) + 자동 적용
   - 마운트 요소 [data-wheel] 가 존재하면 자동으로 휠 피커를 붙임
   - 팝업(com_pop_wrap)처럼 숨겨져 있다가 보일 때도 정상 초기화(가시성 기반)
   - 동적으로 추가되는 마운트도 MutationObserver 로 자동 감지

   [마크업 예시]
   <div class="wheel-picker"
        data-wheel
        data-options='["2021","2022","2023","2024","2025"]'
        data-value="2023"
        data-target="#yearInput"></div>
   <input type="hidden" id="yearInput" value="2023">

   · data-options : JSON 배열  또는  "2021,2022,2023" / "예|아니요"
                    (생략 시 자식 [data-option] 또는 <option> 텍스트를 사용)
   · data-value   : 초기 선택값 (생략 시 첫 항목)
   · data-target  : 선택값을 반영할 요소 셀렉터
                    (input 이면 .value, 그 외엔 textContent 갱신)
   · 선택 변경 시 마운트에서 'wheel:change' 커스텀 이벤트 발생
     el.addEventListener('wheel:change', e => e.detail.value / e.detail.index)
   · 인스턴스 접근: el._wheelPicker  (value 게터 / select / destroy)
   ============================================================ */
(function (w, d) {
  'use strict';

  /* ---------- 원본 휠 피커 ---------- */
  function createWheelPicker(mount, options, value, onChange){
    let idx = options.indexOf(value);
    if(idx < 0){ idx = Math.min(options.length-1, Math.max(0, 2)); } // 비었으면 가운데쯤
    let selected = options[idx];

    const mask = document.createElement('div'); mask.className='wheel-mask';
    const band = document.createElement('div'); band.className='wheel-band'; band.setAttribute('aria-hidden','true');
    const list = document.createElement('div');
    list.className='wheel'; list.tabIndex=0;
    list.setAttribute('role','listbox');

    const padTop = document.createElement('div'); padTop.className='wheel-pad'; padTop.setAttribute('aria-hidden','true');
    const padBot = document.createElement('div'); padBot.className='wheel-pad'; padBot.setAttribute('aria-hidden','true');
    list.appendChild(padTop);

    const items=[];
    options.forEach((o,i)=>{
      const el=document.createElement('div');
      el.className='wheel-item'+(i===idx?' sel':'');
      el.textContent=o;
      el.id='wheel-'+i;
      el.setAttribute('role','option');
      el.setAttribute('aria-selected', i===idx?'true':'false');
      el.onclick=()=>select(i,true);
      list.appendChild(el);
      items.push(el);
    });
    list.appendChild(padBot);
    mask.appendChild(band);
    mask.appendChild(list);
    mount.appendChild(mask);

    const IH = () => (items[0] && items[0].offsetHeight) || 44;                        // 항목 1개 높이(측정)
    const posFor = i => padTop.offsetHeight + i*IH() + IH()/2 - list.clientHeight/2;   // i번을 중앙에 놓는 scrollTop
    const idxFromScroll = () => Math.round((list.scrollTop + list.clientHeight/2 - padTop.offsetHeight - IH()/2)/IH());
    let settleTimer=null, programmatic=false, ticking=false;

    function render(){
      const h=IH();
      const center=list.scrollTop + list.clientHeight/2;
      items.forEach((el,k)=>{
        const itemCenter=padTop.offsetHeight + k*h + h/2;
        const signed=(itemCenter-center)/h;                 // <0 위, >0 아래
        const dist=Math.abs(signed);
        const angle=Math.max(-72,Math.min(72, signed*30));
        const scale=Math.max(0.7, 1 - dist*0.10);
        const opacity=Math.max(0.22, 1 - dist*0.36);
        el.style.transform=`rotateX(${angle.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity=opacity.toFixed(3);
      });
    }
    function onScrollRender(){
      if(ticking) return; ticking=true;
      requestAnimationFrame(()=>{ render(); ticking=false; });
    }
    function paint(i){
      items.forEach((el,k)=>{
        const on=k===i;
        el.classList.toggle('sel',on);
        el.setAttribute('aria-selected', on?'true':'false');
      });
      list.setAttribute('aria-activedescendant', items[i].id);
    }
    function select(i, scroll){
      i=Math.max(0,Math.min(items.length-1,i));
      idx=i; selected=options[i];
      paint(i);
      if(typeof onChange==='function') onChange(selected, i);
      if(scroll){
        programmatic=true; list.scrollTo({top:posFor(i),behavior:'smooth'});
        setTimeout(()=>{programmatic=false;render();},320);
      }
    }

    function onScroll(){
      onScrollRender();
      if(programmatic) return;
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{
        const i=idxFromScroll();
        select(i,false);
        programmatic=true; list.scrollTo({top:posFor(i),behavior:'smooth'});
        setTimeout(()=>{programmatic=false;render();},320);
      },110);
    }
    function onKey(e){
      let handled=true;
      if(e.key==='ArrowDown'||e.key==='ArrowRight') select(idx+1,true);
      else if(e.key==='ArrowUp'||e.key==='ArrowLeft') select(idx-1,true);
      else if(e.key==='Home') select(0,true);
      else if(e.key==='End') select(items.length-1,true);
      else if(e.key==='PageDown') select(idx+3,true);
      else if(e.key==='PageUp') select(idx-3,true);
      else handled=false;
      if(handled) e.preventDefault();
    }
    list.addEventListener('scroll', onScroll);
    list.addEventListener('keydown', onKey);

    requestAnimationFrame(()=>{ list.scrollTop=posFor(idx); render(); });
    setTimeout(()=>list.focus({preventScroll:true}),140);

    return {
      get value(){ return selected; },
      get index(){ return idx; },
      select,
      relayout(){ list.scrollTop=posFor(idx); render(); },   // 팝업이 보일 때 재정렬용
      destroy(){ list.removeEventListener('scroll',onScroll); list.removeEventListener('keydown',onKey); mount.removeChild(mask); }
    };
  }
  w.createWheelPicker = createWheelPicker;   // 수동 호출도 가능하게 노출

  /* ---------- 자동 적용 ---------- */
  function parseOptions(el){
    var raw = (el.getAttribute('data-options') || '').trim();
    if(raw){
      if(raw.charAt(0)==='[' || raw.charAt(0)==='{'){
        try { var arr = JSON.parse(raw); if(Array.isArray(arr)) return arr.map(String); } catch(e){}
      }
      return raw.split(/\s*[,|]\s*/).filter(function(s){ return s !== ''; });
    }
    // 폴백: 자식 [data-option] 또는 <option>
    var kids = el.querySelectorAll('[data-option], option');
    if(kids.length) return Array.prototype.map.call(kids, function(k){ return (k.getAttribute('value') || k.textContent).trim(); });
    return [];
  }

  function applyTarget(sel, val){
    if(!sel) return;
    var t = d.querySelector(sel);
    if(!t) return;
    if('value' in t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) {
      t.value = val;
      t.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      t.textContent = val;
    }
  }

  function initOne(el){
    if(el.dataset.wheelReady === '1') return;
    var options = parseOptions(el);
    if(!options.length) return;                 // 옵션 없으면 스킵
    var value = el.getAttribute('data-value');
    if(value === null || value === '') value = options[0];

    el.dataset.wheelReady = '1';
    delete el.dataset.wheelPending;
    el.innerHTML = '';                          // 선언적 자식 제거 후 렌더

    var target = el.getAttribute('data-target');
    applyTarget(target, value);                 // 초기값 반영

    el._wheelPicker = createWheelPicker(el, options, value, function(val, i){
      el.setAttribute('data-value', val);
      applyTarget(target, val);
      el.dispatchEvent(new CustomEvent('wheel:change', { bubbles:true, detail:{ value:val, index:i } }));
    });
  }

  var io = w.IntersectionObserver ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ io.unobserve(e.target); initOne(e.target); }
    });
  }, { threshold: 0.01 }) : null;

  function schedule(el){
    if(!el || el.dataset.wheelReady === '1' || el.dataset.wheelPending === '1') return;
    var visible = el.offsetParent !== null && el.clientHeight > 0;
    if(visible || !io){ initOne(el); }         // 이미 보이면 즉시
    else { el.dataset.wheelPending = '1'; io.observe(el); }   // 숨겨져 있으면 보일 때
  }

  function scan(root){
    var list = (root || d).querySelectorAll('[data-wheel]');
    Array.prototype.forEach.call(list, schedule);
  }

  function ready(fn){
    if(d.readyState !== 'loading') fn();
    else d.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    scan(d);
    // 동적으로 추가되는 마운트(팝업 등) 감지
    if(w.MutationObserver){
      new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          var added = muts[i].addedNodes;
          for(var j=0;j<added.length;j++){
            var n = added[j];
            if(n.nodeType !== 1) continue;
            if(n.matches && n.matches('[data-wheel]')) schedule(n);
            if(n.querySelectorAll) scan(n);
          }
        }
      }).observe(d.body, { childList:true, subtree:true });
    }
  });

  // 수동 API (팝업 열 때 재스캔이 필요하면 HFWheel.scan() 호출)
  w.HFWheel = { scan: scan, init: initOne, create: createWheelPicker };

})(window, document);
