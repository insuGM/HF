/**
* worklist.include
* --------------------------------------
* @version 2.0.0
* @author Goang
* @modify 170310
*/


/**
* include
* --------------------------------------
*/

function inc_linkInfo(){
	var linkPath = '../../../';
	var linkPath_mo = '../../../App/';
	var getHost = location.host.split(':')[0];
	if(getHost =='10.2.22.51'){
		linkPath = 'http://'+getHost+':80/';
		linkPath_mo = 'http://'+getHost+':9090/';
		$('.asis_section').hide();
	}

	// if(location.protocol.substr(0,4) == "http"){
	// 	$('.asis_section').hide()
	// }


	var str='';
	str+='<h2>Link info.</h2>';
	str+='<table width="" summary="링크관련">';
	str+='<caption>링크관련</caption>';
	str+='<colgroup>';
	str+='	<col width="110px" />';
	str+='	<col width="auto" />';
	str+='</colgroup>';
	str+='<tbody>';
	str+='	<tr>';
	str+='		<th scope="row">Worklist</th>';
	str+='		<td class="tobe_section">';
	str+='			<div>';
	str+='				<a href="'+linkPath+'CMS/index.html" class="btn"><span>Star CMS</span></a>';
	str+='				<a href="'+linkPath+'GCMS/index.html" class="btn"><span>GCMS</span></a>';
	str+='				<a href="'+linkPath+'GCMS_FO/index.html" class="btn"><span>GCMS(branch)</span></a>';
	str+='				<a href="'+linkPath_mo+'index.html" class="btn"><span>스타기업뱅킹</span></a>';
	str+='				<a href="'+linkPath+'ADMIN/index.html" class="btn"><span>통합어드민</span></a>';
	str+='			</div>';
	str+='		</td>';
	str+='	</tr>';
	str+='	<tr>';
	str+='		<th scope="row">Guide</th>';
	str+='		<td class="guide_section">';
	str+='			<div>';
	str+='				<a href="'+linkPath+'CMS/project/@pub_guide/guide.html" class="btn"><span>Star CMS</span></a>';
	str+='				<a href="'+linkPath+'_DEMO/index.html" class="btn"><span>DEMO</span></a>';
	// str+='				<a href="'+linkPath+'GCMS/project/@pub_guide/guide.html" class="btn"><span>GCMS</span></a>';
	// str+='				<a href="'+linkPath+'GCMS_FO/project/@pub_guide/guide.html" class="btn"><span>GCMS(branch)</span></a>';
	// str+='				<a href="'+linkPath+'App/mobiz/app/@pub_guide/guide.html" class="btn"><span>스타기업뱅킹</span></a>';
	// str+='				<a href="'+linkPath+'ADMIN/project/@pub_guide/guide.html" class="btn"><span>통합어드민</span></a>';
	str+='			</div>';
	str+='		</td>';
	str+='	</tr>';
	//  AS-IS
	str+='	<tr>';
	str+='		<th scope="row">AS-IS</th>';
	str+='		<td class="asis_section">';
	str+='			<div>';
	str+='				<a href="../../../../02.Publish_Asis/CMS/index.html" class="btn"><span>KB Star BIZ</span></a>';
	str+='				<a href="../../../../02.Publish_Asis/App/index.html" class="btn"><span>스타기업뱅킹</span></a>';
	str+='				<a href="../../../../02.Publish_Asis/ADMIN/index.html" class="btn"><span>통합어드민</span></a>';
	str+='		</td>';
	str+='	</tr>';
	//  Dev
	/*str+='	<tr>';
	str+='		<th scope="row">Dev</th>';
	str+='		<td class="link_section">';
	str+='			<div>';
	str+='				<a href="https://dobiz.kbstar.com/quics?page=C019328#CPl" target="_blank" class="btn"><span>기업뱅킹</span></a>';
	str+='				<a href="https://docms.kbstar.com/quics?page=ocms&QSL=F#loading" target="_blank" class="btn"><span>KB Star CMS</span></a>';
	str+='				<a href="http://admin.kbstar.com/quics?page=B006012" target="_blank" class="btn"><span>통합어드민</span></a>';
	str+='		</td>';
	str+='	</tr>';*/
	str+='</tbody>';
	str+='</table>';
	document.write(str);
}


