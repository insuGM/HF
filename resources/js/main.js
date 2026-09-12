(function ($) {
	'use strict';

	var SEL = {
		visual: '.hf_main_visual_slide',
		recommend: '.hf_main_recommend_slide',
		tab: '.hf_main_recommend_tab_area'
	};

	function lockHorizontal() {
		var root = document.documentElement;
		var body = document.body;
		if (!root || !body) return;
		root.classList.add('is-main-lock');
		body.classList.add('is-main-lock');
	}

	function buildDots($slider, host) {
		if (!host) return;
		$slider.on('init reInit afterChange', function (e, sl, cur) {
			var total = sl.slideCount;
			var idx = (typeof cur === 'number') ? cur : (sl.currentSlide || 0);
			var html = '';
			for (var i = 0; i < total; i++) {
				html += '<li class="' + (i === idx ? 'on' : '') + '"><button type="button">' + (i + 1) + '번째 배너</button></li>';
			}
			$(host).html(html);
		});
	}

	function initVisual() {
		var $el = $(SEL.visual);
		if (!$el.length || $el.hasClass('slick-initialized')) return;
		var $dots = $el.closest('.hf_main_visual').find('.hf_main_visual_dot_area > ul.list');

		buildDots($el, $dots.get(0));

		$el.slick({
			infinite: true,
			autoplay: true,
			autoplaySpeed: 4000,
			speed: 400,
			slidesToShow: 1,
			slidesToScroll: 1,
			arrows: false,
			dots: false,
			draggable: true,
			swipeToSlide: true,
			touchThreshold: 12,
			waitForAnimate: false,
			accessibility: true
		});

		$dots.on('click', 'button', function () {
			$el.slick('slickGoTo', $(this).parent().index());
		});
	}

	function initRecommend() {
		$(SEL.recommend).each(function () {
			var $el = $(this);
			if ($el.hasClass('slick-initialized')) return;
			$el.slick({
				infinite: false,
				autoplay: false,
				speed: 350,
				slidesToShow: 1,
				slidesToScroll: 1,
				variableWidth: true,
				arrows: false,
				dots: false,
				draggable: true,
				swipeToSlide: true,
				touchThreshold: 12,
				waitForAnimate: false,
				accessibility: true
			});
		});
	}

	function activateTab($area, $btn) {
		var key = $btn.attr('data-tab');
		$area.find('ul.list > li').removeClass('on');
		$area.find('button[role="tab"]').attr('aria-selected', 'false').attr('tabindex', '-1');
		$btn.closest('li').addClass('on');
		$btn.attr('aria-selected', 'true').attr('tabindex', '0');
		var $wrap = $area.closest('.hf_main_recommend');
		$wrap.find('.hf_main_recommend_slide').each(function () {
			var $sl = $(this);
			var hit = ($sl.attr('data-tab') === key);
			$sl.toggleClass('on', hit);
			if (hit && $sl.hasClass('slick-initialized')) {
				$sl.slick('setPosition');
			}
		});
	}

	function initTab() {
		$(SEL.tab).each(function () {
			var $area = $(this);
			if ($area.data('hfBound')) return;
			$area.data('hfBound', true);
			$area.on('click', 'button[role="tab"]', function () {
				activateTab($area, $(this));
			});
			$area.on('keydown', 'button[role="tab"]', function (e) {
				var $tabs = $area.find('button[role="tab"]');
				var idx = $tabs.index(this);
				var next = -1;
				if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % $tabs.length;
				else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + $tabs.length) % $tabs.length;
				else if (e.key === 'Home') next = 0;
				else if (e.key === 'End') next = $tabs.length - 1;
				if (next < 0) return;
				e.preventDefault();
				var $t = $tabs.eq(next);
				activateTab($area, $t);
				$t.focus();
			});
		});
	}

	function refresh() {
		$('.slick-initialized').each(function () {
			$(this).slick('setPosition');
		});
	}

	function init() {
		if (!$.fn.slick) return;
		lockHorizontal();
		initVisual();
		initRecommend();
		initTab();
	}

	$(function () {
		init();
		$(window).on('resize orientationchange', function () {
			window.clearTimeout(init._t);
			init._t = window.setTimeout(refresh, 120);
		});
	});

	document.addEventListener('hf-include-done', function () {
		window.setTimeout(init, 0);
	});
})(jQuery);
