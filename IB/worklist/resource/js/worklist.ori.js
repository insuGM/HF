/**
* WORKLIST
* --------------------------------------
* @version 2.0.3
* @author Goang
* ======================================
* @modify
* 	- 180821 : ColorBox 키보드 이전 다음 시 강제 포커싱
* 	- 170329 : subNavigation 추가
* 	- 170328 : Paging Top&Bottom
* 	- 170324 : localStorage, info_secton  folding
* 	- 170320 : Gulp 적용(js,sass) , storage Test
* ======================================
* @todoList
* 	- tr.nocnt : 카운트 안되는 로직 추가
* 	- etc.tag quickSearch
* 	- mobile Skin Change (etc. hambug menu)
* 	- skin Template
* 	- subNavigation 퍼포먼스
* ======================================
* 	- trim(); //IE 하위버전 버그
* 	- resizeMode & autoPlay 에서  바탕화면 클릭시 autoPlay 중지안되는  버그
* ======================================
* @think
* 		1. 네비게이션
*				1) 모바일 네비
*				2) 네비게이션 스타일 및 모션 Skin
*			2. Skin
*				ex) url?skinType
*			3. 2,3Depths Folding
*			4. 작업자별 진척관리
*				ex)
*							대상본수 	/ 완료본수	/	잔여본수	/		진척률
*					1 : 			000		/				000		/			000			/ 			00%
*					2 : 			000		/				000		/			000			/ 			00%
*					미정 :			4		/				000		/					4			/ 			00%
*					합계 : 	000		/				000		/			000			/				00%
*			5. isLocalStorage, isHttp, isFile, isIE, isVersion 분기
*			6. 전체보기에서 2Depths 메뉴는 바로가기로
*			7. 화면 Resize 후 현재 보여지는 화면및 포커싱이 중앙으로 오도록
*			8. touch Scroll 적용(web)
* ======================================
*			fontAweasome
*			 fa-angle-up
*			 fa-angle-down
*			 fa-thumb-tack
*/