function inc_filter(){
	var str='';
	str+='		<h2>Filter.</h2>';
	str+='		<table width="" summary="퍼블리싱 문서 규격 및 크로스브라우징 관련">';
	str+='		<caption>문서 정보</caption>';
	str+='		<colgroup><col width="110px" /><col width="atuo" /></colgroup>';
	str+='		<tbody>';

	str+='			<tr>';
	str+='				<th rowspan="2"><span class="total_rate">&nbsp;<span></th>';
	str+='				<td class="filterOption">';
	str+='					<p><strong>* Delete :</strong>';
	str+='						<label><input type="radio" name="ch_del" id=del01 value="true"  /> 포함</label>';
	str+='						<label><input type="radio" name="ch_del" id="del02" value="false" checked/> 제외</label>';
	str+='					</p>';
	str+='					<p class="ml10"><strong>* Group :</strong>';
	str+='						<label><input type="radio" name="ch_group" id="gropu01" value="true" checked /> Yes</label>';
	str+='						<label><input type="radio" name="ch_group" id=gropu02 value="false"  /> No</label>';
	str+='					</p>';
	str+='				</td>';
	str+='			</tr>';

	str+='			<tr>';
	str+='				<td class="filter_btn">';
	str+='					<div><a href="javascript:void(0);" class="equal btn bullet" title="equal"><span>동일</span></a>';
	str+='					<a href="javascript:void(0);" class="hold btn bullet" title="hold"><span>보류</span></a>';
	str+='					<a href="javascript:void(0);" class="rework btn bullet" title="rework"><span>재확인</span></a>';
	// str+='					<a href="javascript:void(0);" class="layer btn bullet" title="layer"><span>레이어</span></a>';
	str+='					<a href="javascript:void(0);" class="popup btn bullet" title="popup"><span>팝업</span></a>';
	str+='					<a href="javascript:void(0);" class="new btn bullet" title="new"><span>우선</span></a></div>';
	str+='					<a href="javascript:void(0);" class="del btn bullet" title="del"><span>삭제</span></a>';
	str+='					<a href="javascript:void(0);" class="result btn bullet" title="result"><span>완료</span></a>';
	str+='					<a href="javascript:void(0);" class="result_ex btn bullet" title="result_ex"><span>미완</span></a>';
	str+='					<a href="javascript:void(0);" class="total btn bullet on" title="total"><span>Total</span></a>';
	// str+='					<a href="javascript:void(0);" class="real btn bullet" title="real"><span>삭제제외</span></a>';
	str+='				</td>';
	str+='			</tr>';

	str+='			<tr>';
	str+='				<th><label for="id_search">Search</label></th>';
	str+='				<td class="search">';
	str+='					<input type="text" name="search" value="" id="id_search" placeholder="Search" />';
	str+='				</td>';
	str+='			</tr>';
	str+='		</tbody>';
	str+='		</table>';
	document.write(str);
}

function inc_IAHead(){
	var str='';
	str+='<caption>작업 리스트</caption>';
	str+='<colgroup>';
	str+='	<col width="3%" /><!-- 번호 -->';
	str+='	<col class="depth2" style="width:12%" /><!-- L1 -->';
	str+='	<col class="depth3" style="width:10%" /><!-- L2 -->';
	str+='	<col class="depth4" style="width:10%" /><!-- L3 -->';
	str+='	<col class="depth5" style="width:10%" /><!-- L4 -->';
	str+='	<col class="depth6" style="width:10%" /><!-- L5 -->';
	str+='	<col class="pid" style="width:10%" /><!-- ID -->';
	str+='	<col class="pdir" style="width:5%" /><!-- Port -->';
	str+='	<col class="path" style="width:12%" /><!-- 경로 -->';
	// str+='	<col class="planner" style="width:4%" /><!-- 기획자 -->';
	str+='	<col class="svn" style="width:12%" /><!-- SVN -->';
	str+='	<col class="rdate" style="width:5%" /><!-- 등록 -->';
	// str+='	<col class="mdate" style="width:4%" /><!-- 수정 -->';
	// str+='	<col class="mdate" style="width:4%" /><!-- 기획검수 -->';
	str+='	<col class="etc" style="width:auto" /><!-- 비고 -->';
	str+='</colgroup>';
	str+='<thead>';
	str+='	<tr>';
	str+='		<th scope="col" class="num">번호</th>';
	str+='		<th scope="col" class="depth2">L1</th>';
	str+='		<th scope="col" class="depth3">L2</th>';
	str+='		<th scope="col" class="depth4">L3</th>';
	str+='		<th scope="col" class="depth5">L4</th>';
	str+='		<th scope="col" class="depth6">L5</th>';
	str+='		<th scope="col" class="pid">ID</th>';
	str+='		<th scope="col" class="port">Port</th>';
	str+='		<th scope="col" class="path">경로</th>';
	// str+='		<th scope="col" class="planner">기획자</th>';
	str+='		<th scope="col" class="svn">SVN</th>';
	str+='		<th scope="col" class="rdate">등록</th>';
	// str+='		<th scope="col" class="mdate">수정</th>';
	// str+='		<th scope="col" class="ptest">검수</th>';
	str+='		<th scope="col" class="etc">비고</th>';
	str+='	</tr>';
	str+='</thead>';
	document.write(str);
}
