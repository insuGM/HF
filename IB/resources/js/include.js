// ko/html/js/include.js
async function includeHTML() {
    const elements = document.querySelectorAll('[data-include]');
    
    console.log(`[include.js] Found ${elements.length} elements with data-include`);
    
    for (const element of elements) {
        const file = element.getAttribute('data-include');
        console.log(`[include.js] Loading: ${file}`);
        
        try {
            const response = await fetch(file);
            if (response.ok) {
                const html = await response.text();
                console.log(`[include.js] Successfully loaded: ${file}`);
                
                // 임시 컨테이너에 HTML 삽입
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // 삽입된 HTML 내부의 스크립트 수집 및 제거
                const scripts = Array.from(tempDiv.querySelectorAll('script'));
                const scriptContents = scripts.map(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    newScript.textContent = oldScript.textContent;
                    oldScript.remove();
                    return newScript;
                });
                
                // 원본 element를 임시 컨테이너의 내용으로 교체
                const parent = element.parentNode;
                const nextSibling = element.nextSibling;
                
                // HTML 내용 삽입
                while (tempDiv.firstChild) {
                    parent.insertBefore(tempDiv.firstChild, nextSibling);
                }
                
                // 원본 div 제거
                parent.removeChild(element);
                
                // 스크립트 실행 (삽입된 위치 다음에)
                scriptContents.forEach(script => {
                    if (nextSibling) {
                        parent.insertBefore(script, nextSibling);
                    } else {
                        parent.appendChild(script);
                    }
                });
            } else {
                console.error(`[include.js] Failed to load ${file}: ${response.status} ${response.statusText}`);
                console.error(`[include.js] Requested URL: ${response.url || file}`);
            }
        } catch (error) {
            console.error(`[include.js] Error loading ${file}:`, error);
            console.error(`[include.js] Error details:`, error.message, error.stack);
        }
    }

    document.dispatchEvent(new CustomEvent('hf-include-done'));
    
    // include 완료 후 krds.js 초기화 재실행
    setTimeout(function() {
        // 윈도우 사이즈 체크
        if (typeof windowSize !== 'undefined' && typeof windowSize.setWinSize === 'function') {
            windowSize.setWinSize();
        }

        // krds.js의 모든 초기화 함수들을 다시 실행
        // 직접 변수명으로 접근 (const로 선언된 변수는 window에 자동 등록되지 않을 수 있음)
        const componentMap = {
            'krds_mainMenuPC': typeof krds_mainMenuPC !== 'undefined' ? krds_mainMenuPC : null,
            'krds_mainMenuMobile': typeof krds_mainMenuMobile !== 'undefined' ? krds_mainMenuMobile : null,
            'krds_sideNavigation': typeof krds_sideNavigation !== 'undefined' ? krds_sideNavigation : null,
            'krds_tab': typeof krds_tab !== 'undefined' ? krds_tab : null,
            'krds_accordion': typeof krds_accordion !== 'undefined' ? krds_accordion : null,
            'krds_modal': typeof krds_modal !== 'undefined' ? krds_modal : null,
            'krds_contextualHelp': typeof krds_contextualHelp !== 'undefined' ? krds_contextualHelp : null,
            'krds_tooltip': typeof krds_tooltip !== 'undefined' ? krds_tooltip : null,
            'krds_disclosure': typeof krds_disclosure !== 'undefined' ? krds_disclosure : null,
            'krds_dropEvent': typeof krds_dropEvent !== 'undefined' ? krds_dropEvent : null,
            'krds_calendar': typeof krds_calendar !== 'undefined' ? krds_calendar : null,
            'krds_inPageNavigation': typeof krds_inPageNavigation !== 'undefined' ? krds_inPageNavigation : null,
            'krds_adjustContentScale': typeof krds_adjustContentScale !== 'undefined' ? krds_adjustContentScale : null,
            'krds_toggleSwitch': typeof krds_toggleSwitch !== 'undefined' ? krds_toggleSwitch : null,
            'krds_infoList': typeof krds_infoList !== 'undefined' ? krds_infoList : null,
            'krds_chkBox': typeof krds_chkBox !== 'undefined' ? krds_chkBox : null,
            'krds_fileUpload': typeof krds_fileUpload !== 'undefined' ? krds_fileUpload : null,
            'krds_tts': typeof krds_tts !== 'undefined' ? krds_tts : null,
            'krds_helpPanel': typeof krds_helpPanel !== 'undefined' ? krds_helpPanel : null
        };

        Object.keys(componentMap).forEach(function(componentName) {
            const component = componentMap[componentName];
            if (component !== null && typeof component.init === 'function') {
                try {
                    component.init();
                } catch (e) {
                    console.error('Failed to reinitialize ' + componentName + ':', e);
                }
            }
        });

        // helpPanel이 있으면 PC일 때 열기
        if (typeof windowSize !== 'undefined' && typeof krds_helpPanel !== 'undefined') {
            if (windowSize.getWinSize() === 'pc' && typeof krds_helpPanel.toggleHelpPanel === 'function') {
                krds_helpPanel.toggleHelpPanel('open');
            }
        }

        // pattern.js의 initDisplaySettings도 실행
        if (typeof initDisplaySettings === 'function') {
            setTimeout(function() {
                initDisplaySettings();
            }, 100);
        }
    }, 300);
}

