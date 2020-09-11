Components.utils.import("resource://gre/modules/Services.jsm");

var DownloadBarOpt = {
	load: function() {
	
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		switch(Services.appinfo.name) {
		case "Thunderbird":
			DownloadBarOpt.windowtype = "mail:3pane";
			break;
		case "Fennec": break;
		default: //"Firefox", "SeaMonkey"
			DownloadBarOpt.windowtype = "navigator:browser";
		}

		this.domformscolor=brnch.getBoolPref("dom.forms.color");
		brnch.setBoolPref("dom.forms.color",true);
	
		let appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
		.getService(Components.interfaces.nsIXULAppInfo);
		let versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
		.getService(Components.interfaces.nsIVersionComparator);
		if(versionChecker.compare(appInfo.version,"27") >= 0) {
			DownloadBarOpt.isLater27=true;
		}
		if(versionChecker.compare(appInfo.version,"28") >= 0 && versionChecker.compare(appInfo.version,"29") < 0) {
			DownloadBarOpt.is28=true;
		}

		let p=brnch.getCharPref("extensions.downloadbar.viruscanpath");
		if(p!=""){
			let prefs = Components.classes["@mozilla.org/preferences-service;1"].
						getService(Components.interfaces.nsIPrefService).
						getBranch("extensions.downloadbar.")
			let viruscanpath=prefs.getComplexValue("viruscanpath", Components.interfaces.nsIFile).path;		
			document.getElementById('downloadbar-opt-vrsscnpath').value=viruscanpath;
		}
		document.getElementById('downloadbar-opt-vrsscnbtn').addEventListener("command",DownloadBarOpt.lct,false);
		
		document.getElementById('downloadbar-opt-tmtcvrsscan').addEventListener("command",DownloadBarOpt.tggleTmtcScn,false);
		document.getElementById('downloadbar-opt-tmtcvrsscan').checked=brnch.getBoolPref("extensions.downloadbar.automaticviruscan");		
		
		document.getElementById('downloadbar-opt-clrftrlnch').addEventListener("command",DownloadBarOpt.tggleClrFtrLnch,false);
		document.getElementById('downloadbar-opt-clrftrlnch').checked=brnch.getBoolPref("extensions.downloadbar.clearafterlaunch");
		
		document.getElementById('downloadbar-opt-clrftrshwfl').addEventListener("command",DownloadBarOpt.tggleClrFtrShwFl,false);
		document.getElementById('downloadbar-opt-clrftrshwfl').checked=brnch.getBoolPref("extensions.downloadbar.clearaftershowfile");
		
		document.getElementById('downloadbar-opt-atpndwnldtb').addEventListener("command",DownloadBarOpt.tggleATPnDwnldTb,false);
		document.getElementById('downloadbar-opt-atpndwnldtb').checked=brnch.getBoolPref("extensions.downloadbar.autoopendownloadtab");
		
		document.getElementById('downloadbar-opt-atclnwhnffqt').addEventListener("command",DownloadBarOpt.tggleATClnWhnFFQt,false);
		document.getElementById('downloadbar-opt-atclnwhnffqt').checked=brnch.getBoolPref("extensions.downloadbar.autocleancompletedonquit");
		
		document.getElementById('downloadbar-opt-skcnfrmtnbfrdlt').addEventListener("command",DownloadBarOpt.tggleAskBfrDltngDwnldFl,false);
		document.getElementById('downloadbar-opt-skcnfrmtnbfrdlt').checked=brnch.getBoolPref("extensions.downloadbar.askconfirmationbeforedelete");
		
		document.getElementById('downloadbar-opt-cntndwnldswhnbrwsrqts').addEventListener("command",DownloadBarOpt.tggleCntnDwnldsWhnBrwrsQts,false);
		document.getElementById('downloadbar-opt-cntndwnldswhnbrwsrqts').checked=brnch.getBoolPref("extensions.downloadbar.continuedownloadsonquit");

		if(brnch.getCharPref("extensions.downloadbar.doubleclickaction")=="Launch") document.getElementById('downloadbar-opt-dblclckctn').selectedIndex=0;
		else if(brnch.getCharPref("extensions.downloadbar.doubleclickaction")=="Show File") document.getElementById('downloadbar-opt-dblclckctn').selectedIndex=1;
		document.getElementById('downloadbar-opt-dblclckctn').addEventListener("command",DownloadBarOpt.tgglDblClckCtn,false);
		
		document.getElementById('downloadbar-opt-bckgndclr').addEventListener("change",DownloadBarOpt.tggleDwnldBckgrndClr,false);
		if(brnch.getCharPref("extensions.downloadbar.downloadbackgroundcolor")!="null") document.getElementById('downloadbar-opt-bckgndclr').color=brnch.getCharPref("extensions.downloadbar.downloadbackgroundcolor");
				
		if(DownloadBarOpt.isLater27){
			let bckgndclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-bckgndclr-27')
			bckgndclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleDwnldBckgrndClr,false);
			if(brnch.getCharPref("extensions.downloadbar.downloadbackgroundcolor")!="null"){
				bckgndclrnptclrpckr27.classList.remove("dsbselectcolor");
				bckgndclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.downloadbackgroundcolor");
			}
			else{
				bckgndclrnptclrpckr27.value="#FF0000";
				bckgndclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-bckgndclr').parentNode.appendChild(bckgndclrnptclrpckr27);
			document.getElementById('downloadbar-opt-bckgndclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-dwnlprgrssclr').addEventListener("change",DownloadBarOpt.tggleDwnldPrgrssClr,false);
		if(brnch.getCharPref("extensions.downloadbar.downloadprogresscolor")!="null")document.getElementById('downloadbar-opt-dwnlprgrssclr').color=brnch.getCharPref("extensions.downloadbar.downloadprogresscolor");
				
		if(DownloadBarOpt.isLater27){
			let dwnlprgrssclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-dwnlprgrssclr-27')
			dwnlprgrssclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleDwnldPrgrssClr,false);
			if(brnch.getCharPref("extensions.downloadbar.downloadprogresscolor")!="null"){
				dwnlprgrssclrnptclrpckr27.classList.remove("dsbselectcolor");
				dwnlprgrssclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.downloadprogresscolor");
			}
			else{
				dwnlprgrssclrnptclrpckr27.value="#FF0000";
				dwnlprgrssclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-dwnlprgrssclr').parentNode.appendChild(dwnlprgrssclrnptclrpckr27);
			document.getElementById('downloadbar-opt-dwnlprgrssclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-dwnldtxtclr').addEventListener("change",DownloadBarOpt.tggleDwnldTxtClr,false);
		if(brnch.getCharPref("extensions.downloadbar.downloadtextcolor")!="null") document.getElementById('downloadbar-opt-dwnldtxtclr').color=brnch.getCharPref("extensions.downloadbar.downloadtextcolor");
				
		if(DownloadBarOpt.isLater27){
			let dwnldtxtclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-dwnldtxtclr-27')
			dwnldtxtclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleDwnldTxtClr,false);
			if(brnch.getCharPref("extensions.downloadbar.downloadtextcolor")!="null"){
				dwnldtxtclrnptclrpckr27.classList.remove("dsbselectcolor");
				dwnldtxtclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.downloadtextcolor");
			}
			else{
				dwnldtxtclrnptclrpckr27.value="#FF0000";
				dwnldtxtclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-dwnldtxtclr').parentNode.appendChild(dwnldtxtclrnptclrpckr27);
			document.getElementById('downloadbar-opt-dwnldtxtclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-dwncmpltclr').addEventListener("change",DownloadBarOpt.tggleDwnldCpmltClr,false);
		if(brnch.getCharPref("extensions.downloadbar.downloadcompletecolor")!="null") document.getElementById('downloadbar-opt-dwncmpltclr').color=brnch.getCharPref("extensions.downloadbar.downloadcompletecolor");
				
		if(DownloadBarOpt.isLater27){
			let dwncmpltclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-dwncmpltclr-27')
			dwncmpltclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleDwnldCpmltClr,false);
			if(brnch.getCharPref("extensions.downloadbar.downloadcompletecolor")!="null"){
				dwncmpltclrnptclrpckr27.classList.remove("dsbselectcolor");
				dwncmpltclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.downloadcompletecolor");
			}
			else{
				dwncmpltclrnptclrpckr27.value="#FF0000";
				dwncmpltclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-dwncmpltclr').parentNode.appendChild(dwncmpltclrnptclrpckr27);
			document.getElementById('downloadbar-opt-dwncmpltclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-dwnldpsclr').addEventListener("change",DownloadBarOpt.tggleDwnldPsClr,false);
		if(brnch.getCharPref("extensions.downloadbar.downloadpausecolor")!="null") document.getElementById('downloadbar-opt-dwnldpsclr').color=brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
				
		if(DownloadBarOpt.isLater27){
			let dwnldpsclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-dwnldpsclr-27')
			dwnldpsclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleDwnldPsClr,false);
			if(brnch.getCharPref("extensions.downloadbar.downloadpausecolor")!="null"){
				dwnldpsclrnptclrpckr27.classList.remove("dsbselectcolor");
				dwnldpsclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
			}
			else{
				dwnldpsclrnptclrpckr27.value="#FF0000";
				dwnldpsclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-dwnldpsclr').parentNode.appendChild(dwnldpsclrnptclrpckr27);
			document.getElementById('downloadbar-opt-dwnldpsclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-brbckgrndclr').addEventListener("change",DownloadBarOpt.tggleBrBckgrndClr,false);
		if(brnch.getCharPref("extensions.downloadbar.barbackgroundcolor")!="null") document.getElementById('downloadbar-opt-brbckgrndclr').color=brnch.getCharPref("extensions.downloadbar.barbackgroundcolor");
				
		if(DownloadBarOpt.isLater27){
			let brbckgrndclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-brbckgrndclr-27')
			brbckgrndclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleBrBckgrndClr,false);
			if(brnch.getCharPref("extensions.downloadbar.barbackgroundcolor")!="null"){
				brbckgrndclrnptclrpckr27.classList.remove("dsbselectcolor");
				brbckgrndclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.barbackgroundcolor");
			}
			else{
				brbckgrndclrnptclrpckr27.value="#FF0000";
				brbckgrndclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-brbckgrndclr').parentNode.appendChild(brbckgrndclrnptclrpckr27);
			document.getElementById('downloadbar-opt-brbckgrndclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-dwnbrdclr').addEventListener("change",DownloadBarOpt.tggleDwnldBrdrClr,false);
		if(brnch.getCharPref("extensions.downloadbar.downloadbordercolor")!="null") document.getElementById('downloadbar-opt-dwnbrdclr').color=brnch.getCharPref("extensions.downloadbar.downloadbordercolor");
		
		document.getElementById('downloadbar-opt-scnxcldfltyps').addEventListener("input",DownloadBarOpt.chngscandslfltyps,false);
		document.getElementById('downloadbar-opt-scnxcldfltyps').value=brnch.getCharPref("extensions.downloadbar.disablescanfor");
		
		document.getElementById('downloadbar-opt-vrsscnrgmnts').addEventListener("input",DownloadBarOpt.chngvrsscnrgmnts,false);
		document.getElementById('downloadbar-opt-vrsscnrgmnts').value=brnch.getCharPref("extensions.downloadbar.virusscanarguments");
		
		document.getElementById('downloadbar-opt-shwddnbrbttn').addEventListener("command",DownloadBarOpt.tgglddnbrbttn,false);
		document.getElementById('downloadbar-opt-shwddnbrbttn').checked=brnch.getBoolPref("extensions.downloadbar.showaddonbarbutton");
		
		document.getElementById('downloadbar-opt-clsbrwhndwnldscmplt').addEventListener("command",DownloadBarOpt.tgglbrwhndwnldcmplt,false);
		document.getElementById('downloadbar-opt-clsbrwhndwnldscmplt').checked=brnch.getBoolPref("extensions.downloadbar.autoclosebarwhendownloadscomplete");
		
		document.getElementById('downloadbar-opt-ttclsscnd').addEventListener("input",DownloadBarOpt.chngttclsscnd,false);;
		document.getElementById('downloadbar-opt-ttclsscnd').addEventListener("change",DownloadBarOpt.chngttclsscnd,false);;
		if(brnch.getIntPref("extensions.downloadbar.autoclosesecond")!=0) document.getElementById('downloadbar-opt-ttclsscnd').value=brnch.getIntPref("extensions.downloadbar.autoclosesecond");
		
		document.getElementById('downloadbar-opt-pnatmtcllyftrdwnld').addEventListener("command",DownloadBarOpt.tgglpnatmtcllyftrdwnld,false);
		document.getElementById('downloadbar-opt-pnatmtcllyftrdwnld').checked=brnch.getBoolPref("extensions.downloadbar.autoopendownloaddirectory");
		
		document.getElementById('downloadbar-opt-ttclrfltyps').addEventListener("input",DownloadBarOpt.chngttclnfltyps,false);;
		document.getElementById('downloadbar-opt-ttclrfltyps').value=brnch.getCharPref("extensions.downloadbar.autoclearfiletypes");
		
		document.getElementById('downloadbar-opt-ttclrscnd').addEventListener("input",DownloadBarOpt.chngttclrscnd,false);;
		document.getElementById('downloadbar-opt-ttclrscnd').addEventListener("change",DownloadBarOpt.chngttclrscnd,false);;
		document.getElementById('downloadbar-opt-ttclrscnd').value=brnch.getIntPref("extensions.downloadbar.autoclearsecond");
		
		let dop=brnch.getCharPref("extensions.downloadbar.audioplayerpath");
		if(dop!="") {
			let prefs = Components.classes["@mozilla.org/preferences-service;1"].
						getService(Components.interfaces.nsIPrefService).
						getBranch("extensions.downloadbar.")
			let audioplayerpath=prefs.getComplexValue("audioplayerpath", Components.interfaces.nsIFile).path;		
			document.getElementById('downloadbar-opt-doflpth').value=audioplayerpath;
			var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
			file.initWithPath(audioplayerpath);		
			if(file.exists()){
				var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
				document.getElementById("downloadbar-opt-doplyr").setAttribute("src",ioService.newFileURI(file).spec);			
			}
			else {
				brnch.setCharPref("extensions.downloadbar.audioplayerpath","");
				document.getElementById('downloadbar-opt-doflpth').value=document.getElementById("downloadbar-prprts").getString("dfltsnd");		
				document.getElementById("downloadbar-opt-doplyr").setAttribute("src","chrome://downloadbar/content/defaultNotification.wav");				
			}		
		}
		else {
			document.getElementById('downloadbar-opt-doflpth').value=document.getElementById("downloadbar-prprts").getString("dfltsnd");		
			document.getElementById("downloadbar-opt-doplyr").setAttribute("src","chrome://downloadbar/content/defaultNotification.wav");
		}	
		document.getElementById('downloadbar-opt-dofllct').addEventListener("command",DownloadBarOpt.dolct,false);
		
		document.getElementById('downloadbar-opt-plysndwhncdwnldcomlts').addEventListener("command",DownloadBarOpt.plysndwhncdwnldcomlts,false);
		document.getElementById('downloadbar-opt-plysndwhncdwnldcomlts').checked=brnch.getBoolPref("extensions.downloadbar.playsound");	

		document.getElementById('downloadbar-opt-slwstspdtxt').value=brnch.getIntPref("extensions.downloadbar.slowestbandwidth");
		document.getElementById('downloadbar-opt-slwstspdtxt').addEventListener("input",DownloadBarOpt.chnglwstspd,false);		
		document.getElementById('downloadbar-opt-slwstspdtxt').addEventListener("change",DownloadBarOpt.chnglwstspd,false);		
		document.getElementById('downloadbar-opt-slwstspdclr').addEventListener("change",DownloadBarOpt.tggleSlwstSpdClr,false);
		if(brnch.getCharPref("extensions.downloadbar.slowestbandwidthcolor")!="null") document.getElementById('downloadbar-opt-slwstspdclr').color=brnch.getCharPref("extensions.downloadbar.slowestbandwidthcolor");
				
		if(DownloadBarOpt.isLater27){
			let slwstspdclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-slwstspdclr-27')
			slwstspdclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleSlwstSpdClr,false);
			if(brnch.getCharPref("extensions.downloadbar.slowestbandwidthcolor")!="null"){
				slwstspdclrnptclrpckr27.classList.remove("dsbselectcolor");
				slwstspdclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.slowestbandwidthcolor");
			}
			else{
				slwstspdclrnptclrpckr27.value="#FF0000";
				slwstspdclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-slwstspdclr').parentNode.appendChild(slwstspdclrnptclrpckr27);
			document.getElementById('downloadbar-opt-slwstspdclr').hidden=true;
		}	

		document.getElementById('downloadbar-opt-vrgspdfrsttxtbxdsbld').value=brnch.getIntPref("extensions.downloadbar.slowestbandwidth");
		document.getElementById('downloadbar-opt-vrgspdfrsttxtbx').value=brnch.getIntPref("extensions.downloadbar.averagebandwidth");
		document.getElementById('downloadbar-opt-vrgspdfrsttxtbx').addEventListener("input",DownloadBarOpt.chngavrgspdfrst,false);	
		document.getElementById('downloadbar-opt-vrgspdfrsttxtbx').addEventListener("change",DownloadBarOpt.chngavrgspdfrst,false);	
		document.getElementById('downloadbar-opt-vrgspdfrstclr').addEventListener("change",DownloadBarOpt.tgglAvrgSpdFrstClr,false);
		if(brnch.getCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor")!="null") document.getElementById('downloadbar-opt-vrgspdfrstclr').color=brnch.getCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor");
				
		if(DownloadBarOpt.isLater27){
			let vrgspdfrstclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-vrgspdfrstclr-27')
			vrgspdfrstclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tgglAvrgSpdFrstClr,false);
			if(brnch.getCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor")!="null"){
				vrgspdfrstclrnptclrpckr27.classList.remove("dsbselectcolor");
				vrgspdfrstclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor");
			}
			else{
				vrgspdfrstclrnptclrpckr27.value="#FF0000";
				vrgspdfrstclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-vrgspdfrstclr').parentNode.appendChild(vrgspdfrstclrnptclrpckr27);
			document.getElementById('downloadbar-opt-vrgspdfrstclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-vrgspdscndtxtbxdsbld').value=brnch.getIntPref("extensions.downloadbar.averagebandwidth");
		document.getElementById('downloadbar-opt-vrgspdscndtxtbx').value=brnch.getIntPref("extensions.downloadbar.fastestbandwidth");
		document.getElementById('downloadbar-opt-vrgspdscndtxtbx').addEventListener("input",DownloadBarOpt.chngavrgspdscnd,false);	
		document.getElementById('downloadbar-opt-vrgspdscndtxtbx').addEventListener("change",DownloadBarOpt.chngavrgspdscnd,false);	
		document.getElementById('downloadbar-opt-vrgspdscndclr').addEventListener("change",DownloadBarOpt.tgglAvrgSpdScndClr,false);
		if(brnch.getCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor")!="null") document.getElementById('downloadbar-opt-vrgspdscndclr').color=brnch.getCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor");
				
		if(DownloadBarOpt.isLater27){
			let vrgspdscndclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-vrgspdscndclr-27')
			vrgspdscndclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tgglAvrgSpdScndClr,false);
			if(brnch.getCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor")!="null"){
				vrgspdscndclrnptclrpckr27.classList.remove("dsbselectcolor");
				vrgspdscndclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor");
			}
			else{
				vrgspdscndclrnptclrpckr27.value="#FF0000";
				vrgspdscndclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-vrgspdscndclr').parentNode.appendChild(vrgspdscndclrnptclrpckr27);
			document.getElementById('downloadbar-opt-vrgspdscndclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-fststtxtbxdsbld').value=brnch.getIntPref("extensions.downloadbar.fastestbandwidth");
		//document.getElementById('downloadbar-opt-fststtxtbxdsbld').addEventListener("input",DownloadBarOpt.chngfststspd,false);		
		document.getElementById('downloadbar-opt-fstsspdclr').addEventListener("change",DownloadBarOpt.tggleFststSpdClr,false);
		if(brnch.getCharPref("extensions.downloadbar.fastestbandwidthcolor")!="null") document.getElementById('downloadbar-opt-fstsspdclr').color=brnch.getCharPref("extensions.downloadbar.fastestbandwidthcolor");		
				
		if(DownloadBarOpt.isLater27){
			let fstsspdclrnptclrpckr27=DownloadBarOpt.crtInptClPckr27('downloadbar-opt-fstsspdclr-27')
			fstsspdclrnptclrpckr27.addEventListener("change",DownloadBarOpt.tggleFststSpdClr,false);
			if(brnch.getCharPref("extensions.downloadbar.fastestbandwidthcolor")!="null"){
				fstsspdclrnptclrpckr27.classList.remove("dsbselectcolor");
				fstsspdclrnptclrpckr27.value=brnch.getCharPref("extensions.downloadbar.fastestbandwidthcolor");
			}
			else{
				fstsspdclrnptclrpckr27.value="#FF0000";
				fstsspdclrnptclrpckr27.classList.add("dsbselectcolor");
			}
			document.getElementById('downloadbar-opt-fstsspdclr').parentNode.appendChild(fstsspdclrnptclrpckr27);
			document.getElementById('downloadbar-opt-fstsspdclr').hidden=true;
		}
		
		document.getElementById('downloadbar-opt-dwnclrrst').addEventListener("command",DownloadBarOpt.rstDwnldClr,false);		
		document.getElementById('downloadbar-opt-spdclrrst').addEventListener("command",DownloadBarOpt.rstSpdClr,false);		
		document.getElementById('downloadbar-opt-plysndrst').addEventListener("command",DownloadBarOpt.rstPlySnd,false);
		
		if(brnch.getCharPref("extensions.downloadbar.userinterface")=="bar") document.getElementById('downloadbar-opt-srntrfcrdgrp').selectedIndex=0;		
		else if(brnch.getCharPref("extensions.downloadbar.userinterface")=="panel") document.getElementById('downloadbar-opt-srntrfcrdgrp').selectedIndex=1;		
		
		document.getElementById('downloadbar-opt-dwnldbrrdio').addEventListener("command",DownloadBarOpt.srntrfcRdCmmd,false);		
		document.getElementById('downloadbar-opt-dwnldpnlrdio').addEventListener("command",DownloadBarOpt.srntrfcRdCmmd,false);		

		document.getElementById('downloadbar-opt-hdclrbttn').addEventListener("command",DownloadBarOpt.tgglhdclrbttn,false);
		document.getElementById('downloadbar-opt-hdclrbttn').checked=brnch.getBoolPref("extensions.downloadbar.hideclearbutton");

		document.getElementById('downloadbar-opt-hddwnldsbttn').addEventListener("command",DownloadBarOpt.tgglhddwnldsbttn,false);
		document.getElementById('downloadbar-opt-hddwnldsbttn').checked=brnch.getBoolPref("extensions.downloadbar.hidedownloadsbutton");

		document.getElementById('downloadbar-opt-dwnldtmwdth').value=brnch.getCharPref("extensions.downloadbar.downloaditemwidth");
		document.getElementById('downloadbar-opt-dwnldtmwdth').addEventListener("input",DownloadBarOpt.setWidth,false);
		document.getElementById('downloadbar-opt-dwnldtmwdth').addEventListener("change",DownloadBarOpt.setWidth,false);
		
		document.getElementById('downloadbar-opt-dwnldtmhght').value=brnch.getCharPref("extensions.downloadbar.downloaditemheight");
		document.getElementById('downloadbar-opt-dwnldtmhght').addEventListener("input",DownloadBarOpt.setHeight,false);
		document.getElementById('downloadbar-opt-dwnldtmhght').addEventListener("change",DownloadBarOpt.setHeight,false);
		
		if(brnch.getIntPref("extensions.downloadbar.filenamefontsize")!=0) document.getElementById('downloadbar-opt-flnmsz').value=brnch.getIntPref("extensions.downloadbar.filenamefontsize");
		else document.getElementById('downloadbar-opt-flnmsz').value=11;
		document.getElementById('downloadbar-opt-flnmsz').addEventListener("input",DownloadBarOpt.setFlNmFntSz,false);		
		document.getElementById('downloadbar-opt-flnmsz').addEventListener("change",DownloadBarOpt.setFlNmFntSz,false);		
				
		if(brnch.getIntPref("extensions.downloadbar.progressfontsize")!=0) document.getElementById('downloadbar-opt-prgrsssz').value=brnch.getIntPref("extensions.downloadbar.progressfontsize");
		else document.getElementById('downloadbar-opt-prgrsssz').value=11;		
		document.getElementById('downloadbar-opt-prgrsssz').addEventListener("input",DownloadBarOpt.setPrgrssFntSz,false);
		document.getElementById('downloadbar-opt-prgrsssz').addEventListener("change",DownloadBarOpt.setPrgrssFntSz,false);
		
		document.getElementById('downloadbar-opt-prgrssntfct').addEventListener("command",DownloadBarOpt.tggleShwPrgrssNtfctn,false);
		document.getElementById('downloadbar-opt-prgrssntfct').checked=brnch.getBoolPref("extensions.downloadbar.showprogressnotification");		
		
		document.getElementById('downloadbar-opt-spdntfct').addEventListener("command",DownloadBarOpt.tggleShwSpdNtfctn,false);
		document.getElementById('downloadbar-opt-spdntfct').checked=brnch.getBoolPref("extensions.downloadbar.showspeednotification");		
		
		document.getElementById('downloadbar-opt-tmntfct').addEventListener("command",DownloadBarOpt.tggleShwRmngTmNtfctn,false);
		document.getElementById('downloadbar-opt-tmntfct').checked=brnch.getBoolPref("extensions.downloadbar.showremainingtimenotification");
		
		if(brnch.getCharPref("extensions.downloadbar.progressnotificationalignment")=="horizontal") document.getElementById('downloadbar-opt-prgrsslngmntrdgrp').selectedIndex=0;		
		else if(brnch.getCharPref("extensions.downloadbar.progressnotificationalignment")=="vertical") document.getElementById('downloadbar-opt-prgrsslngmntrdgrp').selectedIndex=1;
		document.getElementById('downloadbar-opt-prgrsslngmntrdgrp').addEventListener("command",DownloadBarOpt.tgglPrgrssLggnmnt,false);

		if(brnch.getCharPref("extensions.downloadbar.buttontype")=="iconic") document.getElementById('downloadbar-opt-bttntyprdgrp').selectedIndex=0;		
		else if(brnch.getCharPref("extensions.downloadbar.buttontype")=="txticonic") document.getElementById('downloadbar-opt-bttntyprdgrp').selectedIndex=1;
		else if(brnch.getCharPref("extensions.downloadbar.buttontype")=="txt") document.getElementById('downloadbar-opt-bttntyprdgrp').selectedIndex=2;
		document.getElementById('downloadbar-opt-bttntyprdgrp').addEventListener("command",DownloadBarOpt.tgglBttnType,false);		
		
		if(DownloadBarOpt.is28) {
			var inputcolor=document.querySelectorAll("input[type='color']");
			for (var i=0;i<inputcolor.length;i++){
				inputcolor[i].classList.add("ff28");
				inputcolor[i].style.setProperty("background-color", inputcolor[i].value, "important");
			}
		}
	
	},
	tgglDblClckCtn:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.doubleclickaction",event.currentTarget.value);	
	},
	tgglPrgrssLggnmnt:function(event){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				if(stcks[i].getAttribute("downcompleted")!="true") {
					document.getElementById("downloadbar-ntfctnwrppr-"+stcks[i].id.replace("downloadbar-stack-","")).setAttribute("orient",event.currentTarget.value);
				}
			}	
		}		
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.progressnotificationalignment",event.currentTarget.value);	
	},
	tgglBttnType:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			document.getElementById("downloadsbar-mn").classList.remove("db"+brnch.getCharPref("extensions.downloadbar.buttontype"));
			document.getElementById("downloadsbar-mn").classList.add("db"+event.currentTarget.value);
			document.getElementById("downloadbar-bar-clrbttn").classList.remove("db"+brnch.getCharPref("extensions.downloadbar.buttontype"));
			document.getElementById("downloadbar-bar-clrbttn").classList.add("db"+event.currentTarget.value);
		}
		brnch.setCharPref("extensions.downloadbar.buttontype",event.currentTarget.value);		
	},	
	srntrfcRdCmmd:function(event){
		if(event.currentTarget.value=="bar"){
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							   .getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
			while(enumerator.hasMoreElements()) {
				let window = enumerator.getNext();
				let document=window.document;
				
				let stcks=document.getElementById("downloadbar-downloadpanel").getElementsByTagName("stack");
				for(var i=stcks.length-1;i>=0;i--){
					document.getElementById("downloadbar-bar-wrbx").insertBefore(stcks[i],document.getElementById("downloadbar-bar-wrbx").firstChild);
				}				
				
				if(document.getElementById("downloadbar-bar")) document.getElementById("downloadbar-bar").setAttribute("collapsed","false");
				if(document.getElementById("downloadbar-ddnbr")) document.getElementById("downloadbar-ddnbr").hidden=true;				
			}	
		}
		else if(event.currentTarget.value=="panel"){
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							   .getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
			while(enumerator.hasMoreElements()) {
				let window = enumerator.getNext();
				let document=window.document;
				
				let stcks=document.getElementById("downloadbar-bar-wrbx").getElementsByTagName("stack");
				for(var i=stcks.length-1;i>=0;i--){
					document.getElementById("downloadbar-downloadpanel").insertBefore(stcks[i],document.getElementById("downloadbar-downloadpanel").firstChild);
				}
				
				//if(document.getElementById("addon-bar").collapsed) window.toggleAddonBar();
				if(document.getElementById("downloadbar-bar")) document.getElementById("downloadbar-bar").setAttribute("collapsed","true");
				if(document.getElementById("downloadbar-ddnbr")) document.getElementById("downloadbar-ddnbr").hidden=false;		
			}	
		}		
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.userinterface",event.currentTarget.value);

		//mac bug fix
		if(Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS=="Darwin"){
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							   .getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
			while(enumerator.hasMoreElements()) {
				let window = enumerator.getNext();
				let document=window.document;
				
				try{DownloadBarOpt.dbcomp.DownloadBar.rmvDtlsPnl(document);}catch(e){}
				try{DownloadBarOpt.dbcomp.DownloadBar.appndDtlsPnl(document);}catch(e){}	
			}
		}
	},
	rstPlySnd:function(){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.audioplayerpath","");
		document.getElementById('downloadbar-opt-doflpth').value=document.getElementById("downloadbar-prprts").getString("dfltsnd");
		document.getElementById("downloadbar-opt-doplyr").setAttribute("src","chrome://downloadbar/content/defaultNotification.wav");		
		brnch.setBoolPref("extensions.downloadbar.playsound",false);
		document.getElementById('downloadbar-opt-plysndwhncdwnldcomlts').checked=false;		
	},
	rstDwnldClr:function(){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.downloadbackgroundcolor","null");
		brnch.setCharPref("extensions.downloadbar.downloadprogresscolor","null");
		brnch.setCharPref("extensions.downloadbar.downloadtextcolor","null");
		brnch.setCharPref("extensions.downloadbar.downloadcompletecolor","null");
		brnch.setCharPref("extensions.downloadbar.downloadpausecolor","null");
		brnch.setCharPref("extensions.downloadbar.barbackgroundcolor","null");
		brnch.setCharPref("extensions.downloadbar.downloadbordercolor","null");
		if(!DownloadBarOpt.isLater27){
			document.getElementById('downloadbar-opt-bckgndclr').color="";
			document.getElementById('downloadbar-opt-dwnlprgrssclr').color="";
			document.getElementById('downloadbar-opt-dwnldtxtclr').color="";
			document.getElementById('downloadbar-opt-dwncmpltclr').color="";
			document.getElementById('downloadbar-opt-dwnldpsclr').color="";
			document.getElementById('downloadbar-opt-brbckgrndclr').color="";
		}
		else{
			document.getElementById('downloadbar-opt-bckgndclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-dwnlprgrssclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-dwnldtxtclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-dwncmpltclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-dwnldpsclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-brbckgrndclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-bckgndclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-dwnlprgrssclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-dwnldtxtclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-dwncmpltclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-dwnldpsclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-brbckgrndclr-27').classList.add("dsbselectcolor");				
		}
		DownloadBarOpt.rstDwnldBckgrndClr();		
		DownloadBarOpt.rstDwnldPrgrssClr();		
		DownloadBarOpt.rstDwnldTxtClr();		
		DownloadBarOpt.rstDwnldCpmltClr();		
		DownloadBarOpt.rstDwnldPsClr();		
		DownloadBarOpt.rstBrBckgrndClr();		
	},
	rstSpdClr:function(){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.slowestbandwidthcolor","null");
		//brnch.setCharPref("extensions.downloadbar.averagebandwidthcolor","null");
		brnch.setCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor","null");
		brnch.setCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor","null");
		brnch.setCharPref("extensions.downloadbar.fastestbandwidthcolor","null");
		if(!DownloadBarOpt.isLater27){		
			document.getElementById('downloadbar-opt-slwstspdclr').color="";
			document.getElementById('downloadbar-opt-vrgspdfrstclr').color="";
			document.getElementById('downloadbar-opt-vrgspdscndclr').color="";
			document.getElementById('downloadbar-opt-fstsspdclr').color="";
		}
		else {		
			document.getElementById('downloadbar-opt-slwstspdclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-vrgspdfrstclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-vrgspdscndclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-fstsspdclr-27').value="#FF0000";
			document.getElementById('downloadbar-opt-slwstspdclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-vrgspdfrstclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-vrgspdscndclr-27').classList.add("dsbselectcolor");
			document.getElementById('downloadbar-opt-fstsspdclr-27').classList.add("dsbselectcolor");		
		}
	},	
	chngfststspd:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.fastestbandwidth",event.currentTarget.value);
		//document.getElementById('downloadbar-opt-vrgspdlbl').value=brnch.getIntPref("extensions.downloadbar.slowestbandwidth") + " KB - " +brnch.getIntPref("extensions.downloadbar.fastestbandwidth") + " KB" ;		
	},
	chnglwstspd:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.slowestbandwidth",event.currentTarget.value);
		//document.getElementById('downloadbar-opt-vrgspdlbl').value=brnch.getIntPref("extensions.downloadbar.slowestbandwidth") + " KB - " +brnch.getIntPref("extensions.downloadbar.fastestbandwidth") + " KB" ;
		document.getElementById('downloadbar-opt-vrgspdfrsttxtbxdsbld').value=event.currentTarget.value;
	},
	chngavrgspdfrst:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.averagebandwidth",event.currentTarget.value);
		//document.getElementById('downloadbar-opt-vrgspdlbl').value=brnch.getIntPref("extensions.downloadbar.slowestbandwidth") + " KB - " +brnch.getIntPref("extensions.downloadbar.fastestbandwidth") + " KB" ;
		document.getElementById('downloadbar-opt-vrgspdscndtxtbxdsbld').value=event.currentTarget.value;
	},
	chngavrgspdscnd:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.fastestbandwidth",event.currentTarget.value);
		//document.getElementById('downloadbar-opt-vrgspdlbl').value=brnch.getIntPref("extensions.downloadbar.slowestbandwidth") + " KB - " +brnch.getIntPref("extensions.downloadbar.fastestbandwidth") + " KB" ;
		document.getElementById('downloadbar-opt-fststtxtbxdsbld').value=event.currentTarget.value;
	},	
	tggleFststSpdClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.fastestbandwidthcolor",color);
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");
	},
	tggleSlwstSpdClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.slowestbandwidthcolor",color);
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");
	},
	tggleAvrgSpdClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.averagebandwidthcolor",color);
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");		
	},
	tgglAvrgSpdFrstClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor",color);
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");
	},
	tgglAvrgSpdScndClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor",color);
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");
	},	
	chngttclrscnd:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.autoclearsecond",event.currentTarget.value);	
	},	
	chngttclsscnd:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.autoclosesecond",event.currentTarget.value);	
	},
	chngttclnfltyps:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.autoclearfiletypes",event.currentTarget.value);	
	},
	tgglpnatmtcllyftrdwnld:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.autoopendownloaddirectory",event.currentTarget.checked);
	},
	plysndwhncdwnldcomlts:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.playsound",event.currentTarget.checked);
	},
	tgglbrwhndwnldcmplt:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.autoclosebarwhendownloadscomplete",event.currentTarget.checked);
	},
	tgglddnbrbttn:function(event){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			if(document.getElementById("downloadbar-ddnbr")) document.getElementById("downloadbar-ddnbr").hidden=!event.currentTarget.checked;				
		}	
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.showaddonbarbutton",event.currentTarget.checked);
	},
	tgglhdclrbttn:function(event){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			document.getElementById("downloadbar-bar-clrbttn").hidden=event.currentTarget.checked;				
		}	
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.hideclearbutton",event.currentTarget.checked);
	},
	tgglhddwnldsbttn:function(event){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			document.getElementById("downloadsbar-mn").hidden=event.currentTarget.checked;				
		}	
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.hidedownloadsbutton",event.currentTarget.checked);
	},
	chngscandslfltyps:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.disablescanfor",event.currentTarget.value);	
	},
	chngvrsscnrgmnts:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.virusscanarguments",event.currentTarget.value);	
	},
	tggleDwnldBrdrClr:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.downloadbordercolor",event.currentTarget.color);			
	},
	tggleDwnldCpmltClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.downloadcompletecolor",color);
		
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				if(stcks[i].getAttribute("downcompleted")=="true") {
					let hbx=document.getElementById("downloadbar-hbox-"+stcks[i].id.replace("downloadbar-stack-",""));
					hbx.style.setProperty("background-image", "linear-gradient(to bottom, "+DownloadBarOpt.convert2RGBA(color,0.59)+" 0%, "+DownloadBarOpt.convert2RGBA(color,1)+" 100%)", "important");
				}
			}	
		}
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");		
	},
	rstDwnldCpmltClr:function(){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				if(stcks[i].getAttribute("downcompleted")=="true") {
					let hbx=document.getElementById("downloadbar-hbox-"+stcks[i].id.replace("downloadbar-stack-",""));
					hbx.style.setProperty("background-image", "linear-gradient(to bottom,  #cdeb8e 0%,#a5c956 100%)", "important");
				}
			}	
		}		
	},
	tggleDwnldPsClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.downloadpausecolor",color);

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				if(stcks[i].getAttribute("paused")=="true") {
					let hbx=document.getElementById("downloadbar-hbox-"+stcks[i].id.replace("downloadbar-stack-",""));
					hbx.style.setProperty("background-image", "linear-gradient(to bottom, "+DownloadBarOpt.convert2RGBA(color,0.59)+" 0%, "+DownloadBarOpt.convert2RGBA(color,1)+" 100%)", "important");
				}
			}
		}
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");
	},
	rstDwnldPsClr:function(){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
		
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				if(stcks[i].getAttribute("paused")=="true") {
					let hbx=document.getElementById("downloadbar-hbox-"+stcks[i].id.replace("downloadbar-stack-",""));
					hbx.style.setProperty("background-image", "linear-gradient(to bottom,  #cdeb8e 0%,#a5c956 100%)", "important");
				}
			}
		}
	},
	tggleBrBckgrndClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;		
		brnch.setCharPref("extensions.downloadbar.barbackgroundcolor",color);	
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			document.getElementById("downloadbar-bar").style.setProperty("background-image", "linear-gradient(to bottom, "+ DownloadBarOpt.convert2RGBA(color,0.59) +" 0%, "+ DownloadBarOpt.convert2RGBA(color,1) +" 100%)", "important");				
			document.getElementById("downloadbar-bar").style.setProperty("background-size", "100% auto", "important");				
			document.getElementById("downloadbar-bar").style.setProperty("background-repeat", "no-repeat", "important");				
		}
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");		
	},
	rstBrBckgrndClr:function(event){	
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			document.getElementById("downloadbar-bar").style.removeProperty("background-image");				
			document.getElementById("downloadbar-bar").style.removeProperty("background-size");				
			document.getElementById("downloadbar-bar").style.removeProperty("background-repeat");				
		}		
	},	
	tggleDwnldTxtClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.downloadtextcolor",color);

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				let lbl=document.getElementById("downloadbar-label-"+stcks[i].id.replace("downloadbar-stack-",""));
				lbl.style.setProperty("color", color, "important");	
				if(document.getElementById("downloadbar-ntfctnwrppr-"+stcks[i].id.replace("downloadbar-stack-",""))) {
					document.getElementById("downloadbar-lbl-pgrss-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("color", color, "important");
					document.getElementById("downloadbar-lbl-speed-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("color", color, "important");
					document.getElementById("downloadbar-lbl-rmngtm-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("color", color, "important");
				}
			}	
		}
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");		
	},	
	rstDwnldTxtClr:function(){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				let lbl=document.getElementById("downloadbar-label-"+stcks[i].id.replace("downloadbar-stack-",""));
				lbl.style.setProperty("color", "#000000", "important");
				if(document.getElementById("downloadbar-ntfctnwrppr-"+stcks[i].id.replace("downloadbar-stack-",""))) {
					document.getElementById("downloadbar-lbl-pgrss-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("color", "#000000", "important");
					document.getElementById("downloadbar-lbl-speed-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("color", "#000000", "important");
					document.getElementById("downloadbar-lbl-rmngtm-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("color", "#000000", "important");
				}				
			}	
		}
	},
	tggleDwnldBckgrndClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;
		brnch.setCharPref("extensions.downloadbar.downloadbackgroundcolor",color);

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				stcks[i].style.removeProperty("background-color");	
				stcks[i].style.setProperty("background-image", "linear-gradient(to bottom, "+DownloadBarOpt.convert2RGBA(color,0.59)+" 0%, "+DownloadBarOpt.convert2RGBA(color,1)+" 100%)", "important");	
			}	
		}
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");
	},
	rstDwnldBckgrndClr:function(){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				stcks[i].style.setProperty("background-image", "linear-gradient(to bottom, rgba(255, 255, 255, 0.59) 0%, rgb(255, 255, 255) 100%)", "important");
				stcks[i].style.setProperty("background-color", "rgba(143,144,152,1)", "important");
			}	
		}
	},
	tggleDwnldPrgrssClr:function(event){
		event.currentTarget.classList.remove("dsbselectcolor");
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var color=event.currentTarget.color ? event.currentTarget.color : event.currentTarget.value;		
		brnch.setCharPref("extensions.downloadbar.downloadprogresscolor",color);

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				if(stcks[i].getAttribute("downcompleted")!="true" && stcks[i].getAttribute("paused")=="false") {
					let hbx=document.getElementById("downloadbar-hbox-"+stcks[i].id.replace("downloadbar-stack-",""));
					hbx.style.setProperty("background-image", "linear-gradient(to bottom, "+DownloadBarOpt.convert2RGBA(color,0.59)+" 0%, "+DownloadBarOpt.convert2RGBA(color,1)+" 100%)", "important");
				}
			}	
		}
		
		if(DownloadBarOpt.is28) event.currentTarget.style.setProperty("background-color", color, "important");
	},
	rstDwnldPrgrssClr:function(){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);		
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;
			
			let uiid=DownloadBarOpt.gtuiid();
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
			for(var i=0;i<stcks.length;i++){
				if(stcks[i].getAttribute("downcompleted")!="true" && stcks[i].getAttribute("paused")=="false") {
					let hbx=document.getElementById("downloadbar-hbox-"+stcks[i].id.replace("downloadbar-stack-",""));
					hbx.style.setProperty("background-image", "linear-gradient(to bottom,  #cdeb8e 0%,#a5c956 100%)", "important");
				}
			}	
		}
	},
	tggleClrFtrShwFl:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.clearaftershowfile",event.currentTarget.checked);	
	},
	tggleClrFtrLnch:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.clearafterlaunch",event.currentTarget.checked);	
	},
	tggleATPnDwnldTb:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.autoopendownloadtab",event.currentTarget.checked);	
	},
	tggleATClnWhnFFQt:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.autocleancompletedonquit",event.currentTarget.checked);	
	},
	tggleAskBfrDltngDwnldFl:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.askconfirmationbeforedelete",event.currentTarget.checked);	
	},
	tggleCntnDwnldsWhnBrwrsQts:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.continuedownloadsonquit",event.currentTarget.checked);	
	},
	tggleShwPrgrssNtfctn:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.showprogressnotification",event.currentTarget.checked);	
	},
	tggleShwSpdNtfctn:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.showspeednotification",event.currentTarget.checked);	
	},
	tggleShwRmngTmNtfctn:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.showremainingtimenotification",event.currentTarget.checked);	
	},
	tggleTmtcScn:function(event){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("extensions.downloadbar.automaticviruscan",event.currentTarget.checked);
		if(event.currentTarget.checked && document.getElementById('downloadbar-opt-vrsscnpath').value==""){
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
									.getService(Components.interfaces.nsIPromptService);
			var result = prompts.confirm(null, "Download Status Bar", document.getElementById("downloadbar-prprts").getString("vrscnnrlnfrst") + "\n" + document.getElementById("downloadbar-prprts").getString("vrscnnrlnsnd"));
			if(result){
				const nsIFilePicker = Components.interfaces.nsIFilePicker;
				var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
				fp.init(window, document.getElementById("downloadbar-prprts").getString("lctvrsscnnr") , nsIFilePicker.modeOpen);
				var rv = fp.show();
				if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
					var prefs = Components.classes["@mozilla.org/preferences-service;1"].
								getService(Components.interfaces.nsIPrefService).
								getBranch("extensions.downloadbar.");
					prefs.setComplexValue("viruscanpath", Components.interfaces.nsIFile, fp.file);
					document.getElementById('downloadbar-opt-vrsscnpath').value=fp.file.path;
				}			
			}
		}		
	},
	lct:function(){
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, document.getElementById("downloadbar-prprts").getString("lctvrsscnnr"), nsIFilePicker.modeOpen);
		var rv = fp.show();
		if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].
						getService(Components.interfaces.nsIPrefService).
						getBranch("extensions.downloadbar.");
			prefs.setComplexValue("viruscanpath", Components.interfaces.nsIFile, fp.file);
			document.getElementById('downloadbar-opt-vrsscnpath').value=fp.file.path;
		}			
	},
	dolct:function(){
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, document.getElementById("downloadbar-prprts").getString("lctaudiofl"), nsIFilePicker.modeOpen);
		var rv = fp.show();
		if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].
						getService(Components.interfaces.nsIPrefService).
						getBranch("extensions.downloadbar.");
			prefs.setComplexValue("audioplayerpath", Components.interfaces.nsIFile, fp.file);
			document.getElementById('downloadbar-opt-doflpth').value=fp.file.path;
			var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
			document.getElementById("downloadbar-opt-doplyr").setAttribute("src",ioService.newFileURI(fp.file).spec);
		}			
	},
	setWidth:function(){

		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.downloaditemwidth",document.getElementById("downloadbar-opt-dwnldtmwdth").value);	
	
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;

			let uiid;
			if(brnch.getCharPref("extensions.downloadbar.userinterface")=="bar") uiid="downloadbar-bar";
			else if(brnch.getCharPref("extensions.downloadbar.userinterface")=="panel") uiid="downloadbar-downloadpanel";
			
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");
			for(var i=-0;i<stcks.length;i++){
			
				let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				let dwbldtmwdth=brnch.getCharPref("extensions.downloadbar.downloaditemwidth");							
				stcks[i].style.setProperty("max-width", dwbldtmwdth+"px", "important");				

			}				
				
		}	
	
	},
	setFlNmFntSz:function(){

		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.filenamefontsize",document.getElementById("downloadbar-opt-flnmsz").value);	
	
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;

			let uiid;
			if(brnch.getCharPref("extensions.downloadbar.userinterface")=="bar") uiid="downloadbar-bar";
			else if(brnch.getCharPref("extensions.downloadbar.userinterface")=="panel") uiid="downloadbar-downloadpanel";
			
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");
			for(var i=-0;i<stcks.length;i++){
			
				let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				let flnmfntsz=brnch.getIntPref("extensions.downloadbar.filenamefontsize");							
				if(flnmfntsz!=0) document.getElementById("downloadbar-label-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("font-size", flnmfntsz+"px", "important");				

			}				
				
		}	
	
	},
	setPrgrssFntSz:function(){

		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setIntPref("extensions.downloadbar.progressfontsize",document.getElementById("downloadbar-opt-prgrsssz").value);	
	
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;

			let uiid;
			if(brnch.getCharPref("extensions.downloadbar.userinterface")=="bar") uiid="downloadbar-bar";
			else if(brnch.getCharPref("extensions.downloadbar.userinterface")=="panel") uiid="downloadbar-downloadpanel";
			
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");
			for(var i=-0;i<stcks.length;i++){
			
				let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				let pgrssfntsz=brnch.getIntPref("extensions.downloadbar.progressfontsize");
				if(stcks[i].getAttribute("downcompleted")!="true") {				
					if(pgrssfntsz!=0) document.getElementById("downloadbar-ntfctnwrppr-"+stcks[i].id.replace("downloadbar-stack-","")).style.setProperty("font-size", pgrssfntsz+"px", "important");
				}			
			}				
				
		}	
	
	},
	setHeight:function(){

		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setCharPref("extensions.downloadbar.downloaditemheight",document.getElementById("downloadbar-opt-dwnldtmhght").value);	
	
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						   .getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBarOpt.windowtype);			
		while(enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document=window.document;

			let uiid;
			if(brnch.getCharPref("extensions.downloadbar.userinterface")=="bar") uiid="downloadbar-bar";
			else if(brnch.getCharPref("extensions.downloadbar.userinterface")=="panel") uiid="downloadbar-downloadpanel";
			
			let stcks=document.getElementById(uiid).getElementsByTagName("stack");
			for(var i=-0;i<stcks.length;i++){
			
				let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				let dwbldtmhght=brnch.getCharPref("extensions.downloadbar.downloaditemheight");							
				stcks[i].style.setProperty("height", dwbldtmhght+"px", "important");				

			}				
				
		}	
	
	},
	gtuiid:function(){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		let uiid;
		if(brnch.getCharPref("extensions.downloadbar.userinterface")=="bar") uiid="downloadbar-bar";
		else if(brnch.getCharPref("extensions.downloadbar.userinterface")=="panel") uiid="downloadbar-downloadpanel";
		return uiid;
	},
	convert2RGBA:function(hex,opacity){
		hex = hex.replace('#','');
		let r = parseInt(hex.substring(0,2), 16);
		let g = parseInt(hex.substring(2,4), 16);
		let b = parseInt(hex.substring(4,6), 16);
		return 'rgba('+r+','+g+','+b+','+opacity+')';
	},
	unload:function(hex,opacity){
		let brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		brnch.setBoolPref("dom.forms.color",this.domformscolor);
	},
	crtInptClPckr27:function(id){
		let input=document.createElementNS("http://www.w3.org/1999/xhtml","input");
		input.setAttribute("type","color");
		input.setAttribute("id",id);
		input.setAttribute("value","");
		return input;
	},
	isLater27:false,
	is28:false,
	windowtype:"navigator:browser",
	dbcomp:	Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject
}
window.addEventListener("load",function(event){DownloadBarOpt.load();},false);
window.addEventListener("unload",function(event){DownloadBarOpt.unload();},false);