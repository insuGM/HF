/**
* worklist.util
* --------------------------------------
* @version 2.0.0
* @author Goang
* @modify 170310
*/


function checkBrowser() {
 var browserType = "";
 if(navigator.userAgent.indexOf("MSIE") != -1) {
  browserType = "IE";
  return browserType;
 }
 if(navigator.userAgent.indexOf("Firefox") != -1) {
  browserType = "FF";
  return browserType;
 }
 if(navigator.userAgent.indexOf("Mozilla") != -1) {
  browserType = "MZ";
  return browserType;
 }
 if(navigator.userAgent.indexOf("Opera") != -1) {
  browserType = "OP";
  return browserType;
 }
 if(navigator.userAgent.indexOf("Safari") != -1) {
  browserType = "SF";
  return browserType;
 }
 if(navigator.userAgent.indexOf("Mac") != -1) {
  browserType = "MC";
  return browserType;
 }

 browserType = "NG";
 return browserType;
}


/**
* Util Function
* --------------------------------------
*/
var Util = {
	getFileName : function() {
		var path=location.pathname.split("/");
		return path[path.length-1];
	}
	, getDirName : function() {
		var path=location.pathname.split("/");
		return path[path.length-2];
	}
	, isChrome : function(){
		if(navigator.userAgent.indexOf("Chrome") != -1){
			return true;
		}
		return false;
	}
	, isLocal : function(){
		if(window.location.toString().substr(0,4) == "http"){
			return false;
		}else{
			return true;
		}
	}
	, setStorage : function(name, val){
		window.localStorageAlias = window.localStorage;

		if(!$('html').hasClass('localstorage')){//로컬스토리지 지원 안할때
			window.localStorageAlias = {};
			window.localStorageAlias.removeItem = function () { };
		}else{
			if (typeof (Storage) !== "undefined") {
				localStorage.setItem(name, val);
			} else {
				window.alert('Please use a modern browser to properly view this template!');
			}
		}
	}
	, getStorage : function(name){
		window.localStorageAlias = window.localStorage;

		if(!$('html').hasClass('localstorage')){//로컬스토리지 지원 안할때
			window.localStorageAlias = {};
			window.localStorageAlias.removeItem = function () { };
		}else{
			if (typeof (Storage) !== "undefined") {
				return localStorage.getItem(name);
			} else {
				window.alert('Please use a modern browser to properly view this template!');
			}
		}
	}
	, windowPopup : function (_url, _win, _w, _h,_scroll){
		var popW=_w;
		var popH=_h;
		var windowX = Math.ceil( (window.screen.width - popW) / 2 );
		// var windowY = Math.ceil( (window.screen.height - popH) / 2 );
		var windowY =30;
		window.open(_url, _win, 'width='+_w+', height='+_h+', menubar=no, status=no, toolbar=no, scrollbars='+_scroll+', left='+windowX+', top='+windowY);
	}
	, tabHandler : function (_tabNav, _tabCon, _num, _callback){
		var initActNum=_num;
		var $tabNav=$(_tabNav);
		var $tabCon=$(_tabCon);
		var $navItem = $tabNav.find("li");

		$navItem.eq(initActNum).addClass("on");
		$tabCon.hide();
		$tabCon.eq(initActNum).show();

		$navItem.each(function(){
			$(this).find('a').attr('role', 'tab');
			$(this).find('a').attr('title', '선택하기');
			$(this).find('a').attr('aria-selected', 'false');
		});

		$navItem.eq(initActNum).find('a').attr('title', '선택됨');
		$navItem.eq(initActNum).find('a').attr('aria-selected', true);

		$tabNav.on('click','a',function(){
			var clickNum = $(this).parent().index();
			$navItem.removeClass("on").eq(clickNum).addClass("on");

			$navItem.find('a').attr('title', '선택하기');
			$navItem.find('a').attr('aria-selected', 'false');
			$navItem.eq(clickNum).find('a').attr('title', '선택됨');
			$navItem.eq(clickNum).find('a').attr('aria-selected', true);

			$tabCon.hide();
			$tabCon.eq(clickNum).show();

			if(_callback) _callback(clickNum);
			return false;
		});
	}
	, scrollWatch : function(_callback){
		var
			intervalID
			, checkNum = 0
			, tmpNum = 0
			, flag = false
			, aniSpeed = 360
		;
		var scrollEndCheck=function(_callback){
			clearInterval(intervalID);
			intervalID=setInterval(function(){
				if(tmpNum==checkNum){
					clearInterval(intervalID);
					checkNum=0;
					tmpNum=0;
					if(_callback) _callback();
					setTimeout(function(){
						flag=false;
					}, aniSpeed);
				}
				tmpNum=checkNum;
			},200);
		};
		$(window).scroll(function(event) {
			checkNum++;
			if(!flag) {
				flag=true;
				scrollEndCheck(_callback);
			}
		});
	}
	, resizeWatch : function(_callback){
		var
			intervalID
			, checkNum = 0
			, tmpNum = 0
			, flag = false
			, delay = 600
		;
		var resizeEndCheck=function(){
			clearInterval(intervalID);
			intervalID=setInterval(function(){
				if(tmpNum==checkNum){
					clearInterval(intervalID);
					checkNum=0;
					tmpNum=0;
					if(_callback) _callback();
					setTimeout(function(){
						flag=false;
						return false;
					}, delay);
				}
				tmpNum=checkNum;
			},200);
		};
		$(window).resize(function(event) {
			checkNum++;
			if(!flag) {
				flag=true;
				resizeEndCheck();
			}
		});
	}
};