// DOM 로드 후 실행
(function() {
    console.log('[include.js] Script loaded, readyState:', document.readyState);
    
    function initInclude() {
        console.log('[include.js] Starting include process...');
        includeHTML().catch(function(error) {
            console.error('[include.js] Fatal error in includeHTML:', error);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInclude);
    } else {
        // DOM이 이미 로드된 경우 약간의 지연 후 실행 (다른 스크립트가 먼저 실행되도록)
        setTimeout(initInclude, 0);
    }
})();

(function () {
    setTimeout(function () {
        document.addEventListener('click', function (e) {
            // 1) 팝업 열기: data-pop="com_pop_cont{N}" → .com_pop_cont.type{N} active
            var btn = e.target.closest('[data-pop^="com_pop_cont"]');
            if (btn) {
                var num = btn.getAttribute('data-pop').replace('com_pop_cont', '');
                var target = document.querySelector('.com_pop_cont.type' + num);
                if (target) {
                    target.classList.add('active');
                    target._opener = btn;
                }
                return;
            }

            // 2) 팝업 닫기: .close / .end → 열었던 data-pop 요소로 포커스 복원
            var closer = e.target.closest('.com_pop_cont .close, .com_pop_cont .end');
            if (closer) {
                var pop = closer.closest('.com_pop_cont');
                if (pop) {
                    pop.classList.remove('active');
                    if (pop._opener) pop._opener.focus();
                }
                return;
            }

            // 3) App QR 스캔 방법 버튼 탭 (팝업 내부, 위임 방식이라 팝업 열린 뒤에도 동작)
            var scanBtn = e.target.closest('.scan-chk-list button');
            if (scanBtn) {
                var scope = scanBtn.closest('.pop_info_cont') || document;   // 같은 팝업 범위로 한정
                var targetId = scanBtn.getAttribute('data-target');

                scope.querySelectorAll('.scan-chk-list button').forEach(function (b) { b.classList.remove('on'); });
                scanBtn.classList.add('on');

                scope.querySelectorAll('.cont-box').forEach(function (box) {
                    box.classList.toggle('on', box.id === targetId);
                });
                return;
            }
        });
    }, 100);
})();



// 로그인 개인, 사업자 탭 버튼(버튼 클릭 시 통합인증 항목 클래스 제어) (추가 수정)
document.addEventListener('DOMContentLoaded', () => {
    const tabArea = document.querySelector('.tab-area.layer');
    if (!tabArea) return;

    const tabs = tabArea.querySelectorAll('li');
    const group01 = document.querySelector('.anyid-group01');
    const group02 = document.querySelector('.anyid-group02');
    const anyidInfo = document.querySelector('#anyidinfo');

    if (group01?.classList.contains('active')) {
        anyidInfo?.classList.add('type1');
        anyidInfo?.classList.remove('type2');
    }

    tabs.forEach((li, idx) => {
        li.querySelector('.btn-tab')?.addEventListener('click', e => {
            e.preventDefault();

            tabs.forEach(item => item.classList.remove('active'));
            li.classList.add('active');

            if (idx === 0) {
                group01?.classList.add('active');
                group02?.classList.remove('active');

                anyidInfo?.classList.add('type1');
                anyidInfo?.classList.remove('type2');

            } else if (idx === 1) {
                group01?.classList.remove('active');
                group02?.classList.add('active');

                anyidInfo?.classList.add('type2');
                anyidInfo?.classList.remove('type1');
            }
        });
    });
});

// 정부 통합로그인 사용/미사용 토글 스위치 (추가 수정)
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleSwitch');
    const textEl = document.querySelector('.form-switch .tool-txt span');

    if (!toggle || !textEl) return;

    textEl.textContent = toggle.checked ? '사용' : '미사용';
    toggle.addEventListener('change', () => {
        textEl.textContent = toggle.checked ? '사용' : '미사용';
    });
});



document.addEventListener('DOMContentLoaded', () => {
    const group01 = document.querySelector('.anyid-group01');
    const group02 = document.querySelector('.anyid-group02');

    const conts1 = document.querySelector('.hf-login-conts.conts1');
    const conts2 = document.querySelector('.hf-login-conts.conts2');

    document.querySelectorAll('.tab-area button').forEach(btn => {
        btn.addEventListener('click', () => {
            // 탭 클릭 후 anyid-group active 상태 기준으로 컨텐츠 동기화
            if (group01.classList.contains('active')) {
                conts1.classList.add('active');
                conts2.classList.remove('active');
            } else if (group02.classList.contains('active')) {
                conts2.classList.add('active');
                conts1.classList.remove('active');
            }
        });
    });
});

/* =====================================================================
 * HF 전세ON 공통 스크립트 (주택보증)
 * 1) 공통 모달 접근성 : com_pop_cont
 * 2) 검색 팝업 : com_pop_cont.srch_pop (영업점 검색 / 주소 검색)
 * ※ 가이드 팝업 아코디언은 KRDS krds_accordion 을 그대로 사용한다 (별도 JS 없음)
 * ===================================================================== */