$(document).ready(function(){

	var worklist = (function(){
		/**
		* var
		* --------------------------------------
		*/
		var rMap ={
				root : $('html, body')
				, body : $('body')
				, header : $('.header')
				, tab_nav : $('.tab_nav')
				, tab_navList : $('li' , this.tab_nav)
				, info_section : $('.info_section')
				, tobe_section : $('.tobe_section')
				, content : $('#content')
				, tab_content : $('.tab_contents_wrap')
				, tab_title : $('h3')
			}
			, sMap ={
				projectID : ''
				, navIndex : '' // 탭네비게이션 클릭넘 (단, 각 프로젝트마다 따로 설정)
				, filterBtn : ''
				// , footerResize : ['Fullsize' , 'Resize'] // fotterMenu 에서 resizeMode & fullSizeMode 저장}
			}
			, fileName = Util.getFileName()
			, fileDir = Util.getDirName()
			, url_info = String(window.location.href.slice(window.location.href.indexOf('?')+1).split('&'))

			, activeTabNum = rMap.tab_navList.size()-2
			, guideTabNum = rMap.tab_navList.size()-1 //가이드 링크
			, allTabNum = rMap.tab_navList.size()-2 //전체 보기

			, guideURL = "../@pub_guide/guide.html" //가이드 URL
			, layerPopGuideURL = '../@pub_guide/guide_sample/layerPop_worklist.html' //레이어팝업 가이드 URL
			, layerPopPath_server = '../../' + fileDir + '/' // 서버에서 레이어팝업 호출시 경로
			, layerPopPath_local = '../../WEB-INF/'  +fileDir + '/' //로컬에서 레이어팝업 호출시 경로
			, winScroll = 0 //현재 스크롤

			//네비게이션 로케이션
			, navMap ={
				overNum : -1
				, overNum2 : -1
				, overNum3 : -1
				, activeNum : allTabNum //초기 전체메뉴 활성화
				, activenum2 : false
				, activenum3 : false
			}
		;


		/**
		* Layout
		* --------------------------------------
		*/
		var Layout = (function(){
			var appendLayout =function(_callback){
				//tabContent : 번호 자동 추가
				rMap.tab_content.find('tbody tr').each(function(index){
					$("td:first-child", $(this)).before("<td class='num' align='center'>"+ (index+1) +"</td>");
				});

				//화면 튐 현상 방지 위해
				rMap.content.css({'visibility' :'visible'});
				if(_callback) _callback();
			}

			//Link info : 현재 디렉토리 활성화
			var setLocation = function(){
				rMap.tobe_section.find('a').each(function(){
					var urlStr=$(this).attr('href');
					// console.log('urlStr :'+urlStr, fileDir);
					if(urlStr.search(fileDir) != -1){
						$(this).addClass('active');
					}
				});
			}

			var eventHandler = function(){
				//레이어팝업 클릭시 : (colorbox에서 레이어 팝업 링크시 )
				rMap.tab_content.find('tbody tr.layer .path a').on('click' , function(){
					var goURL=$(this).attr('href');
					if(url_info.search('file') != -1) {//로컬로 볼경우
						goURL = layerPopPath_local + goURL;
					} else {//서버에서 볼경우s
						goURL = layerPopGuideURL + '?' + layerPopPath_server + goURL;
					}
					window.open(goURL);
					return false;
				});

				/* ----
					// - 팝업 클릭시 제제
					here CODE INSERT
				*/
			}

			var initModule =function(){
				// setLocation();
				appendLayout();
				eventHandler();
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* Nav
		* --------------------------------------
		* Navigation
		* SubNavigation
		*/
		var Nav =(function(){
			var intervalID
				, $tabCon = rMap.tab_content
				, is_fixed = false //2Depths 고정여부 //contentr와 nav 상태분리
			;

			var _show = function(_target){
				var $depth1 = rMap.tab_navList;
				var $depth1_on = $depth1.eq(navMap.overNum);
				var $depth2 = $depth1_on.find('.subNav');
				var $depth2_on = $depth2.find('>ul > li').eq(navMap.overNum2);

				$depth1_on.addClass('active').siblings().removeClass('active');
				$depth1_on.addClass('active').siblings().removeClass('active');

				var pd =31;
				if(_target == 'content' && is_fixed == false) pb = 0;
				$('.tab_nav > ul > li').css({'padding-bottom' : pb});
			}

			var _hide = function(){
				var pd =0;
				if(is_fixed) pb = 31;
				$('.tab_nav > ul > li').css({'padding-bottom' : pb});
			}


			//테이블 tr hover > TopNav 1, 2Depths 메뉴 활성화
			var contentHandler = function(){
				rMap.tab_content.each(function(i){
					var _this =$(this);
					$(this).find('tbody tr').on({
						'mouseenter focusin' : function(){
							var index1 = $(this).data('index1')
								, index2 = $(this).data('index2')
							;
							navMap.overNum = index1;
							navMap.overNum2 = index2;
							_show('content');
							return false;
						}
						, 'mouseleave focusout' : function(){
							navMap.overNum = navMap.activeNum;
							_show('content');
							return false;
						}
					});
				});
			}

			var tabNavHandler = function(){
				function FNfocusOut(){
					rMap.tab_content.find('tr').removeClass('focus');
				}

				//foucs out
				rMap.root.on('click', function(){
					FNfocusOut();
					// return false; //사용하면 안됨
				});

				//Event Handler
				//extra over시
				rMap.tab_nav.on({
					'mouseover' : function(){
						_show();
						return false;
					}
					,'mouseout' : function(){
						_hide();
						return false;
					}
				});

				//메뉴
				rMap.tab_navList.each(function(i){
					var $depth1 = $(this);

					//1Depth > li
					$depth1.on({
						'mouseenter focusin' : function(){
							// navMap.overNum = $depth1.index();
							// _show();
							return false;
						}
						, 'mouseleave focusout' : function(){
							// navMap.overNum = navMap.activeNum;
							// navMap.overNum2 = navMap.activeNum2;
							// _hide();
							return false;
						}
					});

					//1Depth > li > a
					$depth1.find('> a').on({
						'mouseenter focusin' : function(){
							navMap.overNum = $(this).parent().index();
							_show();

							if(i == allTabNum){
								// console.log('전체메뉴');
							}
							return false;
						}
						, 'mouseleave focusout' : function(){
							navMap.overNum = navMap.activeNum;
							_hide();
							return false;
						}
						, 'click' : function(){
							navMap.activeNum = $(this).parent().index();

							//전체보기
							if(navMap.activeNum == allTabNum){
								rMap.tab_title.show();
								rMap.tab_content.show();
							}else{
								rMap.tab_title.hide();
								rMap.tab_content.hide().eq(navMap.activeNum).show();
							}
							$(this).parent().addClass('on').siblings().removeClass('on');
							rMap.root.scrollTop(0);

							return false;
						}
					});

					//============================================
					//2Depth > li
					$('.subNav', $depth1).on({
						'mouseenter focusin' : function(){
							navMap.overNum = $depth1.index();
							navMap.overNum2 = -1;
							_show();
							return false;
						}
						, 'mouseleave focusout' : function(){
							_hide();
							return false;
						}
					});

					//2Depth > li > a
					$('.subNav li a', $depth1).on({
						'mouseenter focusin' : function(){
							navMap.overNum = $depth1.index();
							navMap.overNum2 = $(this).parent().index();
							_show();
							return false;
						}
						, 'mouseleave focusout' : function(){
							navMap.overNum = navMap.activeNum;
							navMap.overNum2 = navMap.activeNum2;
							_hide();
							return false;
						}
						,'click' : function(){
							$depth1.find('>a').trigger('click'); //해당 탭으로 이동 후 Search
							var curIndex = Number($(this).data('index'))
								, $focusTarget = rMap.tab_content.eq(navMap.activeNum).find('tr')
							;
							FNfocusOut(); //기존 focus 삭제

							//Header 영역 Foldeing 여부에 따라 높이 설정 (??다시생각);
							var goTop = $focusTarget.eq(curIndex).addClasss('focus').offSet().top;
							var wH = $(window).height();
							goTop = goTop- wH/2 + 60;

							rMap.root.stop().animate({'scrollTop' : goTop}, 'fast');

							return false;
						}
					});

					//======================================
				});
			}

			var tabNav_init = function(){
				//화면 작을때 Depth1 메뉴 스크롤 생기게
				/*var navW = 0;
				$('.tab_nav > ul > li').each(function(){
					navW += $(this).outerWidth() + 4;
				});
				$('.tab_nav > ul').css('width', navW);*/

				//SubNav 고정 토글 버튼
				$('.tab_nav >ul').append('<a href="javascript:void(0);" class="btn_pin"><i class="fa fa-lock"></i></a>');
				$('.btn_pin').on('click', function(){
					is_fixed = !is_fixed;
					if(is_fixed) $(this).find('i.fa').removeClass('fa-lock').addClass('fa-unlock-alt');
					else $(this).find('i.fa').removeClass('fa-unlock-alt').addClass('fa-lock');
					$(this).toggleClass('on');
				});

				//서브 네비 셋팅
				rMap.tab_navList.each(function(i){
					//2Depths 네비게이션 Append
					$(this).append('<div class="subNav"><ul></ul></div>');
					var $subNav = $(this).find('.subNav > ul');

					rMap.tab_content.eq(i).find('tbody td.depth2').each(function(ii){
						var menu2Txt = $(this).text();
						//del 제거후 소팅
						if($(this).closest('tr').hasClass('del')) return true;

						if(menu2Txt != ''){
							$subNav.append('<li><a href="javascript:void(0);" data-index='+Number(ii+1)+'>' + menu2Txt+'</a></li>');
						}
					});
				});
			}

			var virtualNav_init = function(){
				var gnbHtml =''
					+ '<div class="gnb">'
				;
				$('body').append(gnbHtml);
			}


			//setting
			var setting ={
				depSize : 1 //th.depth 수
				,folding_depth : null //2~n 까지 폴딩 버튼 삽입(Default :2미만 안보임)
				, debug_mode :false
				, test_mode : true
			}
			var Odata ={
				ARindex : []
				, ARcnt : []
				, ARtxt : []
				, List : []
			}
			var Onum = {
				/*
				Len1 : [] //2Depths 수
				Pos2 : [] //2Depths 위치
				*/
			}

			//--------------------------
			// 변수 초기화
			//--------------------------
			var var_init = function(){
				//2Depths 사이즈 : 2Depths ~ => depSize + 1
				//th.depth 클래스 수로 저장
				var $th = rMap.tab_content.eq(0).find('thead > tr > th');
				var depSize = 1;
				$th.each(function(){
					if($(this).attr('class').search('depth') != -1) depSize++;
				});

				setting.depSize = depSize;
				setting.folding_depth = depSize;

				//Object Setting : Onum
				for(var i=1; i<= setting.depSize; i++){
					Onum['Len'+i] = []; //각 Depths 수
					if(i > 1) Onum['Pos'+i] = []; //각 Depths 위치
				}
			}

			//--------------------------
			// Table Data 초기화
			//--------------------------
			var data_init = function(){
				var tmp = {};
				var depNum = setting.depSize;

				//TR 셋팅
				rMap.tab_content.each(function(i){
					//변수셋팅
					for(var j = 1; j <= depNum; j++){
						if(j == 1){
							tmp.txt1 = rMap.tab_navList.eq(i).find('>a').text();
							tmp.index1 = i;
							tmp.cnt1 = -1;
						}else{
							tmp['txt'+j] = ''
							tmp['index'+j] = -1
							tmp['cnt'+j] = -1
						}
					}

					var ARindex = Odata.ARindex[i] = []
						, ARcnt = Odata.ARcnt[i] = []
						, ARtxt = Odata.ARtxt[i] = []
						, Olist = Odata.List[i] = []
						, headers = $(this).find('thead > tr > th')
						, cur = {} //cur.txt1
					;

					//tBody >tr
					$(this).find('tbody >tr').each(function(ii, row){
						if($(this).hasClass('del')) return true;//삭제 제외

						for(var jj = 2; jj <= depNum; jj++){
							cur['txt'+jj] = $(this).find('> td.depth'+jj).text();
						}

						tmp.cnt1++;

						//------------------------------
						//초기시 //!txt2
						//------------------------------
						if(cur.txt2 !='' && cur.txt2 != tmp.txt2){//이전 뎁스 메뉴와 같지 않으면
							tmp.txt2 = cur.txt2;
							tmp.index2++;
							tmp.cnt2=0

							tmp.txt3 = tmp.txt4 = tmp.txt5 ='';
							tmp.index3 = tmp.index4 = tmp.index5 = -1;
							tmp.cnt3 = tmp.cnt4 = tmp.cnt5 = -1;

							//2Depths 일경우 예외처리 ----(예정)
							//3Depths 부터 ~ End Depth
							for(var jjj=3; jjj <= depNum; jjj++){
								if(cur['txt'+jjj] !=''){
									tmp['txt'+jjj] = cur['txt'+jjj];
									tmp['index'+jjj]++;

									for(var k = jjj; k <= depNum; k++){
										tmp['cnt'+k] = -1;
									}
								}
							}
						}else{
							tmp.cnt2++;
							if(cur.txt2 !='' && cur.txt2 == tmp.txt2){//텍스트 같을때 삭제
								$(this).find('> td.depth2').text('');
							}
						}

						//------------------------------
						//개별
						//------------------------------
						for(var m =3; m <= depNum; m++){
							if(cur['txt'+m] != '' && cur['txt'+m] != tmp['txt'+m]){
								tmp['txt'+m] = cur['txt'+m];
								tmp['index'+m]++;
								tmp['cnt'+m] = 0;

								if(m <depNum){//마지막 Depths 제외
									for(var n = (m+1); n <= depNum; n++){
										tmp['txt'+n] = '';
										tmp['index'+n] = -1;
										tmp['cnt'+n] = -1;
									}
								}
							}else{
								tmp['cnt'+m]++;
								if(tmp['cnt'+m] != 0 && cur['txt'+m] == tmp['txt'+m]){//텍스트 같을때 삭제
									$(this).find('> td.depth'+m).text('');
								}
							}
						}

						//============================================
						//Save Data
						var ARdata_index = []
							, ARdata_cnt = []
							, ARdata_txt = []
							, Olist2 = Olist[ii] ={}
						;

						//insert of Data
						for(var d = 1; d <= depNum; d++){
							$(this).data('txt'+d, tmp['txt'+d]);
							$(this).data('index'+d, tmp['index'+d]);
							$(this).data('cnt'+d, tmp['cnt'+d]);

							ARdata_index[d-1] = tmp['index'+d];
							ARdata_cnt[d-1] = tmp['cnt'+d];
							ARdata_txt[d-1] = tmp['txt'+d];
						}

						ARindex[ii] = ARdata_index;
						ARcnt[ii] = ARdata_cnt;
						ARtxt[ii] = ARdata_txt;

						$(row).find('>td').each(function(iii, cell){
							Olist2[$(headers[iii]).attr('class')] = $(cell).text();
						});

						//----------------
						//추후삭제
						if(setting.test_mode){
							$(this).attr({
								'data-index' : ARdata_index
								, 'data-cnt' : ARdata_cnt
								//, 'data-txt' : ARdata_txt
							});
						}

						if(setting.debug_mode){
							for(var t=2; t<=depNum; t++){
								$(this).find('td.depth'+t).html(
									$(this).find('td.depth'+t).text()
									+	'<span class="fr mr5">'
									+		$(this).data('index'+t)+ ' : ' + $(this).data('cnt'+t)
									+	'</span>'
								);
							}
						}
					});

					if(setting.debug_mode){
						$(this).find('>h3').html($(this).find('>h3').text() + ': [cnt1 : '+ tmp.cnt1 +']')
					}


				});
			}


			//=====================================
			// Table Data 변환
			//=====================================
			var transData = function(){
				console.log('\n\n[transData]================');

				var depNum = setting.depSize;

				rMap.tab_content.each(function(i){
					var ARindex = Odata.ARindex[i]
						, ARcnt = Odata.ARcnt[i]
						, Olist = Odata.List[i]
						, tmp = {}
					;

					//Object Setting : Onum
					Onum.Len1[i] = Number(ARindex[ARindex.length-1][1]) +1;

					for(var o=2; o<=depNum; o++){
						//Object 초기화
						Onum['Len'+o][i]= [];
						Onum['Pos'+o][i]= [];

						tmp['cnt'+o] = 0;
						tmp['num'+o] = 0;
					}

					//Data Setting
					$(this).find('tbody >tr').each(function(ii, row){
							if($(this).hasClass('del')) return true;//삭제 제외

							for(var o=2; o<=depNum; o++){
								if(ARcnt[ii][o-1] == 0){//2Depths	: 첫번째 포지션 위치 저장
									Onum['Pos'+o][i][tmp['cnt'+o]] = ii;
									tmp['cnt'+o]++;
									tmp['num'+o] = 0;
									$(this).data('first'+o, true);

									if(setting.test_mode) $(this).attr('data-first'+o, true); //추후 삭제 -------$$$$
								}
								tmp['num'+o]++;
								Onum['Len'+o][i][tmp['cnt'+o]-1] = tmp['num'+o];
							}
					});
				});

				if(setting.test_mode){
					console.log(Odata, 'Odata')
					console.log(Onum, 'Onum')
				}
			}

			var setFoldingBtn = function(){
				var depNum = setting.depSize;

				//접고 펼치기 아이콘
				var icon_open = 'fa-plus-circle';
				var icon_close = 'fa-minus-circle';
				var foldHtml = '<a href="javascript:;" class="dep_fold_btn fr on"><i class="fa fa-fw '+icon_close+'"</i></a>'
				var watchFolding = [];

				/*
				//offN {display:none}======== dep Num 까지 ... 확장//추후 수정
				*/

				rMap.tab_content.each(function(i){
					//h3
					$(this).find('>h3').prepend(foldHtml);
					for(var d=2; d<=depNum; d++){
						//폴딩 watch 변수초기화
						watchFolding[d]=0;

						//tHead
						$(this).find('thead > tr > th.depth'+d).append(foldHtml);

						//tBody
						var len = Onum['Pos'+d][i].length;
						for(var ii = 0; ii < len; ii++){
							var trPos = Number(Onum['Pos'+d][i][ii])+1;
							var trNum = Number(Onum['Len'+d][i][ii]);
							var $tr = $(this).find('tr').eq(trPos);

							if(trNum > 1){//하위 메뉴가 하나 이상일 경우 버튼 삽입
								$tr.find('> td.depth'+d).append(foldHtml);
							}
						}
					}
				});

				//===============================
				//Event
				//===============================
				var iconToggle = function(_target){
					var $a = _target;
					var tag = $a.parent()[0].tagName;
					var $curTable = $a.closest('.tab_contents_wrap');
					var curDepNum = $a.parent().attr('class').substr(5);//depth2, depth3...

					$a.toggleClass('on');

					if($a.hasClass('on')){
						$a.find('i').removeClass(icon_open).addClass(icon_close);
					}else{
						$a.find('i').removeClass(icon_close).addClass(icon_open);
					}
				

					//watch
					if(tag == 'TD'){
						var $thBtn = $curTable.find('thead .depth'+curDepNum).find('.dep_fold_btn');
						if($a.hasClass('on')) watchFolding[curDepNum]++;
						else watchFolding[curDepNum]--;

						if(watchFolding[curDepNum]=='0'){
							//console.log('모두다 펼치기 완료')
							$thBtn.addClass('on').find('i').removeClass(icon_open).addClass(icon_close)
						}else{
							$thBtn.removeClass('on').find('i').removeClass(icon_close).addClass(icon_open)
						}
					}

					if(tag == 'TH'){
						var $tdBtn = $curTable.find('tbody .depth'+curDepNum).find('.dep_fold_btn');
						if($a.hasClass('on')){//console.log('모두다 펼치기 완료 : + > -')
							$tdBtn.addClass('on').find('i').removeClass(icon_open).addClass(icon_close)
							watchFolding[curDepNum] = 0;
						}else{//console.log('모두다 펼치기 완료 : - > +')
							$tdBtn.removeClass('on').find('i').removeClass(icon_close).addClass(icon_open)
							watchFolding[curDepNum] = $tdBtn.size()*(-1);
						}
					}

					// console.log('watchFolding' + tag, curDepNum, watchFolding);
				}

				//-------------------------------------
				//h3
				//-------------------------------------
				rMap.tab_content.find('h3 > .dep_fold_btn').on('click', function(){
					var $a= $(this);
					var $target = $a.parent().parent().find('table > tbody');

					$a.toggleClass('on');
					if($a.hasClasss('on')){//펼치기 : + > -
						$a.find('i').removeClass(icon_open).addClass(icon_close);
						$target.show();
					}else{//접기 : - > +
						$a.find('i').removeClass(icon_close).addClass(icon_open);
						$target.hide();
					}
				});

				//-------------------------------------
				//tHead
				//-------------------------------------
				/*
				1. tbody 하나라도 접혀졌을때 (+일경우) : thead +
				2. tBody 전체 펼쳐졌을때 (-일경우) : thead -
				3. nDepth 클릭시 하위 전체 펼치기 접기는 따로 버튼 생성예정(ex. 번호옆)
				*/
				function headEventHandler(e){
					var $a = e;
					var $th = $a.parent();
					var $target = $a.closest('table').find('tbody > tr');
					var curDepNum = $th.attr('class').substr(5);//depth2, depth3 ...
					
					$target.each(function(){
						var _this = $(this);

						//body dep가 모두 펼쳐 졌을때 > 접기
						if($a.hasClass('on')){
							_this.addClass('off'+curDepNum);
							if(_this.data('first'+curDepNum)){
								_this.removeClass('off'+curDepNum);
								_this.addClass('on');
							}
						}
						//body 하나라도 접혀졌을때 > 펼치기
						else{
							_this.removeClass('off'+curDepNum);
							if(_this.data('first'+curDepNum)){
								_this.removeClass('off'+curDepNum);
								_this.removeClass('on');
							}
						}
					});
					iconToggle($a);
					return false;
				}

				rMap.tab_content.find('thead th > .dep_fold_btn').on('click', function(e){
					headEventHandler($(e.currentTarget));
				});

				//-------------------------------------
				//tBody
				//-------------------------------------
				function bodyEventHandler(e){
					var $a = e;
					var $td = $a.parent();
					var $tr = $a.parent().parent();
					var $target = $tr.siblings('tr');
					var curDepNum = $td.attr('class').substr(5);//depth2, depth3 ...
					var tmp = {}

					for(var i = 2; i <= curDepNum; i++){
						tmp['curIndex'+i] = $tr.data('index'+i);
					}

					$target.each(function(){
						for(j = 2; j <= curDepNum; j++){
							if(tmp['curIndex'+j] == $(this).data('index'+j)) continue;
							else return true;
						}
						if(! $(this).data('first'+curDepNum)){
							$(this).toggleClass('off'+curDepNum);
						}
					});

					iconToggle($a);
					return false;
				}

				rMap.tab_content.find('tbody td > .dep_fold_btn').on('click', function(e){
					bodyEventHandler($(e.currentTarget));
				});
			}


			var initModule =function(){
				var_init();
				data_init();
				transData();

				tabNav_init();
				tabNavHandler();
				
				setFoldingBtn();

				//초기 보여지는 메뉴 -> 추후 set으로 변경
				rMap.tab_navList.eq(allTabNum).find('a').click();

				contentHandler();
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* Header Folding
		* --------------------------------------
		* header 전체 폴딩
		* 1. IF top == 0
		* 	- 무조건 open 상태
		* 	- close 클릭시 상태 저장
		* 	- localStorage 저장
		* 2. IF top > 0
		* 	- 초기 : close 상태
		* 	- open 클릭시 상태 저장
		*/
		var HeaderFolding =(function(){
			var $toggleBtn = Object;
			var headerT_Flag = true; //탑일경우 : true : open,  false : close
			var headerS_Flag = false; //Scroll 되는 경우 flag

			var appendLayout = function(){
				// Header CloseBtn Append
				rMap.info_section.find('>div h2').append(' <a href="javascript:void(0);" class="close_btn"> - </a>');
				rMap.info_section.after('<div class="info_fold_btn"> <a href="javascript:void(0);"><span> Close </span></a> </div>');

				$toggleBtn = $('.info_fold_btn a');
			}

			function headerOpen(){
				rMap.body.addClass('headerClose');
				$toggleBtn.text('Open');
			}
			function headerClose(){
				rMap.body.removeClass('headerClose');
				$toggleBtn.text('Close');
			}
			function headerOpen_top(){
				headerClose();
				rMap.info_section.stop().slideDown(200);
			}
			function headerClose_top(){
				headerOpen();
				rMap.info_section.stop().slideUp(100);
			}
			function headerOpen_scroll(){
				if(headerT_Flag == false){
					headerOpen();
					rMap.info_section.stop().slideUp(100);
				}else{
					headerClose();
					rMap.info_section.show();
				}
			}
			function headerClose_scroll(){
				if(rMap.body.hasClass('floating')) {
					if(headerS_Flag == false){
						headerOpen();
						rMap.info_section.stop().slideUp(100);
					}else{
						headerClose();
						rMap.info_section.show();
					}
				}else{//top
					headerOpen();
					rMap.info_section.hide();
				}
			}

			var eventHandler = function(){
				$toggleBtn.on('click', function(){
					if(rMap.body.hasClass('floating') ) {// top > 0
						if(rMap.body.hasClass('headerClose') ) {
							headerS_Flag = true;
							headerOpen_top();
							// console.log('scroll 시 Close -> Open')
						}else{
							headerS_Flag = false;
							headerClose_top();
							// console.log('scroll 시 Open -> Close')
						}
					} else {// top == 0
						if(rMap.body.hasClass('headerClose') ) {
							headerT_Flag = true;
							headerOpen_top();
							Util.setStorage('headerClose', 'show');
						}else{
							headerT_Flag = false;
							headerClose_top();
							Util.setStorage('headerClose', 'hide');
						}
					}
					return false;
				});

				// - info_section 각각 폴딩
				rMap.info_section.find('.close_btn').each(function(i){
					$(this).on('click', function(){
						$(this).closest('div').toggleClass('hide');
						if($(this).closest('div').hasClass('hide')){
							$(this).text(' + ');
						}else{
							$(this).text(' - ');
						}
						return false;
					});
				});

				// - 스크롤 IA 영역  HeadFix
				$(window).scroll(function(){
					winScroll = $(window).scrollTop();
					if(winScroll > 1){
						headerClose_scroll();
						// rMap.tab_nav.find('.top_btn').show(); //header ↑top
						rMap.body.addClass('floating');
						rMap.content.css({'margin-top' : rMap.tab_nav.height() + 10});
					} else {
						headerOpen_scroll();
						// rMap.tab_nav.find('.top_btn').hide();//header ↑top
						rMap.body.removeClass('floating');
						rMap.content.css({'margin-top' : 30});
					}
				}).scroll();
			}

			//header 전체 폴딩 localStorage
			var localStorage = function(){
				if(typeof (Util.getStorage('headerClose')) == "undefined" || Util.getStorage('headerClose') == 'null' || Util.getStorage('headerClose') =='show' ){
					Util.setStorage('headerClose', 'show');
					headerT_Flag = true;
				} else {
					rMap.body.addClass('headerClose');
					rMap.info_section.stop().slideUp('fast');
					headerT_Flag = false;
				}
			}

			var initModule =function(){
				appendLayout();
				eventHandler();
				localStorage();
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* Quick
		* --------------------------------------
		* Top, PgUp, PgDown, Bottom
		*/
		var Quick = (function(){
			var appendLayout =function(){
				var str = ''
						+ '<div class="scroll_btn">'
						+ 	'<a href="javascipt:void(0);" class="btn_top"><span>↑</span></a>'
						+ 	'<a href="javascipt:void(0);" class="page_up"><span>∧</span></a>'
						+ 	'<a href="javascipt:void(0);" class="page_down"><span>∨</span></a>'
						+ 	'<a href="javascipt:void(0);" class="btn_bottom"><span>↓</span></a>'
						+ '</div>'
					, str2 = '<span class="top_btn"><a href="javascript:void(0);" >↑top</a></span>'
					// , str3 = '<strong class="top_btn" style="z-index:9;position:absolute;bottom:10px; right:19px;display:none"><a href="javascript:void(0);">↑top</a></strong>'
				;
				rMap.body.append(str);
				rMap.tab_title.append(str2);
				// rMap.tab_title.append(str3);
			}

			var eventHandler =function(){
				var $scrollBtn =$('.scroll_btn')
					, $pgUp = $('.page_up', $scrollBtn)
					, $pgDown = $('.page_down', $scrollBtn)
					, $btnTop = $('.btn_top', $scrollBtn)
					, $btnBottom = $('.btn_bottom', $scrollBtn)
					, $topBtn = $('.top_btn')
				;

				//page UP DOWn
				$pgUp.on('click', function(){
					var wH = $(window).height() -80;
					var $diffTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
					rMap.root.stop().animate({scrollTop:$diffTop - wH}, 'fast');
					return false;
				});
				$pgDown.on('click', function(){
					var wH = $(window).height() - 80;
					var $diffTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
					rMap.root.stop().animate({scrollTop:$diffTop + wH}, 'fast');
					return false;
				});
				$btnTop.on('click', function(){
					rMap.root.stop().animate({scrollTop:0}, 'fast');
					return false;
				});
				$btnBottom.on('click', function(){
					rMap.root.stop().animate({scrollTop:$(document).height()}, 'fast');
					return false;
				});

				$topBtn.on('click', function(){
					$btnTop.trigger('click');
					return false;
				});
			}

			var initModule =function(){
				appendLayout();
				eventHandler();
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* ColorBox : Footer Menu
		* --------------------------------------
		*/
		var ColorBox = (function(){
			var fMap = {}
				, cbVar = {}
			;

			var appendLayout =function(){
				var str = ''
						+ '<div class="footMenu ">'
						+ '	<div class="optionBar clearfix">'
						+ '		<div class="btn_area fl ">'
						+ '			<a href="javascript:void(0);" class="btn_cbox close_btn"><span>닫기</span></a>'
						+ '			<a href="javascript:void(0);" class="btn_cbox prev_btn"><span>이전</span></a>'
						+ '			<a href="javascript:void(0);" class="btn_cbox next_btn"><span>다음</span></a>'
						+ '			<a href="javascript:void(0);" class="btn resize_btn"><span>ReSize</span></a>'
						+ '			<a href="javascrpt:void(0);" class="btn id_link" target="_blank"><span>Open</span></a>'
						+ '			<strong class="cate" style="padding-left:3px;color:#555;"></strong>'
						+ '		</div>'
						+ '		<div class="btn_area fr">'
						+ '			<div class="info_area">'
						+ '				<span class="id_txt">pageID</span>'
						+ '				<p class="menu_txt" style="margin:0;"><span class="page"></span></p>'
						+ '			</div>'
						+ '			<select name="" id="autoSelect">'
						+ '				<option value="0.5">0.5</option>'
						+ '				<option value="0.8">0.8</option>'
						+ '				<option value="1" selected="selected">1.0</option>'
						+ '				<option value="2">2.0</option>'
						+ '				<option value="3">3.0</option>'
						+ '			</select>'
						+ '			<a href="javascript:void(0);" class="btn_cbox auto_btn"><span>Auto</span></a>'
						+ '			<a href="javascript:void(0);" class="btn_cbox prev_btn"><span>이전</span></a>'
						+ '			<a href="javascript:void(0);" class="btn_cbox next_btn"><span>다음</span></a>'
						+ '			<a href="javascript:void(0);" class="btn_cbox close_btn"><span>닫기</span></a>'
						+ '		</div>'
						+ '	</div>'
						+ '	<div class="resizeBar">'
						+ '		<div class="control">'
						+ '			<span class="bar s320" data-width="320"><span class="info_txt">320</span></span>'
						+ '			<span class="bar s340" data-width="340"></span>'
						+ '			<span class="bar s360" data-width="360"></span>'
						+ '			<span class="bar s375" data-width="375"></span>'
						+ '			<span class="bar s425" data-width="425"></span>'
						+ '			<span class="bar s768" data-width="768"></span>'
						+ '			<span class="bar s1000" data-width="1000"></span>'
						+ '			<span class="bar s1024" data-width="1024"></span>'
						+ '			<span class="bar s1200" data-width="1200"></span>'// 추가
						+ '			<span class="bar s1440" data-width="1440"></span>'
						+ '			<span class="bar s1600" data-width="1600"></span>'
						+ '			<span class="bar s1920" data-width="1920"></span>'
						+ '		</div>'
						+ '		<div class="control">'
						+ '		</div>'
						+ '	</div>'
						+ '</div>'
				;
				rMap.body.append(str);
			}

			var setColorBoxMap=function(){
				var bottomGap =40;
				fMap={
					footMenu : $('.footMenu')
					, autoSelect : $('#autoSelect')
					, resizeBtn : $('.resize_btn', this.footMenu)//리사이즈 토글 버튼
					, resizeBar : $('.resizeBar', this.footMenu)//사이즈바 컨트롤
					, control : $('.control', this.footMenu)
					, control_btn : $('.bar', this.footMenu)
					, infoTxt : $('.info_txt', this.footMenu)
				}

				cbVar = {
					className : 'iframe'
					, bottomGap : bottomGap
					, bottomGap_resize : bottomGap +19
					, outerGap : 28
					, curSize : Util.getStorage('curSize')
					, resizeMode : Util.getStorage('resizeMode')
					, ARresize :[]
					, option : {width : '100%', height : $(window).height()- bottomGap, top : 0 }
					, autoID : 'autoID'
					, autoFlag : false
					, saveResizeBtn : Object
				}

				//ARresize
				fMap.control_btn.each(function(i){
					var dataVal = $(this).data('width');
					cbVar.ARresize[i] = dataVal;
				});
			}

			var colorBoxHandler = function(){
				var curSize = cbVar.curSize;

				$('.'+cbVar.className).colorbox({
					iframe : true
					, width : cbVar.option.width
					, height : cbVar.option.height
					, top : cbVar.option.top
					, opacity : 1.0
					// , current : "html {current} of {total}"
					, current : ""
					, onOpen:function(){
						addFootMenu();
						return false;
					}
					, onLoad:function(){
						return false;
					}
					, onComplete :function(){
						if(Util.getStorage('resizeMode') == 'Resize'){
							if(!cbVar.autoFlag){
								resizeBtnTrigger();
							}
						}else{
								fullsizeBtnTrigger();
							}
						return false;
					}
					, onCleanup:function(){
						return false;
					}
					, onClosed:function(){
						removeFootMenu();
						return false;
					}
				});

				function resetColorbox(){
					$('.'+cbVar.className).colorbox({
						width : cbVar.option.width
						, height : cbVar.option.height
						, top : cbVar.option.top
						, opacity : 1.0
						// , current : "{current} / {total}"
						, current : ''
					});
					$.colorbox.resize(cbVar.option);
				}
				function addFootMenu(){
					rMap.body.css({'overflow': 'hidden'});
					fMap.footMenu.addClass('on');
					addTitle();
				}
				function removeFootMenu(){
					rMap.body.css({'overflow': 'auto'});
					fMap.footMenu.removeClass('on');
				}
				function addTitle(){
					var prop = $.colorbox.element();
					var curDepNum = prop.closest('.tab_contents_wrap').index();
					var curMenu = $('.tab_nav ul').find('li').eq(curDepNum).text();
					var curTitle = prop.context.title;
					var ARpath = prop.context.pathname.split('/');
					var _path1 = ARpath[ARpath.length -2];
					var _path2 = ARpath[ARpath.length -1];
					fMap.footMenu.find('.id_txt').text(_path1 +'/'+ _path2 );
					// fMap.footMenu.find('.menu_txt .cate').text(curMenu);
					fMap.footMenu.find('.optionBar .btn_area .cate').text(curMenu);
					fMap.footMenu.find('.menu_txt .page').text(curTitle);

					//레이어 팝업등에서 강제 포커스 가져오기 위해
					setTimeout(function(){
						$('html').focus();
					}, 200)
				}
				// Test (Dispatch )
				function nextCate(){
					var prop = $.colorbox.element();
					var curDepNum = prop.closest('.tab_contents_wrap').index();

					$('.tab_contents_wrap').eq(curDepNum +1).find('tr').each(function(i){

					});
				}
				//EVENT
				//새창 열기
				fMap.footMenu.find('.id_link').on('click', function(){
					var prop=$.colorbox.element();
					window.open(prop.context.href);
					clearAuto();
					return false;
				});
				//이전
				fMap.footMenu.find('.prev_btn').on('click', function(){
					$.colorbox.prev();
					clearAuto();
					addTitle();
					return false;
				});
				//다음
				fMap.footMenu.find('.next_btn').on('click', function(){
					$.colorbox.next();
					clearAuto();
					addTitle();
					return false;
				});
				//방향키
				$('html').keyup(function(e){
					clearAuto();
					if(fMap.footMenu.hasClass('on')){
						var key = e.which;
						if(key == 37 || key == 39) {
							addTitle();
						}
					}
					return false;
				});
				//닫기
				fMap.footMenu.find('.close_btn').on('click', function(){
					$.colorbox.close();
					clearAuto();
					return false;
				});
				//자동
				fMap.footMenu.find('.auto_btn').on('click', function(){
					if(!cbVar.autoFlag){
						var timeVal = fMap.autoSelect.val();
						cbVar.autoID=setInterval(function(){
							$.colorbox.next();
							addTitle();
						}, timeVal*1000);
						$(this).addClass('on');
						cbVar.autoFlag=true;
					}else{
						clearInterval(cbVar.autoID);
						$(this).removeClass('on');
						cbVar.autoFlag=false;
					}
					return false;
				});

				//자동 설정 셀렉트 박스
				fMap.autoSelect.on('change', function(){
					clearAuto();
				});

				//자동 Clear
				function clearAuto(){
					if(cbVar.autoFlag) {
						fMap.footMenu.find('.auto_btn').trigger('click');
					}
				}

				function resizeBtnTrigger(){
					// curSize='320';
					cbVar.resizeMode = "Resize";
					Util.setStorage('resizeMode', 'Resize');
					$('.s'+curSize).trigger('click');
					fMap.resizeBar.addClass('on');
					fMap.resizeBtn.find('span').text('Fullsize');
				}

				function fullsizeBtnTrigger(){
					cbVar.resizeMode = "Fullsize";
					Util.setStorage('resizeMode', 'Fullsize');
					cbVar.option = {width : '100%', height : $(window).height()-cbVar.bottomGap , top : 0};
					fMap.resizeBar.removeClass('on');
					fMap.resizeBtn.find('span').text('Resize');
				}

				//리사이즈 토글 버튼
				fMap.resizeBtn.on({
					click : function(){
						if(cbVar.resizeMode == "Fullsize"){
							resizeBtnTrigger();
						}else{
							fullsizeBtnTrigger();
						}
						resetColorbox();
						clearAuto();
						return false;
					}
				});

				//사이즈바 컨트롤
				fMap.control_btn.each(function(){
					var $btn=$(this);
					$btn.on({
						mouseenter : function(){
							var dataW=$(this).data('width');
							fMap.infoTxt.text(dataW);
							fMap.control_btn.removeClass('on');
							$(this).addClass('on').prevAll().addClass('on');
							return false;
						}
						, mouseleave : function(){
							fMap.infoTxt.text(curSize);
							fMap.control_btn.removeClass('on');
							cbVar.saveResizeBtn.addClass('on').prevAll().addClass('on');
							return false;
						}
						, click : function(){
							cbVar.resizeMode = 'Resize';
							Util.setStorage('resizeMode', 'Resize');

							var dataW = $(this).data('width');
							curSize = dataW;
							Util.setStorage('curSize', curSize);
							cbVar.saveResizeBtn =$(this);
							fMap.infoTxt.text(curSize);
							$(this).addClass('on').prevAll().addClass('on');

							cbVar.option = {width : dataW+cbVar.outerGap , height : $(window).height()- Number(cbVar.bottomGap_resize) , top : 0};
							resetColorbox();
							clearAuto();
							return false;
						}
					});
				});

				//Resize
				$(window).on('resize', function(){
					if(cbVar.resizeMode == 'Fullsize'){
						cbVar.option = {width : $(this).width() , height : $(this).height()-cbVar.bottomGap , top : 0};
						resetColorbox();
					}
				});
			}

			var eventHandler = function(){
				rMap.tab_content.find('tr').each(function(i){
					var target = 'td.num';
					var target_a = $(this).find('.num a');
					// var $pageID = $(this).find('.pid').text();
					var $pageName = $(this).find('.page').text();
					var goURL = $(this).find('.path a').attr('href');
					var goURL = $(this).find('.path a').attr('href');

					if($(this).hasClass('del') || !$(this).find('.rdate').text() || typeof goURL=="undefined" || $(this).context.style.display =='none'){
						target_a.removeClass('iframe cboxElement'); //colorbox object 삭제
					}else{
						//레이어 팝업일경우
						if($(this).hasClass('layer')){
							if(url_info.search('file') != -1) goURL = layerPopPath_local + goURL; //로컬로 볼경우
							else goURL = layerPopGuideURL + '?' + layerPopPath_server + goURL; //서버에서 볼경우
						}
						//팝업일경우 //다시 생갈해볼것
						/*else if($(this).hasClass('popup')){
							goURL = $(this).find('.path a').text();
						}*/

						$(this).find(target).html("<a href="+goURL+" rel='"+cbVar.className+"' class='"+cbVar.className+"' title='"+$pageName+"'>"+$(this).find(target).text()+"</a>");
					}
				});


				//링크 : Focus 색상
				rMap.tab_content.find('table tr td a').on({
					focusin : function(){
						$(this).closest('tr').addClass('focus');
						return false;
					}
					, focusout : function(){
						$(this).closest('tr').removeClass('focus');
						return false;
					}
				});
			}

			var localStorage = function(){
				//localStorage 초기 셋팅 : Default :  Fullsize
				if(typeof (Util.getStorage('curSize')) == "undefined" || Util.getStorage('curSize') == null ){
					Util.setStorage('curSize', 320);
					cbVar.curSize = 320;
				}
				if(typeof (Util.getStorage('resizeMode')) == "undefined" ){
					Util.setStorage('resizeMode', 'Fullsize');
					cbVar.resizeMode = 'Fullsize';
				}
				if(Util.getStorage('resizeMode') == 'Resize'){
					cbVar.option = {width : cbVar.curSize + cbVar.outerGap , height : $(window).height()- Number(cbVar.bottomGap_resize) , top : 0};
					cbVar.saveResizeBtn = $('.'+cbVar.curSize);
				}
			}

			var initSet =function(){
				appendLayout();
				setColorBoxMap();
				eventHandler();
				colorBoxHandler();
			}

			var initModule =function(){
				initSet();
				localStorage();
			}

			var resetModule =function(){
				$('.footMenu').remove();
				initSet();
			}

			return {
				initModule: initModule
				, resetModule : resetModule
				, localStorage : localStorage
			}
		})();


		/**
		* Filter Button : IA Optional
		* --------------------------------------
		*/
		var Filter =(function(){
			var $content = rMap.tab_content.find('tbody')
				, $contentTR = $content.find('tr')

				, $newBtn = rMap.info_section.find('a.new') //신규
				, $delBtn = rMap.info_section.find('a.del') //삭제
				, $holdBtn = rMap.info_section.find('a.hold') //보류
				, $reworkBtn = rMap.info_section.find('a.rework') //재확인
				, $equalBtn = rMap.info_section.find('a.equal') //동일
				, $layerBtn = rMap.info_section.find('a.layer') //레이어팝
				, $popupBtn = rMap.info_section.find('a.popup') //팝업
				, $resultBtn = rMap.info_section.find('a.result') //완료
				, $resultBtn_ex = rMap.info_section.find('a.result_ex') //미완료
				, $totalBtn = rMap.info_section.find('a.total') //전체
				, $realBtn = rMap.info_section.find('a.real') //삭제제외
				, $searchBtn =$('input#id_search')

				, sortType = false //filter 버튼 클릭시 카운트 재졍렬 여부
				, cnt = 1
				, delFlag = 0
				, oldBtn //클릭한 버튼 저장
				, btnName

				, qs= $searchBtn.quicksearch('.tab_contents_wrap tbody tr') //Search
			;

			//btn 초기화
			function FNbtn_reset($onBtn){
				btnName= $onBtn.attr('class').split(' ')[0];
				cnt=1;
				$onBtn.addClass('on');
				$onBtn.siblings().removeClass('on');
				$content.find('tr').show();
			}

			//전체 수
			function FNtotal_cnt($onBtn){
				$contentTR.each(function(index){
					$("td:first-child", $(this)).text(index+1);
				});
			}

			//선택한 수 : TR 컨트롤 :
			function TR_select_cnt($onBtn, flag){
				FNbtn_reset($onBtn);
				$contentTR.each(function(index){
					if(flag){//해당 클래스만 보기시 카운트
						//해당 고유넘 재카운트시
						if(sortType) if($(this).hasClass(btnName)) $("td:first-child", $(this)).text(cnt++);
						$content.find('tr').hide();
						$content.find('tr.'+btnName).show();
					}else{//해당 클래스 제외시 카운트
						if(!$(this).hasClass(btnName)) $("td:first-child", $(this)).text(cnt++);
					}
				});
			}

			//선택한 수 : TD 컨트롤 - td에 삭제나 날짜 있을경우 , tr.del있을경우 제제
			function TR_result_cnt($onBtn, flag){
				FNbtn_reset($onBtn);
				$contentTR.hide();
				$contentTR.find('td.rdate').each(function(index){
					// var tdStr = String($(this).text().trim());
					var tdStr = String($(this).text());
					//완료
					if(flag){
						if(!tdStr || $(this).parent().hasClass('del')){
						}else{
							$(this).parent().show();
							$("td:first-child", $(this).parent()).text(cnt++);
						}
					}
					//미완료
					else{
						if(!tdStr){
							if($(this).parent().hasClass('del')){
							}else{
								$(this).parent().show();
								$("td:first-child", $(this).parent()).text(cnt++);
							}
						}
					}
				});
			}

			//Calculator
			function calculator(){
				var newCnt = 0
					, delCnt = 0
					, holdCnt = 0
					, reworkCnt = 0
					, equalCnt = 0
					, layerCnt = 0
					, popupCnt = 0
					, resultCnt = 0
					, result_exCnt = 0
					, realCnt = 0
					, totalCnt = 0
					, realPercent
				;

				$contentTR.each(function(index){
					if($(this).hasClass('new')) newCnt++;
					if($(this).hasClass('del')) delCnt++;
					if($(this).hasClass('hold')) holdCnt++;
					if($(this).hasClass('rework')) reworkCnt++;
					if($(this).hasClass('equal')) equalCnt++;
					if($(this).hasClass('layer')) layerCnt++;

					//팝업
					//if($(this).hasClass('popup')) popupCnt++;
					if($(this).find('.page').text().search('(팝)') != -1) {
						$(this).addClass('popup');
						popupCnt++;
					}
					totalCnt = index+1;
				});

				//완료
				$contentTR.find('td.rdate').each(function(index){
					var tdStr = String($(this).text());
					// var tdStr = String($(this).text().trim());
					// var tdStr = String($(this).trim());

					// if(!tdStr || $(this).parent().hasClass('del') || tdStr.search('/') == -1 ){
					if(!tdStr || $(this).parent().hasClass('del')){
					} else {resultCnt++;}
					//미완료
					if(!tdStr){
						if($(this).parent().hasClass('del')){
						} else {result_exCnt++;}
					}
				});

				$newBtn.find('span').text('우선순위 : ' + newCnt);
				$delBtn.find('span').text('삭제 : ' + delCnt);
				$holdBtn.find('span').text('보류 : ' + holdCnt);
				$reworkBtn.find('span').text('재확인 : ' + reworkCnt);
				$equalBtn.find('span').text('동일 : ' + equalCnt);
				$layerBtn.find('span').text('레이어 : ' + layerCnt);
				$popupBtn.find('span').text('팝업 : ' + popupCnt);
				$resultBtn.find('span').text('완료 : ' + resultCnt);
				$resultBtn_ex.find('span').text('미완 : ' + result_exCnt);
				$totalBtn.find('span').text('전체 : ' + totalCnt);
				$realBtn.find('span').text('전체 - 삭제 : ' + (totalCnt-delCnt));

				// var realPercent = Math.round((1-(result_exCnt/(totalCnt - delCnt)))*100);
				var realPercent = Math.floor((resultCnt/(totalCnt - delCnt))*100);
				$('.total_rate span').text("완료율 : " + realPercent +' % ');
			}

			//Calculator : 각 카테고리별 통계
			function calculator_cate(){
				var str = "<span class='info_calc' style='float: right; padding-right:10px;'> 0/0</span>"
				rMap.tab_title.append(str);
				$('.info_calc').each(function(){
					var $table = $(this).parent().parent().find('table > tbody')
					var _totleNum = $table.find('tr').size() -1;
					var _delNum = $table.find('tr.del').size() - 1;
					var totalNum = _totleNum - _delNum;
					var resultNum = 0;
					$table.find('tr td.rdate').each(function(index){
						var tdStr = String($(this).text());
						if(!tdStr || $(this).parent().hasClass('del')){
						} else {
							resultNum++;
						}
					});

					var percent = Math.round((resultNum/totalNum)*100);
					$(this).html(resultNum + ' / ' + '<strong style="color:#888">'+totalNum +'</strong> = ' + percent + '%');
				});
			}

			//EVENT
			function eventHandler(){
				//신규 버튼
				$newBtn.on('click', function(){
					TR_select_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//삭제 버튼
				$delBtn.on('click', function(){
					TR_select_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//보류 버튼
				$holdBtn.on('click', function(){
					TR_select_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//재확인 버튼
				$reworkBtn.on('click', function(){
					TR_select_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//동일 버튼
				$equalBtn.on('click', function(){
					TR_select_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//레이어 버튼
				$layerBtn.on('click', function(){
					TR_select_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//팝업 버튼
				$popupBtn.on('click', function(){
					TR_select_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//완료 버튼
				$resultBtn.on('click', function(){
					TR_result_cnt($(this), true);
					ColorBox.resetModule();
					return false;
				});
				//미완료 버튼
				$resultBtn_ex.on('click', function(){
					TR_result_cnt($(this), false);
					ColorBox.resetModule();
					return false;
				});
				//전체 버튼
				$totalBtn.on('click', function(){
					FNbtn_reset($(this));
					FNtotal_cnt($(this));
					ColorBox.resetModule();
					return false;
				});
				//삭제 제외 버튼
				$realBtn.on('click', function(){
					FNbtn_reset($(this));
					// 재졍렬
					if(sortType){
						$contentTR.each(function(index){
							if($(this).hasClass('del')) $(this).hide();
							else $("td:first-child", $(this)).text(cnt++);
						});
					}else{
						FNtotal_cnt($(this));
						$content.find('tr.del').hide();
					}
					ColorBox.resetModule();
					return false;
				});

				//초기 전체 활성화
			}

			var initModule = function(){
				calculator();
				calculator_cate();
				eventHandler();
				$realBtn.trigger('click');
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* init
		* --------------------------------------
		*/
		var initModule = function(){
			Layout.initModule();
			Nav.initModule();
			HeaderFolding.initModule();
			Quick.initModule();
			Filter.initModule();
		}

		return {
			initModule : initModule
		}
	})().initModule();

});