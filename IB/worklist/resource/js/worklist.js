/**
* WORKLIST
* --------------------------------------
* @version 2.0.4
* @author Goang
* ======================================
* @modify
* 	- 181213 : 테이블 뎁스별 접고 펼치기 기능,
*									: 비고란 한줄 이상 popup 처리
*									: 필터 버튼 삭제 여부 구분 소팅
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
* --9. exel > json & Table ::: http://shancarter.github.io/mr-data-converter/
* ======================================
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
				, tab_navList : $('li' , $('.tab_nav'))
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

			, isLocalStorage = $('html').hasClass('localstorage') ? true : false

			//네비게이션 로케이션
			, navMap ={
				overNum : -1
				, overNum2 : -1
				, overNum3 : -1
				, activeNum : allTabNum //초기 전체메뉴 활성화
				, activeNum2 : false
				, activeNum3 : false
			}
			//[DATA 관련]
			, dataMap ={
				Odata : {
					ARindex : [] //depths별 인덱스(Default :0)
					, ARcnt : [] //depths별 카운트(Default :0)
					, ARtxt : []
					, List : []
				}
				, Onum : {
					/*
					Len1 : [] //2Depths 수
					Pos2 : [] //2Depths 위치
					*/
				}
			}
			, setting ={
				depSize : 1 //th.depth 수
				, folding_depth : null //2~n 까지 폴딩 버튼 삽입(Default :2미만 안보임)
				, debug_mode :false
				, test_mode : true
			}
		;

		/**
		* Layout
		* --------------------------------------
		*/
		var Data = (function(){
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
					dataMap.Onum['Len'+i] = []; //각 Depths 수
					if(i > 1) dataMap.Onum['Pos'+i] = []; //각 Depths 위치
				}
			}

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

					var ARindex = dataMap.Odata.ARindex[i] = []
						, ARcnt = dataMap.Odata.ARcnt[i] = []
						, ARtxt = dataMap.Odata.ARtxt[i] = []
						, Olist = dataMap.Odata.List[i] = []
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
							if($(this).hasClass('path')){
								Olist2['link'] = $(cell).find('a').attr('href');//링크삽입
							}
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

			var transData = function(){
				console.log('\n\n[transData]================');

				var depNum = setting.depSize;

				rMap.tab_content.each(function(i){
					var ARindex = dataMap.Odata.ARindex[i]
						, ARcnt = dataMap.Odata.ARcnt[i]
						, Olist = dataMap.Odata.List[i]
						, tmp = {}
					;

					//Object Setting : dataMap.Onum
					dataMap.Onum.Len1[i] = Number(ARindex[ARindex.length-1][1]) +1;

					for(var o=2; o<=depNum; o++){
						//Object 초기화
						dataMap.Onum['Len'+o][i]= [];
						dataMap.Onum['Pos'+o][i]= [];

						tmp['cnt'+o] = 0;
						tmp['num'+o] = 0;
					}

					//Data Setting
					$(this).find('tbody >tr').each(function(ii, row){
							if($(this).hasClass('del')) return true;//삭제 제외

							for(var o=2; o<=depNum; o++){
								if(ARcnt[ii][o-1] == 0){//2Depths	: 첫번째 포지션 위치 저장
									dataMap.Onum['Pos'+o][i][tmp['cnt'+o]] = ii;
									tmp['cnt'+o]++;
									tmp['num'+o] = 0;
									$(this).data('first'+o, true);

									if(setting.test_mode) $(this).attr('data-first'+o, true); //추후 삭제 -------$$$$
								}
								tmp['num'+o]++;
								dataMap.Onum['Len'+o][i][tmp['cnt'+o]-1] = tmp['num'+o];
							}
					});
				});

				if(setting.test_mode){
					console.log(dataMap.Odata, 'dataMap.Odata')
					console.log(dataMap.Onum, 'dataMap.Onum')
				}
			}

			var initModule =function(){
				var_init();//변수 초기화 : Depths별 셋팅
				data_init(); //Table Data 초기화
				transData();//Table Data 변환
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* Layout
		* --------------------------------------
		*/
		var Layout = (function(){
			var appendLayout =function(_callback){
				var curIndex = 0;
					var tmpIndex = 0;
				var curIndex_sub = 0;
				//tabContent : 번호 자동 추가
				rMap.tab_content.find('tbody tr').each(function(index){
						$("td:first-child", $(this)).before("<td class='num' align='center'>"+ curIndex +"</td>");
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


			var event_loadLayerPopHandler = function(){
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
				// event_loadLayerPopHandler();//Load LayerPop 사용시
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

				// console.log(navMap.overNum, navMap.overNum2)

				$depth1_on.addClass('active').siblings().removeClass('active');
				$depth2_on.addClass('active').siblings().removeClass('active');

				var pb =31;
				if(_target == 'content' && is_fixed == false) pb = 0;
				$('.tab_nav > ul > li').css({'padding-bottom' : pb});
			}
			var _hide = function(){
				var pb =0;
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
							// navMap.overNum = navMap.activeNum;
							// _show('content');
							_hide()
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
								, $focusTarget = rMap.tab_content.eq(navMap.activeNum).find('tbody > tr')
							;
							FNfocusOut(); //기존 focus 삭제

							//Header 영역 Foldeing 여부에 따라 높이 설정 (??다시생각);
							var goTop = $focusTarget.eq(curIndex-1).addClass('focus').offset().top;
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

			var initModule = function(){
				tabNav_init();
				tabNavHandler();
				contentHandler();
			}

			return {
				initModule : initModule
			}
		})();

		/**
		* Table Folding
		* --------------------------------------
		*/
		var SideNav = (function(){
			var Onum = dataMap.Onum;

			var init = function(){
				var dep1Len = Number(dataMap.Onum.Len1.length) -1;
				var btnHtml = '<a href="javascript:void(0);" class="gnbOpenBtn"><i class="fa fa-fw fa-bars"></i><span class="blind">메뉴</span></a>'

				var gnbHtml = ''
						gnbHtml +='<div class="gnb">'
						gnbHtml +='		<div class="gnbHead">'
						gnbHtml +='			<div class="gnbTitle">'
						gnbHtml +='				<h2>'+$('#wrap').find('h1').html()+'</h2>'
						gnbHtml +='			</div>'
						gnbHtml +='			<div class="gnbOption">'
						gnbHtml +='			</div>'
						gnbHtml +='		</div>'

						gnbHtml +='		<div class="gnbBody">'
						gnbHtml +='			<div class="gnbNav">'
						gnbHtml +='				<ul class="menuWrap">'
						for(var i=0; i<= dep1Len; i++){
							var title01 = dataMap.Odata.ARtxt[i][0][0]
							gnbHtml +='				<li>'
							gnbHtml +='					<a href="javascript:void(0);">'+title01+'</a>'
							gnbHtml +='				</li>'
						}
						gnbHtml +='				</ul>'
						gnbHtml +='			</div>' //gnbNav

						gnbHtml +='			<div class="gnbCon">'
							//------------------------------------
							// Sub Depths insert
							//------------------------------------
						gnbHtml +='			</div>'//gnbCon
						gnbHtml +='		</div>'//gnbBody

						gnbHtml +='		<a href="javascript:void(0)" class="gnbCloseBtn"><i class="fa fa-close"></i></a>'//gnbBody
						gnbHtml +='</div>'//gnb

				$('body').prepend(gnbHtml)
				$('#wrap').prepend(btnHtml)

				subinit();
			}

			var subinit = function(){
				// console.log('subinit=====: '+Number(dataMap.Odata.ARtxt.length -1));
				var dep1Len = Number(dataMap.Odata.ARtxt.length -1);
				var gnbHtml = '';
				var depNum = setting.depSize;

				var tmpObj ={};

				var startTag = '<ul><li>'
				var endTag = '</li></ul>'

				console.log('dep1Len : '+dep1Len);
				console.log('depNum :'+depNum);

				for(var i=0; i<= dep1Len; i++){
					var title01 = dataMap.Odata.ARtxt[i][0][0];
					var dep2Len = Number(dataMap.Odata.ARtxt[i].length -1);

					for(var ii =1; ii < depNum; ii++){
						tmpObj['tTxt'+ii] =new Object();
						tmpObj['dTxt'+ii] =new Object();
						// tmpObj['cnt'+ii] =new Object();
					}

					gnbHtml +='<div class="conWrap">'
					gnbHtml +='	<h3 class="title_2dep">'+title01+'</h3>'
					gnbHtml +='	<ul class="menuWrap">'

					for(var j=0; j<= dep2Len; j++){
						var dTxt0 = dataMap.Odata.ARtxt[i][j]; //삭제(.del) 제외(중요)
						if(dTxt0 === "" || dTxt0 ===undefined || String(dTxt0) ==="undefined" || dTxt0 =="NaN"|| dTxt0==null){
							// console.log('삭제(.del) 제외(중요)')
							// return false;(xxx)
						}else{

							for(var jj =1; jj < depNum; jj++){
								tmpObj['dTxt'+jj] = dataMap.Odata.ARtxt[i][j][jj];

								if(tmpObj['tTxt'+jj] == tmpObj['dTxt'+jj]) tmpObj['dTxt'+jj] = ''
								else tmpObj['tTxt'+jj] = tmpObj['dTxt'+jj];
							}

							var title02 = ''
							// var tmpK = 0;

							for(var k =1; k < depNum; k++){
								console.log('li : '+dataMap.Odata.ARcnt[i][j][1])//dep2

								/*
								if(dataMap.Odata.ARcnt[i][j][1] !=0){
									var _htm = ''
									_htm = '<ul>'
									_htm += '	<li>'
									_htm += '		<span class="sdep"'+depNum+' style="padding-left:'+Number(10*k -10)+'px"'+tmpObj['dTxt'+k]+'</span>'

									title02 += (tmpObj['dTxt'+k]) ? _htm : ''
								}else{
									title02 += (tmpObj['dTxt'+k]) ? '<span class="sdep"'+depNum+' style="padding-left:'+Number(10*k -10)+'px">└ '+tmpObj['dTxt'+k]+'</span>' : ''
								}
								*/

								// tmpK = k

								// var _html = '<span class="step step'+k+'\" style="padding-left:'+Number(10*k -10)+'px">└ '+tmpObj['dTxt'+k]+'</span>'
								var _html = '<span class="step" data-cnt='+k+'\" style="padding-left:'+Number(10*k -10)+'px">└ '+tmpObj['dTxt'+k]+'</span>'
								title02 += (tmpObj['dTxt'+k]) ? _html : ''
							}

							/*
							title02 += (dTxt1) ? '<span class="sdep2" style="padding-left:0px">'+dTxt1+'</span>' : ''
							title02 += (dTxt2) ? '<span class="sdep3" style="padding-left:0px">'+'└ ' +dTxt2+'</span>' : ''
							title02 += (dTxt3) ? '<span class="sdep4" style="padding-left:10px">'+'└ ' +dTxt3+'</span>' : ''
							title02 += (dTxt4) ? '<span class="sdep5" style="padding-left:20px">'+'└ ' +dTxt4+'</span>' : ''
							title02 += (dTxt5) ? '<span class="sdep6" style="padding-left:30px">'+'└ ' +dTxt5+'</span>' : ''
							*/

							gnbHtml +='		<li>'
							gnbHtml +='			<a href="javascript:void(0);">'+title02+'</a>'
							gnbHtml +='		</li>'
						}

					}//End of dep2Len

					gnbHtml +='	</ul>'
					gnbHtml +='</div>' //gnbConWrap

				}//End of dep1Len

				$('.gnbCon').append(gnbHtml);

				// console.log('thisClass : '+thisClass)
				//reWrap
				$('.step').each(function(){
					var thisData = $(this).attr('data-cnt')
					$(this).removeAttr('class').parent().parent().attr('data-cnt', thisData);
				});


			}


			var subinit_ORI = function(){
				// console.log('subinit=====: '+Number(dataMap.Odata.ARtxt.length -1));
				var dep1Len = Number(dataMap.Odata.ARtxt.length -1);
				var gnbHtml = '';
				var depNum = setting.depSize;

				// var tmpObj ={}

				console.log('dep1Len : '+dep1Len)
				console.log('depNum :'+depNum);

				for(var i=0; i<= dep1Len; i++){
					var title01 = dataMap.Odata.ARtxt[i][0][0];
					// var dep2Len = Number(dataMap.Onum.Len1[i]-1);
					var dep2Len = Number(dataMap.Odata.ARtxt[i].length -1);
					// console.log('dep2Len : '+dep2Len)

					gnbHtml +='				<div class="conWrap">'
					gnbHtml +='					<h3 class="title_2dep">'+title01+'</h3>'
					gnbHtml +='					<ul class="menuWrap">'


					/*for(var ii <=1; ii < depNum; ii++){
						tmpObj['tTxt'+ii] =new Object();
						tmpObj['dTxt'+ii] =new Object();
					}*/

					var tTxt1 = '';
					var dTxt1 = '';
					var tTxt2 = '';
					var dTxt2 = '';
					var tTxt3 = '';
					var dTxt3 = '';
					var tTxt4 = '';
					var dTxt4 = '';
					var tTxt5 = '';
					var dTxt5 = '';

					for(var j=0; j<= dep2Len; j++){
						var dTxt0 = dataMap.Odata.ARtxt[i][j]; //삭제(.del) 제외(중요)
						if(dTxt0 === "" || dTxt0 ===undefined || String(dTxt0) ==="undefined" || dTxt0 =="NaN"|| dTxt0==null){
							// console.log('삭제(.del) 제외(중요)')
							// return false;
						}else{

							dTxt1 = dataMap.Odata.ARtxt[i][j][1];
							dTxt2 = dataMap.Odata.ARtxt[i][j][2];
							dTxt3 = dataMap.Odata.ARtxt[i][j][3];
							dTxt4 = dataMap.Odata.ARtxt[i][j][4];
							dTxt5 = dataMap.Odata.ARtxt[i][j][5];

							if(tTxt1 == dTxt1) dTxt1 = ''
							else tTxt1 = dTxt1;

							if(tTxt2 == dTxt2) dTxt2 = ''
							else tTxt2 = dTxt2;

							if(tTxt3 == dTxt3) dTxt3 = ''
							else tTxt3 = dTxt3;

							if(tTxt4 == dTxt4) dTxt4 = ''
							else tTxt4 = dTxt4;

							if(tTxt5 == dTxt5) dTxt5 = ''
							else tTxt5 = dTxt5;



							var title02 = ''
								title02 += (dTxt1) ? '<span class="sdep2" style="padding-left:0px">'+dTxt1+'</span>' : ''
								title02 += (dTxt2) ? '<span class="sdep3" style="padding-left:0px">'+'└ ' +dTxt2+'</span>' : ''
								title02 += (dTxt3) ? '<span class="sdep4" style="padding-left:10px">'+'└ ' +dTxt3+'</span>' : ''
								title02 += (dTxt4) ? '<span class="sdep5" style="padding-left:20px">'+'└ ' +dTxt4+'</span>' : ''
								title02 += (dTxt5) ? '<span class="sdep6" style="padding-left:30px">'+'└ ' +dTxt5+'</span>' : ''
							;

							gnbHtml +='						<li>'
								gnbHtml +='							<a href="javascript:void(0);">'+title02+'</a>'
							gnbHtml +='						</li>'

						}
					}

					gnbHtml +='					</ul>'
					gnbHtml +='				</div>' //gnbConWrap
				}

				$('.gnbCon').append(gnbHtml);
			}

			var eventHandler = function(){
				//Gnb Open
				$('.gnbOpenBtn').on('click', function(){
					$('.gnb').addClass('on');
				});
					//Gnb Close
				$('.gnbCloseBtn').on('click', function(){
					$('.gnb').removeClass('on');
				});
			}

			var initModule =function(){
				init();
				eventHandler();
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* Table Folding
		* --------------------------------------
		*/
		var TableFolding = (function(){
			// console.log('TableFolding ====')

			//접고 펼치기 아이콘
			var icon_open = 'fa-plus-circle';
			var icon_close = 'fa-minus-circle';
			var foldHtml = '<a href="javascript:;" class="dep_fold_btn fr on"><i class="fa fa-sm fa-fw '+icon_close+'"</i></a>'
			var watchFolding = [];

			var init = function(){
				var depNum = setting.depSize -1;// 마지막 폴딩은 삭제

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
						var len = dataMap.Onum['Pos'+d][i].length;
						for(var ii = 0; ii < len; ii++){
							var trPos = Number(dataMap.Onum['Pos'+d][i][ii])+1;
							var trNum = Number(dataMap.Onum['Len'+d][i][ii]);
							var $tr = $(this).find('tr').eq(trPos);

							if(trNum > 1){//하위 메뉴가 하나 이상일 경우 버튼 삽입
								$tr.find('> td.depth'+d).append(foldHtml);
							}
						}
					}
				});
			}

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

			//tBody
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

			var eventHandler = function(){
				rMap.tab_content.find('h3 > .dep_fold_btn').on('click', function(){
					var $a= $(this);
					var $target = $a.parent().parent().find('table > tbody');

					$a.toggleClass('on');

					if($a.hasClass('on')){//펼치기 : + > -
						$a.find('i').removeClass(icon_open).addClass(icon_close);
						$target.show();
					}else{//접기 : - > +
						$a.find('i').removeClass(icon_close).addClass(icon_open);
						$target.hide();
					}
				});

				rMap.tab_content.find('thead th > .dep_fold_btn').on('click', function(e){
					headEventHandler($(e.currentTarget));
				});

				rMap.tab_content.find('tbody td > .dep_fold_btn').on('click', function(e){
					bodyEventHandler($(e.currentTarget));
				});
			}

			var initModule = function(){
				init();
				eventHandler();
			}

			return {
				initModule : initModule
			}
		})()


		/**
		* Header Folding
		* --------------------------------------
		* header 전체 폴딩
		* 1. IF top == 0
		* 	- 초기 close 상태
		* 	- localStorage : headerClose = true(Header Hide) , false (Header Show)
		* 2. IF top > 0
		* 	- 무조건 : close 상태
		*/
		var HeaderFolding =(function(){
			var $toggleBtn = Object;
			var fixedFlag = false; //스크롤시 fixed여부
			var headerT_Flag = true; //탑일경우 : true : open,  false : close
			var headerS_Flag = true;//true(접기), false(펼침)

			var appendLayout = function(){
				// Header CloseBtn Append
				rMap.info_section.append('<a href="javascript:void(0);" class="fixed_btn"><i class="fa fa-thumbtack"></i></a>');
				rMap.info_section.find('>div h2').append(' <a href="javascript:void(0);" class="close_btn"> - </a>');
				rMap.info_section.after('<div class="info_fold_btn"> <a href="javascript:void(0);"><span> Close </span></a> </div>');
				$toggleBtn = $('.info_fold_btn a');
			}


			function setHeader(){
				if(headerT_Flag){
					$toggleBtn.text('Open');
					// rMap.info_section.stop().slideUp(100);
					rMap.info_section.stop().hide();
				}else{
					$toggleBtn.text('Close');
					// rMap.info_section.stop().slideDown(200);
					rMap.info_section.stop().show();
				}
			}

			function setScrollHeader(){
				if(headerS_Flag){//접기
					$toggleBtn.text('Open');
					rMap.info_section.stop().hide();
				}else{//펼치기
					$toggleBtn.text('Close');
					rMap.info_section.stop().show();
				}
			}

			var eventHandler = function(){
				$toggleBtn.on('click', function(){
					if(rMap.body.hasClass('headerFloating') ) {// top > 0
						headerS_Flag = !headerS_Flag;
						setScrollHeader();
					} else {// top == 0
						headerT_Flag = !headerT_Flag;
						rMap.body.attr('data-headerClose', headerT_Flag);
						Util.setStorage('headerClose', headerT_Flag);
						setHeader();
					}
					return false;
				});

				// - 스크롤 IA 영역  HeadFix
				$(window).scroll(function(){
					winScroll = $(window).scrollTop();

					if(fixedFlag){
						return
					}

					if(winScroll > 1){
						headerS_Flag = true;// 스크롤시 무조건 접기
						setScrollHeader();
						rMap.body.addClass('headerFloating');
						rMap.content.css({'margin-top' : rMap.tab_nav.height() + 40});
						rMap.body.css({'padding-bottom' : rMap.tab_nav.height() + 82});
					} else {
						setHeader();
						rMap.body.removeClass('headerFloating');
						rMap.content.css({'margin-top' : 40});
					}
				}).scroll();


				// - info_section 각각 폴딩
				rMap.info_section.find('.close_btn').each(function(i){
					$(this).on('click', function(){
						$(this).closest('div').toggleClass('hide');
						if($(this).closest('div').hasClass('hide')) $(this).text(' + ');
						else $(this).text(' - ');
						return false;
					});
				});

				//fixedBtn
				$('.fixed_btn').on('click', function(){
					fixedFlag = !fixedFlag;
					$(this).toggleClass('on');
					setHeader();
					rMap.body.removeClass('headerFloating');
					rMap.content.css({'margin-top' : 40});
				})
			}


			//header 전체 폴딩 localStorage
			var localStorage = function(){
				/*if(!isLocalStorage) console.log('localstorage : 지원 안함');//로컬스토리지 지원 안할때
				else console.log('getStorage : '+Util.getStorage('headerClose')); */

				if(!isLocalStorage || Util.getStorage('headerClose') =='true'){
					headerT_Flag = true;
					// rMap.info_section.stop().slideUp('fast');
					rMap.info_section.stop().hide();
				}else{
					headerT_Flag = false;
					// rMap.info_section.stop().slideDown('fast')
					rMap.info_section.stop().show();;
				}
				tmp_Flag = headerT_Flag;
				setHeader();
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
					, curSize : isLocalStorage ? (Util.getStorage('curSize') ? Util.getStorage('curSize') : ($('body').data('resize') ? $('body').data('resize') : 1000 )) : 1000
					, resizeMode : isLocalStorage ? (Util.getStorage('resizeMode') ?Util.getStorage('resizeMode') : 'Resize') : 'Resize' // Resize, Fullsize
					, ARresize :[]
					, option : {width : '100%', height : $(window).height()- bottomGap, top : 0 }
					, autoID : 'autoID'
					, autoFlag : false
					// , saveResizeBtn : Object
					, saveResizeBtn : $('.'+cbVar.curSize)
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
						// if(Util.getStorage('resizeMode') == 'Resize'){
						if(cbVar.resizeMode == 'Resize'){
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
					var target = 'td.num span.number';
					var target_a = $(this).find('.num a');
					// var $pageID = $(this).find('.pid').text();
					var $pageName = $(this).find('.page').text();
					var goURL = $(this).find('.path a').attr('href');
					// var goURL = $(this).find('.path a').attr('href');

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

						// $(this).find(target).html("<a href="+goURL+" rel='"+cbVar.className+"' class='"+cbVar.className+"' title='"+$pageName+"'>"+$(this).find(target).text()+"</a>");
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
				// if(isLocalStorage){
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

				/*
				}else{

					cbVar.curSize = 320;
					cbVar.resizeMode = 'resizeMode';
					cbVar.option = {width : cbVar.curSize + cbVar.outerGap , height : $(window).height()- Number(cbVar.bottomGap_resize) , top : 0};
					cbVar.saveResizeBtn = $('.'+cbVar.curSize);
				}*/

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
				// , $realBtn = rMap.info_section.find('a.real') //전체 - 삭제

				, $searchBtn =$('input#id_search')

				, sortType = false //filter 버튼 클릭시 카운트 재졍렬 여부
				, cnt = 1
				, delFlag = 0
				, oldBtn //클릭한 버튼 저장
				, btnName = 'total' //전체 버튼 초기셋팅

				, totalCnt =0 //전체 갯수

				, qs= $searchBtn.quicksearch('.tab_contents_wrap tbody tr') //Search

				// , childOptionFlag = false // tr.child 옵션일 경우(1-1, 1-2)
				, firstAppendFlag = true //초기만 td.num html삽입 (total 갯수 Logic)

				, filterOptionObj = {
					delete : true
					, group : false
				}
			;


			//[filterOption] ===============================//1212
			var option_init = function(){
				filterOptionObj.delete = $('input[name="ch_del"]:checked').val() == "true" ? true : false;
				filterOptionObj.group = $('input[name="ch_group"]:checked').val() == "true" ? true : false;
				update();
			}

			//삭제 라디오 버튼
			$('input[name="ch_del"]').change(function(){
				filterOptionObj.delete = $(this).val() == "true" ? true : false;
				update();
			});

			//그룹
			$('input[name="ch_group"]').change(function(){
				filterOptionObj.group =  $(this).val() == "true" ? true : false;
				update();

				firstAppendFlag = true;
				$contentTR.find('td:first-child').remove()

				appendNumber()
				ColorBox.resetModule();
			});

			function update(){
				$('body').attr('data-childOption', filterOptionObj.group)// child Option일 경우 폰트 스타일
				calculator();
				reload();
			}

			function reload(){
				$('.'+btnName).trigger('click');
			}
			//[// End offilterOption] ===============================


			//전체 번호 삽입
			function appendNumber(){
				var tmpIndex = 0;
				var subIndex = 0;

				$contentTR.each(function(){
					if(filterOptionObj.group && $(this).hasClass('child')){
						totalCnt = tmpIndex;
						subIndex = subIndex +1;
						// if(firstAppendFlag) $("td:first-child", $(this)).before("<td class='num' align='center'><span class='number'>"+ totalCnt +'-'+subIndex+"</span></td>");//init
						if(firstAppendFlag) $('td:first-child', $(this)).before('<td class="num" align="center"><span class="number">'+ totalCnt +"-"+subIndex+'</span></td>');//init
					}else{
						totalCnt = tmpIndex+1;
						subIndex = 0;
						// if(firstAppendFlag) $("td:first-child", $(this)).before("<td class='num' align='center'>"+ totalCnt +"</td>");//init
						if(firstAppendFlag) $("td:first-child", $(this)).before('<td class="num" align="center"><span class="number">'+ totalCnt +'</span></td>');//init
						else $('td:first-child', $(this)).text(totalCnt);
						tmpIndex = totalCnt;
					}

					$(this).find('.num').prepend('<div class="infoBullet"><span class="del"></span><span class="equal"></span><span class="hold"></span><span class="rework"></span><span class="popup"></span><span class="new"></span></div>')
					// $(this).find('.num').prepend('<div class="infoBullet"><span class="del">aa</span></div>')
				});

				firstAppendFlag =false;
			}

			/*function appendNumber_ORI(){
				$contentTR.each(function(index){
					$("td:first-child", $(this)).text(index+1);
				});
			}*/

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
					, childCnt = 0
					// , totalCnt = 0
					, realPercent
				;

				totalCnt = 0; //전역에서 재정의

				$contentTR.each(function(index){
					//Child Group
					if(filterOptionObj.group && $(this).hasClass('child')) {
						childCnt++;
						return
					}

					var rdateTxtFlag = $(this).find('td.rdate').text() ? true : false;//완료
					var popTxtFlag = ($(this).find('td').text().search('팝') != -1 || $(this).find('td').text().search('popup') != -1) ? true : false;//팝업

					//Delete 포함
					if(filterOptionObj.delete){
						if($(this).hasClass('new')) newCnt++;
						if($(this).hasClass('del')) delCnt++;
						if($(this).hasClass('hold')) holdCnt++;
						if($(this).hasClass('rework')) reworkCnt++;
						if($(this).hasClass('equal')) equalCnt++;
						if($(this).hasClass('layer')) layerCnt++;

						if(rdateTxtFlag) resultCnt++;//완료
						else result_exCnt++//미완료

						if(popTxtFlag) {//팝업
							popupCnt++;
							$(this).addClass('popup');
						}

						totalCnt++;//전체
					}

					//Delete 제외
					else{
						if($(this).hasClass('del')){

						}else{
							if($(this).hasClass('new')) newCnt++;
							if($(this).hasClass('del')) delCnt++;
							if($(this).hasClass('hold')) holdCnt++;
							if($(this).hasClass('rework')) reworkCnt++;
							if($(this).hasClass('equal')) equalCnt++;
							if($(this).hasClass('layer')) layerCnt++;

							if(rdateTxtFlag) resultCnt++;//완료
							else result_exCnt++//미완료

							if(popTxtFlag) {//팝업
								popupCnt++;
								$(this).addClass('popup');
							}

							totalCnt++;//전체
						}
					}
				});

				//버튼 삽입
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
				// $realBtn.find('span').text('전체 - 삭제 : ' + realCnt);

				// var realPercent = Math.round((1-(result_exCnt/(totalCnt - delCnt)))*100);
				var realPercent = Math.round((resultCnt/(totalCnt))*100);
				$('.total_rate span').text("완료율 : " + realPercent +' % ');
			}

			//Calculator : 각 카테고리별 통계
			function calculator_cate(){
				var str = "<span class='info_calc' style='float: right; padding-right:10px;'> 0/0</span>"
				rMap.tab_title.append(str);
				$('.info_calc').each(function(){
					var $table = $(this).parent().parent().find('table > tbody')
					var _totalNum = $table.find('tr').size() -1;
					var _childNum = $table.find('tr.child').size();
					var _delNum = $table.find('tr.del').size() - 1;

					var totalNum = _totalNum - _delNum;
					if(filterOptionObj.group) totalNum = totalNum - _childNum;

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

			//Show
			function trShow($tr){
				$tr.removeClass('off');
			}

			//Hide
			function trHide($tr){
				$tr.addClass('off');
			}

			function eventReset($onBtn){
				$contentTR.addClass('off');//초기 숨김

				$contentTR.each(function(index){
					var rdateTxtFlag = $(this).find('td.rdate').text() ? true : false;//완료, 미완료

					//1.전체
					if(btnName =="total"){
						trShow($(this));//show
						if(filterOptionObj.delete){
						}	else{
							if($(this).hasClass('del')) trHide($(this));//hide
						}
						return
					}

					//2. 완료, 미완료
					if(btnName =="result" || btnName =="result_ex"){
						if(rdateTxtFlag){//완료
							if(btnName =="result"){
								trShow($(this));//show //Delete 포함
								if(! filterOptionObj.delete && $(this).hasClass('del')) 	trHide($(this));//hide //Delete 제외
							}
						} else{//미완료
							if(btnName =="result_ex"){
								trShow($(this));//Delete 포함
								if(! filterOptionObj.delete && $(this).hasClass('del')) trHide($(this));//Delete 제외
							}
						}
						return
					}

					//3.Etc BTN
					else{
						if($(this).hasClass(btnName)) trShow($(this));
						if(filterOptionObj.delete){//Delete 포함
							if($(this).hasClass('del') && $(this).hasClass(btnName)){
								trShow($(this));
							}
						}else{//Delete 제외
							if($(this).hasClass('del')){
								trHide($(this));
							}
						}
					}
				});
			}

			//EVENT
			function eventHandler(){
				var $targetBtns = $('.filter_btn .btn');

				$targetBtns.on('click', function(){
					//btns Reset
					var $onBtn = $(this);
					btnName= $onBtn.attr('class').split(' ')[0];
					$targetBtns.removeClass('on');
					$onBtn.addClass('on');

					eventReset($(this));
					ColorBox.resetModule();
					return false;
				});
			}

			var initModule = function(){
				option_init();
				appendNumber();//초기 넘버링
				calculator();
				calculator_cate();// 카테고리별 통계
				eventHandler();
				// $realBtn.trigger('click');//삭제 제외 버튼btnName ='del';
				$('.'+btnName).trigger('click');//삭제 제외 버튼
			}

			return {
				initModule : initModule
			}
		})();


		/**
		* Filter Button : IA Optional
		* --------------------------------------
		*/
		var tableOption =(function(){
			var etcPopHtml = ''
					// +'<div class="popArea"><div class="popWrap"><div class="popCon"></div></div></div>'
					+'<div class="popArea">'
					+'	<div class="popWrap">'
					+'		<div class="popHead">History'
					+'		</div>'
					+'		<div class="popCon">'
					+'		</div>'
					+'		<div class="popFoot">'
					+'		</div>'
					+'			<a href="javascript:void(0)" class="closeBtn"><i class="fa fa-times"></i></a>'
					+'	</div>'
					+'</div>'
				;

			$('body').append(etcPopHtml);
			$('body').append('<div class="dimmed"></div>')

			var $content = rMap.tab_content.find('tbody')
				, $contentTR = $content.find('tr')
				, $etcCell = $content.find('tr td.etc')
				, $etcDesc = $content.find('tr td.etc .desc')
				, $etcPop = $('.etcPop')
			;

			//비고
			var etcHandler = function(){
				var $focusObj = null;

				$etcCell.each(function(){
					var $desc = $(this).find('.desc');

					//비고란 한줄 이상일경우 popup
					if($desc.size() >1){
						$(this).data('etc', $(this).html());//데이터 저장

						$desc.eq(0).siblings().hide();//한줄 이상일 경우 hidden
						//버튼 삽입
						$(this).append('<a href="javascript:void(0)" class="moreBtn"><i class="fa fa-chevron-circle-right"></i></a>');
						var $btn = $(this).find('.moreBtn');
						var $pop = $('.popArea')
						var $popCon = $('.popArea .popCon')


						$(this).on({
							mouseover : function(){
								$(this).find('.moreBtn').addClass('on')
							}
							, mouseleave : function(){
								$(this).find('.moreBtn').removeClass('on')
							}
						})

						//Pop Open 이벤트
						$(this).find('.moreBtn').on('click', function(){
							$focusObj = $(this).closest('tr');
							$('body').addClass('popOn');
							$popCon.html($(this).parent().data('etc'))
							setTimeout(function(){
								$pop.addClass('motion')
							},60)
						});
						//Pop Close
						$(document).on('click', '.popOn .dimmed, .closeBtn', function(){
								$pop.removeClass('motion').addClass('motion_end')
								setTimeout(function(){
									$('body').removeClass('popOn');
									$pop.removeClass('motion_end');
									$focusObj.addClass('focus')
								},260)

						});
					}

				})

			}


			var initModule = function(){
				etcHandler();
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
			// Layout.initModule();

			Data.initModule();
			Nav.initModule();
			// SideNav.initModule();

			TableFolding.initModule();
			HeaderFolding.initModule();
			Quick.initModule();

			Filter.initModule();

			tableOption.initModule();

				//초기 보여지는 메뉴 -> 추후 set으로 변경
				rMap.tab_navList.eq(allTabNum).find('a').click();

			//화면 튐현상 방지
			rMap.content.css({'visibility' :'visible'});

		}

		return {
			initModule : initModule
		}
	})().initModule();

});