/* ---------------------------------------------------------------
 * 1) 공통 모달 : role/dialog · ESC 닫기 · 포커스 트랩 · 포커스 복귀
 * --------------------------------------------------------------- */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var seq = 0;

  function focusables(pop) {
    return Array.prototype.filter.call(pop.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
  }

  function setup(pop) {
    if (pop.dataset.hfDialog === 'true') return;
    pop.dataset.hfDialog = 'true';

    var area = pop.querySelector('.pop_cont_area');
    if (!area) return;

    var titleEl = area.querySelector('.title_area .title');
    area.setAttribute('role', 'dialog');
    area.setAttribute('aria-modal', 'true');
    if (titleEl) {
      if (!titleEl.id) titleEl.id = 'hf-pop-title-' + (++seq);
      area.setAttribute('aria-labelledby', titleEl.id);
    }
    if (!area.hasAttribute('tabindex')) area.setAttribute('tabindex', '-1');

    var closeBtn = area.querySelector('.title_area .close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        window.hfDialog.close(pop);
      });
    }

    pop.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        window.hfDialog.close(pop);
        return;
      }
      if (e.key !== 'Tab') return;
      var list = focusables(area);
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  window.hfDialog = {
    open: function (target, opener) {
      var pop = typeof target === 'string' ? document.getElementById(target) : target;
      if (!pop) return;
      setup(pop);
      pop.hfOpener = opener || document.activeElement;
      pop.classList.add('active');
      document.body.style.overflow = 'hidden';
      var area = pop.querySelector('.pop_cont_area');
      var list = area ? focusables(area) : [];
      (list.length ? list[0] : area).focus();
    },
    close: function (target) {
      var pop = typeof target === 'string' ? document.getElementById(target) : target;
      if (!pop) return;
      pop.classList.remove('active');
      document.body.style.overflow = '';
      if (pop.hfOpener && typeof pop.hfOpener.focus === 'function') {
        pop.hfOpener.focus();
        pop.hfOpener = null;
      }
    }
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.com_pop_cont'), setup);
    // data-pop-open="팝업 id" 를 가진 버튼으로 팝업 열기
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-pop-open]') : null;
      if (!btn) return;
      e.preventDefault();
      window.hfDialog.open(btn.getAttribute('data-pop-open'), btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ---------------------------------------------------------------
 * 2) 검색 팝업 (영업점 검색 / 주소 검색)
 *    - 검색 전 / 검색 후 / 선택 / 결과 없음 상태를 제어한다.
 *    - 결과 항목은 마크업에 존재하는 목록을 키워드로 필터링한다.
 *    - .com_pop_cont.srch_pop 안에서만 동작한다.
 * --------------------------------------------------------------- */
(function () {
  'use strict';

  function txt(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function setup(pop) {
    if (pop.dataset.hfSearchInit === 'true') return;
    pop.dataset.hfSearchInit = 'true';

    var input = pop.querySelector('[data-search-input]');
    var searchBtn = pop.querySelector('[data-search-btn]');
    var resultBox = pop.querySelector('[data-search-result]');
    var countEl = pop.querySelector('[data-search-count]');
    var listEl = pop.querySelector('[data-search-list]');
    var emptyEl = pop.querySelector('[data-search-empty]');
    var detailEl = pop.querySelector('[data-search-detail]');
    var submitBtn = pop.querySelector('[data-search-submit]');
    if (!input || !resultBox || !listEl) return;

    var items = Array.prototype.slice.call(listEl.children);

    function updateSubmit() {
      if (!submitBtn) return;
      var checked = listEl.querySelector('input[type="radio"]:checked');
      submitBtn.disabled = !checked;
      if (detailEl) detailEl.hidden = !checked;
    }

    function reset() {
      items.forEach(function (li) {
        li.hidden = false;
        var r = li.querySelector('input[type="radio"]');
        if (r) r.checked = false;
      });
      resultBox.hidden = true;
      if (emptyEl) emptyEl.hidden = true;
      if (detailEl) detailEl.hidden = true;
      if (submitBtn) submitBtn.disabled = true;
    }

    function search() {
      var key = input.value.replace(/\s+/g, '').toLowerCase();
      if (!key) {
        reset();
        input.focus();
        return;
      }
      var hit = 0;
      items.forEach(function (li) {
        var match = txt(li).replace(/\s+/g, '').toLowerCase().indexOf(key) > -1;
        li.hidden = !match;
        var r = li.querySelector('input[type="radio"]');
        if (r) r.checked = false;
        if (match) hit++;
      });
      resultBox.hidden = false;
      if (countEl) countEl.textContent = hit + '건';
      listEl.hidden = hit === 0;
      if (emptyEl) emptyEl.hidden = hit !== 0;
      if (detailEl) detailEl.hidden = true;
      if (submitBtn) submitBtn.disabled = true;
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', search);
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        search();
      }
    });
    listEl.addEventListener('change', updateSubmit);

    reset();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.com_pop_cont.srch_pop'), setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function () {
	'use strict';

	var WORRY = [
		{ value: '전혀 없음(0.0)',   headline: '올라도 상관없어요! 무조건 최저금리😎' },
		{ value: '거의 없음(0.1)',   headline: '약간을 올라도 낮은 금리가 훨씬 좋아요😃' },
		{ value: '조금 있음(0.2)',   headline: '웬만큼 오르지 않는다면 변동이 유리하죠🤓' },
		{ value: '미미함(0.3)',      headline: '금리 변동을 지켜볼 여유가 있어요👀' },
		{ value: '보통(0.4)',        headline: '아주 많이 오르지 않는다면 괜찮아요👌' },
		{ value: '중간(0.5)',        headline: '오를까봐 슬슬 신경 쓰이기 시작해요💦' },
		{ value: '신경 쓰임(0.6)',   headline: '오르면 생활비가 줄어들까봐 걱정 돼요🤔' },
		{ value: '꽤 걱정됨(0.7)',   headline: '지출이 변하는게 싫어서 고정이 끌려요💰' },
		{ value: '많이 걱정됨(0.8)', headline: '이자가 조금 더 비싸도 마음 편하게 최고😇' },
		{ value: '매우 걱정됨(0.9)', headline: '뉴스를 보며 매일 불안해하고 싶지 않아요🫨' },
		{ value: '최고조(1.0)',      headline: '단 1원도 안 오르는 절대 안전이 필요해요❗️' }
	];

	function initWorry(card) {
		var range = card.querySelector('input[type=range]');
		var head = card.querySelector('.head');
		var elValue = card.querySelector('[data-worry-value]');
		var elHead = card.querySelector('[data-worry-headline]');
		if (!range || !elValue || !elHead) return;

		var last = -1;
		var fadeTimer = null;

		function paint(step, animate) {
			var d = WORRY[step];
			card.style.setProperty('--worry', (step / 10).toFixed(2));
			range.setAttribute('aria-valuetext', d.value + ' ' + d.headline);
			if (step === last) return;
			last = step;
			if (!animate || !head) {
				elValue.textContent = d.value;
				elHead.textContent = d.headline;
				return;
			}
			head.classList.add('is-fade');
			window.clearTimeout(fadeTimer);
			fadeTimer = window.setTimeout(function () {
				elValue.textContent = d.value;
				elHead.textContent = d.headline;
				head.classList.remove('is-fade');
			}, 120);
		}

		function currentStep() {
			return Math.round(parseFloat(range.value) * 10);
		}

		range.addEventListener('input', function () { paint(currentStep(), true); });
		range.addEventListener('change', function () { paint(currentStep(), true); });
		paint(currentStep(), false);
	}

	function initPriority(cont) {
		var boxes = [].slice.call(cont.querySelectorAll('.pri_chip input[type=checkbox]'));
		if (!boxes.length) return;
		var order = [];

		boxes.forEach(function (b) {
			if (b.checked) order.push(b);
		});

		function render() {
			boxes.forEach(function (b) {
				var label = cont.querySelector('label[for="' + b.id + '"]');
				if (!label) return;
				var badge = label.querySelector('.badge');
				var sr = label.querySelector('.sr-only');
				var idx = order.indexOf(b);
				if (badge) badge.textContent = idx > -1 ? String(idx + 1) : '';
				if (sr) sr.textContent = idx > -1 ? (idx + 1) + '순위 선택됨' : '';
			});
		}

		boxes.forEach(function (b) {
			b.addEventListener('change', function () {
				var i = order.indexOf(b);
				if (b.checked) {
					if (i === -1) order.push(b);
				} else if (i > -1) {
					order.splice(i, 1);
				}
				render();
			});
		});

		var reset = document.querySelector('[data-pri-reset]');
		if (reset) {
			reset.addEventListener('click', function () {
				boxes.forEach(function (b) { b.checked = false; });
				order = [];
				render();
				if (boxes[0]) boxes[0].focus();
			});
		}
		render();
	}

	function initChkReset() {
		var btn = document.querySelector('[data-chk-reset]');
		if (!btn) return;
		btn.addEventListener('click', function () {
			var scope = btn.closest('li') || document;
			var inputs = scope.querySelectorAll('input[type=checkbox], input[type=radio]');
			[].forEach.call(inputs, function (i) { i.checked = false; });
			if (inputs[0]) inputs[0].focus();
		});
	}

	function initTextareaCount() {
		var wraps = document.querySelectorAll('.textarea-wrap');
		[].forEach.call(wraps, function (wrap) {
			var ta = wrap.querySelector('textarea');
			var now = wrap.querySelector('.count-now');
			if (!ta || !now) return;
			var sync = function () { now.textContent = String(ta.value.length); };
			ta.addEventListener('input', sync);
			sync();
		});
	}

	function init() {
		var card = document.querySelector('.worry_card');
		if (card) initWorry(card);
		var pri = document.querySelector('.hf_priority_cont');
		if (pri) initPriority(pri);
		initChkReset();
		initTextareaCount();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

(function () {
	'use strict';

	function num(v) {
		var n = Number(v);
		return isFinite(n) ? n : 0;
	}

	function draw(chart) {
		var max = num(chart.getAttribute('data-max')) || 100;
		var bars = [].slice.call(chart.querySelectorAll('.bar'));
		bars.forEach(function (bar) {
			var segs = [].slice.call(bar.querySelectorAll('.bar_segment'));
			var total = 0;
			segs.forEach(function (seg) {
				var v = num(seg.getAttribute('data-value'));
				total += v;
				seg.style.height = (v / max * 100).toFixed(4) + '%';
			});
			bar.style.setProperty('--total-pct', (total / max * 100).toFixed(4));
		});
	}

	function init() {
		var charts = document.querySelectorAll('.hf_chart_cont[data-chart]');
		[].forEach.call(charts, draw);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

// ===== 신규 추가 =====
// 공통 : .hf_table_cont.income_tbl 안의 table에 tbody가 없으면 no-td 클래스 부여 (행이 동적으로 추가/삭제되는 표에도 자동 대응)
(function () {
  function update() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".hf_table_cont.income_tbl"),
      function (cont) {
        var hasTbody = !!cont.querySelector("table tbody");
        cont.classList.toggle("no-td", !hasTbody);
      },
    );
  }

  function init() {
    update();
    new MutationObserver(update).observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
// ===== 여기까지 추가된 코드 끝 =====

(function () {
    'use strict';

    function showActiveTab(tab) {
        var ul = tab.querySelector('ul');
        var active = ul && ul.querySelector('li.active');
        if (!ul || !active) return;

        var view = ul.clientWidth;
        if (ul.scrollWidth <= view) return;

        var base = ul.getBoundingClientRect().left - ul.scrollLeft;
        var rect = active.getBoundingClientRect();
        var start = rect.left - base;
        var end = rect.right - base;

        if (end > ul.scrollLeft + view) ul.scrollLeft = end - view;
        else if (start < ul.scrollLeft) ul.scrollLeft = start;
    }

    function initTabSlideActive() {
        var tabs = document.querySelectorAll('.tab.tab_slide');
        if (!tabs.length) return;
        Array.prototype.forEach.call(tabs, showActiveTab);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTabSlideActive);
    } else {
        initTabSlideActive();
    }
    document.addEventListener('hf-include-done', function () {
        setTimeout(initTabSlideActive, 0);
    });
    window.addEventListener('load', initTabSlideActive);
})();

/* ============================================================================
 * 10주택연금_07가입통계 — 지도 / 도넛 차트 / 선 그래프
 *
 *  A. 지도   : 시도 선택 ↔ 셀렉트 ↔ 통계 4값 양방향 연동
 *              인라인 SVG(<path data-region>) 와 이미지 오버레이(<img data-region>) 둘 다 지원
 *  B. 도넛   : 범례(.hfp-legend__row[data-color]) 를 읽어 SVG 도넛을 그린다
 *  C. 선그래프 : HFP_TREND 를 읽어 SVG 선 그래프를 그린다. 기간 칩(5년/10년/전체)으로 교체
 *
 *  ※ 통계·추이 값은 화면 확인용 샘플이다. 실제 연동 시 서버 응답(JSON)으로 교체한다.
 * ========================================================================== */
(function () {
	'use strict';

	var SVGNS = 'http://www.w3.org/2000/svg';

	function svg(name, attrs, text) {
		var node = document.createElementNS(SVGNS, name);
		for (var k in attrs) {
			if (attrs.hasOwnProperty(k) && attrs[k] !== null && attrs[k] !== undefined) {
				node.setAttribute(k, attrs[k]);
			}
		}
		if (text !== undefined && text !== null) node.textContent = text;
		return node;
	}
	function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

	/* ========================================================================
	 * 데이터
	 * ====================================================================== */

	/* 지역별 통계.
	 * ※ 전국·서울은 Figma 실측값, 나머지 15개 시도는 화면 확인용 샘플이다. */
	var HFP_STAT = {
		all:       { name: '전국', count: '148,888', rate: '100.0', age: '72', pay: '127', price: '396' },
		seoul:     { name: '서울', count: '39,514',  rate: '26.5',  age: '72', pay: '171', price: '570' },
		gyeonggi:  { name: '경기', count: '41,062',  rate: '27.6',  age: '72', pay: '132', price: '412' },
		incheon:   { name: '인천', count: '9,231',   rate: '6.2',   age: '72', pay: '113', price: '332' },
		busan:     { name: '부산', count: '9,829',   rate: '6.6',   age: '73', pay: '104', price: '298' },
		daegu:     { name: '대구', count: '6,401',   rate: '4.3',   age: '73', pay: '101', price: '289' },
		gwangju:   { name: '광주', count: '3,873',   rate: '2.6',   age: '72', pay: '96',  price: '271' },
		daejeon:   { name: '대전', count: '3,724',   rate: '2.5',   age: '72', pay: '99',  price: '284' },
		ulsan:     { name: '울산', count: '2,085',   rate: '1.4',   age: '72', pay: '107', price: '305' },
		sejong:    { name: '세종', count: '744',     rate: '0.5',   age: '71', pay: '118', price: '349' },
		gangwon:   { name: '강원', count: '3,127',   rate: '2.1',   age: '73', pay: '88',  price: '241' },
		chungbuk:  { name: '충북', count: '3,276',   rate: '2.2',   age: '73', pay: '87',  price: '238' },
		chungnam:  { name: '충남', count: '4,466',   rate: '3.0',   age: '73', pay: '89',  price: '246' },
		jeonbuk:   { name: '전북', count: '3,574',   rate: '2.4',   age: '73', pay: '84',  price: '229' },
		jeonnam:   { name: '전남', count: '2,978',   rate: '2.0',   age: '74', pay: '82',  price: '221' },
		gyeongbuk: { name: '경북', count: '5,062',   rate: '3.4',   age: '73', pay: '86',  price: '234' },
		gyeongnam: { name: '경남', count: '7,444',   rate: '5.0',   age: '73', pay: '93',  price: '262' },
		jeju:      { name: '제주', count: '1,498',   rate: '1.0',   age: '72', pay: '110', price: '318' }
	};

	/* 연간 누적 가입자수(최초가입 시점 기준).
	 * ※ 화면 확인용 샘플이다. 마지막 값만 HFP_STAT.all.count(148,888) 와 맞춰 두었다. */
	var HFP_TREND_ALL = [
		[2007,   5000], [2008,   9000], [2009,  13500], [2010,  18500], [2011,  24500],
		[2012,  29700], [2013,  35000], [2014,  40100], [2015,  46400], [2016,  56300],
		[2017,  66400], [2018,  76300], [2019,  87200], [2020,  97400], [2021, 108200],
		[2022, 122800], [2023, 137400], [2024, 143800], [2025, 148888]
	];
	var HFP_TREND = {
		'5':   HFP_TREND_ALL.slice(-5),
		'10':  HFP_TREND_ALL.slice(-10),
		'all': HFP_TREND_ALL
	};

	/* ========================================================================
	 * A. 지도
	 * ====================================================================== */
	function initMap() {
		var map = document.getElementById('hfpMap');
		if (!map) return;
		if (map.dataset.hfpBound === 'true') return;
		map.dataset.hfpBound = 'true';

		var labels = Array.prototype.slice.call(map.querySelectorAll('.hfp-map__label'));
		/* 인라인 SVG path 와 이미지 오버레이를 함께 모은다 */
		var areas = Array.prototype.slice.call(map.querySelectorAll('[data-region].hfp-map__area, [data-region].hfp-map__shape'));
		var shapes = Array.prototype.slice.call(map.querySelectorAll('.hfp-map__shape[data-region]'));
		var selectBox = document.getElementById('hfpRegionSelect');
		var statArea = document.getElementById('hfpStatArea');
		if (!labels.length && !shapes.length) return;

		var current = map.getAttribute('data-selected') || 'all';

		function each(key, fn) {
			for (var i = 0; i < areas.length; i++) {
				if (areas[i].getAttribute('data-region') === key) fn(areas[i]);
			}
		}

		/* ── 호버 : 지역 모양만 미리보기. 데이터·선택은 바뀌지 않는다 ────────── */
		function hover(key, on) {
			each(key, function (elm) {
				if (on) elm.classList.add('is-hover');
				else elm.classList.remove('is-hover');
			});
			for (var j = 0; j < labels.length; j++) {
				if (labels[j].getAttribute('data-region') === key) {
					labels[j].classList.toggle('is-hover', !!on);
				}
			}
		}

		/* ── 통계 값 교체 ────────────────────────────────────────────────── */
		function paint(key) {
			var d = HFP_STAT[key] || HFP_STAT.all;
			if (!statArea) return;
			statArea.classList.add('is-swap');
			window.setTimeout(function () {
				var fields = ['count', 'rate', 'age', 'pay', 'price'];
				for (var i = 0; i < fields.length; i++) {
					var node = statArea.querySelector('[data-stat="' + fields[i] + '"]');
					if (!node) continue;
					node.textContent = (fields[i] === 'rate') ? '(' + d.rate + '%)' : d[fields[i]];
				}
				statArea.classList.remove('is-swap');
			}, 200);
		}

		/* ── 선택 ────────────────────────────────────────────────────────
		 * 선택한 지역만 채워지고 말풍선이 뜬다.
		 * 나머지 지역 라벨은 그대로 남아 있어야 바로 다른 지역을 고를 수 있다. */
		function select(key, opts) {
			opts = opts || {};
			if (!HFP_STAT[key]) key = 'all';
			current = key;
			map.setAttribute('data-selected', key);
			map.classList.toggle('is-selected', key !== 'all');

			for (var i = 0; i < areas.length; i++) {
				areas[i].classList.remove('is-hover');
				areas[i].classList.toggle('is-on', areas[i].getAttribute('data-region') === key);
			}
			for (var j = 0; j < labels.length; j++) {
				var isOn = labels[j].getAttribute('data-region') === key;
				labels[j].classList.remove('is-hover');
				labels[j].classList.toggle('is-on', isOn);
				labels[j].setAttribute('aria-pressed', isOn ? 'true' : 'false');
				labels[j].setAttribute('tabindex', isOn ? '0' : '-1');
			}
			/* 전국(개별 선택 없음)일 때는 첫 라벨을 탭 진입점으로 둔다 */
			if (key === 'all' && labels.length) labels[0].setAttribute('tabindex', '0');

			if (!opts.fromSelect) syncSelect(key);
			paint(key);
		}

		/* ── 셀렉트 동기화 (프로젝트 krds_select_box 구조) ────────────────── */
		function syncSelect(key) {
			if (!selectBox) return;
			var d = HFP_STAT[key] || HFP_STAT.all;
			var titBtn = selectBox.querySelector('.select_tit > button');
			if (titBtn) titBtn.textContent = d.name;
			var opts = selectBox.querySelectorAll('.select_list button');
			for (var i = 0; i < opts.length; i++) {
				var hit = opts[i].value === key;
				opts[i].classList.toggle('selected', hit);
				if (opts[i].hasAttribute('role')) opts[i].setAttribute('aria-selected', hit ? 'true' : 'false');
			}
		}

		/* ── 라벨 이벤트 ─────────────────────────────────────────────────── */
		labels.forEach(function (btn) {
			var key = btn.getAttribute('data-region');
			btn.addEventListener('mouseenter', function () { hover(key, true); });
			btn.addEventListener('mouseleave', function () { hover(key, false); });
			btn.addEventListener('focus', function () { hover(key, true); });
			btn.addEventListener('blur', function () { hover(key, false); });
			btn.addEventListener('click', function () { select(key); btn.focus(); });
		});

		/* ── 지도 모양(인라인 SVG) 직접 클릭 ─────────────────────────────── */
		shapes.forEach(function (shape) {
			var key = shape.getAttribute('data-region');
			shape.addEventListener('mouseenter', function () { hover(key, true); });
			shape.addEventListener('mouseleave', function () { hover(key, false); });
			shape.addEventListener('click', function () {
				select(key);
				var lb = null;
				for (var i = 0; i < labels.length; i++) {
					if (labels[i].getAttribute('data-region') === key) lb = labels[i];
				}
				if (lb) lb.focus();
			});
		});

		/* 방향키 이동 (roving tabindex) */
		map.addEventListener('keydown', function (e) {
			var idx = labels.indexOf(document.activeElement);
			if (idx === -1) return;
			var next = -1;
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % labels.length;
			else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + labels.length) % labels.length;
			else if (e.key === 'Home') next = 0;
			else if (e.key === 'End') next = labels.length - 1;
			if (next === -1) return;
			e.preventDefault();
			for (var t = 0; t < labels.length; t++) labels[t].setAttribute('tabindex', '-1');
			labels[next].setAttribute('tabindex', '0');
			labels[next].focus();
		});

		/* ── 셀렉트 → 지도 ───────────────────────────────────────────────── */
		if (selectBox) {
			selectBox.addEventListener('click', function (e) {
				var btn = e.target.closest ? e.target.closest('.select_list button') : null;
				if (!btn) return;
				select(btn.value || 'all', { fromSelect: true });
				syncSelect(btn.value || 'all');
			});
		}

		/* 조회하기 버튼 — 현재 셀렉트 값으로 다시 그린다 */
		var searchBtn = document.getElementById('hfpSearchBtn');
		if (searchBtn) {
			searchBtn.addEventListener('click', function () { select(current); });
		}

		/* 마크업에 이미 들어 있는 정적 상태(선택/호버 화면)는 그대로 둔다.
		 * 첫 조작 시점부터 JS 가 상태를 관리한다. */
	}

	/* ========================================================================
	 * B. 도넛 차트
	 *    범례(.hfp-legend__list > .hfp-legend__row[data-color]) 가 원본 데이터다.
	 *    JS 가 스와치 색을 칠하고 같은 값으로 SVG 도넛을 그린다.
	 * ====================================================================== */
	var DONUT = { size: 120, cx: 60, cy: 60, r: 52, w: 16 };

	function readLegend(chart) {
		var rows = chart.querySelectorAll('.hfp-legend__list:not(.hfp-legend__list--sub) > .hfp-legend__row');
		var out = [];
		for (var i = 0; i < rows.length; i++) {
			var nameNode = rows[i].querySelector('.hfp-legend__name');
			var valNode = rows[i].querySelector('.hfp-legend__val');
			if (!nameNode || !valNode) continue;
			var pct = parseFloat(String(valNode.textContent).replace(/[^0-9.]/g, ''));
			if (isNaN(pct)) continue;
			out.push({
				row: rows[i],
				name: String(nameNode.textContent).trim(),
				pct: pct,
				color: rows[i].getAttribute('data-color') || '#E2E5E8'
			});
		}
		return out;
	}

	function drawDonut(chart) {
		var figure = chart.querySelector('.hfp-chart__figure');
		if (!figure) return;
		var items = readLegend(chart);
		if (!items.length) return;

		var title = chart.getAttribute('data-hfp-donut') || '';
		var titleId = figure.getAttribute('data-title-id');
		if (!titleId) {
			titleId = 'hfpDonutTitle' + (drawDonut.seq = (drawDonut.seq || 0) + 1);
			figure.setAttribute('data-title-id', titleId);
		}

		var C = 2 * Math.PI * DONUT.r;
		var root = svg('svg', {
			'class': 'hfp-donut',
			viewBox: '0 0 ' + DONUT.size + ' ' + DONUT.size,
			role: 'img',
			'aria-labelledby': titleId
		});
		root.appendChild(svg('title', { id: titleId }, title));

		var acc = 0;
		items.forEach(function (it, i) {
			var len = C * it.pct / 100;
			var seg = svg('circle', {
				'class': 'hfp-donut__seg',
				cx: DONUT.cx, cy: DONUT.cy, r: DONUT.r,
				fill: 'none',
				stroke: it.color,
				'stroke-width': DONUT.w,
				'stroke-dasharray': len.toFixed(3) + ' ' + (C - len).toFixed(3),
				'stroke-dashoffset': (-acc).toFixed(3),
				transform: 'rotate(-90 ' + DONUT.cx + ' ' + DONUT.cy + ')',
				'data-idx': i
			});
			seg.appendChild(svg('title', null, it.name + ' ' + it.pct + '%'));
			root.appendChild(seg);
			acc += len;

			/* 스와치 색은 범례 data-color 로 칠한다 (인라인 style 대신) */
			var sw = it.row.querySelector('.hfp-legend__swatch');
			if (sw) sw.style.backgroundColor = it.color;
			it.row.setAttribute('data-idx', i);
		});

		figure.innerHTML = '';
		figure.appendChild(root);

		/* 범례 ↔ 조각 하이라이트 */
		function focusIdx(idx) {
			var on = (idx !== null && idx !== undefined);
			chart.classList.toggle('is-focus', on);
			var segs = root.querySelectorAll('.hfp-donut__seg');
			for (var i = 0; i < segs.length; i++) {
				segs[i].classList.toggle('is-active', on && String(idx) === segs[i].getAttribute('data-idx'));
			}
			items.forEach(function (it) {
				it.row.classList.toggle('is-active', on && String(idx) === it.row.getAttribute('data-idx'));
			});
		}
		items.forEach(function (it) {
			it.row.addEventListener('mouseenter', function () { focusIdx(it.row.getAttribute('data-idx')); });
			it.row.addEventListener('mouseleave', function () { focusIdx(null); });
		});
		var segs = root.querySelectorAll('.hfp-donut__seg');
		for (var s = 0; s < segs.length; s++) {
			(function (seg) {
				seg.addEventListener('mouseenter', function () { focusIdx(seg.getAttribute('data-idx')); });
				seg.addEventListener('mouseleave', function () { focusIdx(null); });
			})(segs[s]);
		}
	}

	function initDonuts() {
		var list = document.querySelectorAll('[data-hfp-donut]');
		for (var i = 0; i < list.length; i++) {
			if (list[i].dataset.hfpBound === 'true') continue;
			list[i].dataset.hfpBound = 'true';
			drawDonut(list[i]);
		}
	}

	/* ========================================================================
	 * C. 선 그래프
	 *    Figma 플롯 : viewBox 1136×310 / 가로선 7줄(45px 간격) / y축 라벨 x=66 / x축 라벨 y=296
	 *    맨 아래 줄은 0, 그 위 6줄이 floor ~ top (Figma 와 동일한 생략 축)
	 * ====================================================================== */
	/* Figma 플롯 geometry 는 그대로 두고, viewBox 위쪽에 10 만큼 여백을 둬
	 * 맨 윗줄 y축 라벨(y=4, 13px)이 잘리지 않게 한다. 플롯 높이는 32rem. */
	var LINE = { w: 1136, h: 310, top: -10, x0: 72, rows: 6, gap: 45, yLabelX: 66, xLabelY: 296, r: 6 };

	function niceSteps(seed) {
		var steps = [];
		for (var e = -2; e <= 9; e++) {
			var p = Math.pow(10, e);
			steps.push(1 * p); steps.push(2 * p); steps.push(2.5 * p); steps.push(5 * p);
		}
		steps.sort(function (a, b) { return a - b; });
		return steps;
	}

	/* 아래에서 두 번째 줄(floor) 과 눈금 간격(step) 을 고른다 */
	function scaleOf(values) {
		var lo = Math.min.apply(null, values);
		var hi = Math.max.apply(null, values);
		var steps = niceSteps();
		var i, step, floor;
		for (i = 0; i < steps.length; i++) {
			step = steps[i];
			floor = Math.floor(lo / step) * step;
			if (floor > 0 && floor + (LINE.rows - 1) * step >= hi) {
				return { floor: floor, step: step, zeroBreak: true };
			}
			if (floor <= 0 && LINE.rows * step >= hi) {
				return { floor: 0, step: step, zeroBreak: false };
			}
		}
		step = steps[steps.length - 1];
		return { floor: 0, step: step, zeroBreak: false };
	}

	function yOf(v, sc) {
		var bottom = LINE.rows * LINE.gap;           /* 270 */
		var y;
		if (!sc.zeroBreak) {
			y = bottom - (v / sc.step) * LINE.gap;
		} else if (v <= sc.floor) {
			y = bottom - (sc.floor ? (v / sc.floor) * LINE.gap : 0);
		} else {
			y = (bottom - LINE.gap) - ((v - sc.floor) / sc.step) * LINE.gap;  /* 225 = floor 위치 */
		}
		if (y > bottom) y = bottom;
		return y;
	}

	function drawLine(wrap, term) {
		var plot = wrap.querySelector('.hfp-linechart__plot');
		if (!plot) return;
		var data = HFP_TREND[term] || HFP_TREND['5'];
		var values = data.map(function (d) { return d[1]; });
		var sc = scaleOf(values);

		var root = svg('svg', {
			viewBox: '0 ' + LINE.top + ' ' + LINE.w + ' ' + (LINE.h - LINE.top),
			role: 'img',
			'aria-labelledby': 'hfpLineTitle',
			preserveAspectRatio: 'none'
		});
		root.appendChild(svg('title', { id: 'hfpLineTitle' },
			'연간 누적 가입자수 추이 선 그래프 (' + data[0][0] + '년~' + data[data.length - 1][0] + '년)'));

		/* 가로 눈금선 + y축 라벨 */
		var row, y, label;
		for (row = 0; row <= LINE.rows; row++) {
			y = row * LINE.gap;
			root.appendChild(svg('line', { 'class': 'hfp-line__grid', x1: LINE.x0, y1: y, x2: LINE.w, y2: y }));
			if (row === LINE.rows) label = '0';
			else if (sc.zeroBreak) label = comma(sc.floor + (LINE.rows - 1 - row) * sc.step);
			else label = comma((LINE.rows - row) * sc.step);
			root.appendChild(svg('text', {
				'class': 'hfp-line__ytick', x: LINE.yLabelX, y: y + 4, 'text-anchor': 'end'
			}, label));
		}

		/* x 좌표 : 플롯을 n등분한 각 구간의 가운데 */
		var n = data.length;
		var band = (LINE.w - LINE.x0) / n;
		var pts = data.map(function (d, i) {
			return { year: d[0], val: d[1], x: LINE.x0 + band * (i + 0.5), y: yOf(d[1], sc) };
		});

		root.appendChild(svg('polyline', {
			'class': 'hfp-line__path',
			points: pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ')
		}));

		/* x축 라벨은 최대 7개까지만 (겹침 방지). 마지막 값은 항상 표시 */
		var stride = Math.ceil(n / 7);
		pts.forEach(function (p, i) {
			var mk = svg('circle', {
				'class': 'hfp-line__marker', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: LINE.r
			});
			mk.appendChild(svg('title', null, p.year + '년 ' + comma(p.val) + '명'));
			root.appendChild(mk);

			if (i % stride === 0 || i === n - 1) {
				root.appendChild(svg('text', {
					'class': 'hfp-line__xtick', x: p.x.toFixed(1), y: LINE.xLabelY, 'text-anchor': 'middle'
				}, p.year + '년'));
			}
		});

		plot.innerHTML = '';
		plot.appendChild(root);

		/* 스크린리더용 값 목록 (색·좌표만으로 정보를 전달하지 않는다) */
		var sr = wrap.querySelector('.hfp-linechart__sr');
		if (sr) {
			sr.textContent = data.map(function (d) { return d[0] + '년 ' + comma(d[1]) + '명'; }).join(', ');
		}
	}

	function initLines() {
		var list = document.querySelectorAll('.hfp-linechart');
		for (var i = 0; i < list.length; i++) {
			(function (wrap) {
				if (wrap.dataset.hfpBound === 'true') return;
				wrap.dataset.hfpBound = 'true';

				function currentTerm() {
					var checked = wrap.querySelector('input[name="hfpTerm"]:checked');
					return (checked && checked.getAttribute('data-term')) || '5';
				}
				wrap.addEventListener('change', function (e) {
					if (!e.target || e.target.name !== 'hfpTerm') return;
					drawLine(wrap, currentTerm());
				});
				drawLine(wrap, currentTerm());
			})(list[i]);
		}
	}

	/* ======================================================================== */
	function init() {
		initMap();
		initDonuts();
		initLines();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
	document.addEventListener('hf-include-done', function () { window.setTimeout(init, 0); });
})();
