	function setDLLinks(){
		var firefox="firefox-48.0";
		var thunderbird="thunderbird-45.2.0";
		var seamonkey="seamonkey-2.40";
		
		function getDownloadLink(product,os,locale){
			return "https://download.mozilla.org/?product="+product+"&os="+os+"&lang="+locale;
		}
		
		var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
		                           .getService(Components.interfaces.nsIXULRuntime);
		var os;
		if(xulRuntime.OS=="Darwin") os="osx";
		else if(xulRuntime.OS=="WINNT") os="win";
		else if(xulRuntime.OS=="Linux") os="linux";
		else os="linux";
		
		var locale=Components.classes["@mozilla.org/chrome/chrome-registry;1"]
			.getService(Components.interfaces.nsIXULChromeRegistry)
			.getSelectedLocale('global');
	
		document.getElementById("firefoxdllink").setAttribute("href",getDownloadLink(firefox,os,locale));
		document.getElementById("thunderbirddllink").setAttribute("href",getDownloadLink(thunderbird,os,locale));
		document.getElementById("seamonkeydllink").setAttribute("href",getDownloadLink(seamonkey,os,locale));
		
		document.getElementById("firefoxdllinkiconic").setAttribute("href",getDownloadLink(firefox,os,locale));
		document.getElementById("thunderbirddllinkiconic").setAttribute("href",getDownloadLink(thunderbird,os,locale));
		document.getElementById("seamonkeydllinkiconic").setAttribute("href",getDownloadLink(seamonkey,os,locale));		
	}	

	var langs = [
		"en-US",
		"en-GB",
		"fi-FI",
		"de",
		"it",
		"nl",
		"pl",
		"sv-SE",
		"zh-CN",
		"zh-TW",
		"pt-BR",
		"tr",
		"hu",
		"ro",
		"ja-JP",
		"ru",
		"fr",
		"mk-MK",
		"es-MX",
		"et"
	];
	
	function getCountry(locale){
		
		if(locale=="en-US") return "usa";
		else if(locale=="en-GB") return "united_kingdom";
		else if(locale=="fi-FI") return "suomi";
		else if(locale=="de") return "germany";
		else if(locale=="it") return "italy";
		else if(locale=="nl") return "netherlands";
		else if(locale=="pl") return "poland";
		else if(locale=="sv-SE") return "sweden";
		else if(locale=="zh-CN") return "china";
		else if(locale=="zh-TW") return "taiwan";
		else if(locale=="pt-BR") return "brasil";
		else if(locale=="tr") return "turkey";
		else if(locale=="hu") return "hungary";
		else if(locale=="ro") return "romania";
		else if(locale=="ja-JP") return "japan";
		else if(locale=="ru") return "russia";
		else if(locale=="fr") return "france";
		else if(locale=="mk-MK") return "macedonia";
		else if(locale=="es-MX") return "mexico";
		else if(locale=="et") return "estonia";

	}
	
	function getPlaceHolder() {
		return "✓ Supports Firefox 26, Firefox 28, Firefox Australis and Firefox 31\n✓ Supports Firefox 25, Firefox 24 ESR and Firefox 24 Before\n✓ Supports Pale Moon\n✓ Automatically close download bar when all downloads completed\n✓ Open download directory when the download is completed\n✓ Clear the download item after launching it\n✓ Clear the download item after showing file\n✓ Download Progress Color\n✓ Download Text Color\n✓ Manual Virus Scan\n✓ Automatic Virus Scan\n✓ Disable virus scan for certain file types\n✓ Double Click on download item will Launch the download file\n✓ Open Download Tab\n✓ Options reachable as Add-on Preferences in Tools / Add-ons / Download Status Bar\n✓ Last Clear will auto close Download Bar\n✓ Key to toggle Download Bar = CTRL + ALT + D for Windows / CMD + ALT + D for Mac\n✓ Go to Download Page\n✓ Copy Download Link\n✓ Download Complete Color\n✓ Play notification sound (supports .ogg, .wav, .mp3 file types)\n✓ Pause/Start/Cancel buttons\n✓ Delete File\n✓ Double click on empty bar space will auto clear completed download items\n✓ Download Speed Color + 4 customizable color\n✓ Download Background Color\n✓ Tools menu option to toggle Download Status Bar\n✓ Flexible Download items\n✓ Download width can be set to a fixed value\n✓ Wildcard support for Auto Clear\n✓ Reset Color Settings\n✓ Right click on empty bar space will show Add-on Menu\n✓ Left Click on download item will show download Information Panel\n✓ Auto Close for Wildcard Clear\n✓ Reset Settings for Notification Sound\n✓ Last Launch will auto close Download Bar\n✓ Last Show File will auto close Download Bar\n✓ Download Panel for Add-on Bar\n✓ Middle click on Download item will clear it\n✓ Clear Button\n✓ Progress percentage, Speed and Remaining time as Progress Notification can be customizable.\n✓ Flash Video Downloader support\n✓ Download Item Width & Height set\n✓ Auto open Download Tab when a Download starts\n✓ Hide Clear Button option\n✓ Mouseover on Download item will open Information Tooltip\n✓ Hide Downloads Button\n✓ Rename File\n✓ Pause All Downloads\n✓ Resume All Downloads\n✓ Cancel All Downloads\n✓ On the fly Option change feature\n✓ Previewing downloaded image files in Information Popup\n✓ Target entry in Information Popup shows File save location\n✓ Clicking Source entry in Information Popup opens it in New Tab\n✓ Clicking Target entry in Information Popup shows the Target file\n✓ Long Source entries are trimmed in Information Popup\n✓ Hovering Source and Target entries shows tooltip\n✓ Downloaded entry in Information Popup shows downloaded bytes\n✓ Preview completed Image files (supports PNG, GIF, JPG, BMP) in Information Popup\n✓ Clicking on preview image opens it in New Tab\n✓ Icons for Context Menus\n✓ Movable Panel can be pinned to Navigation Toolbar\n✓ Drag n Drop Download item will copy file into target folder\n✓ Privacy window support\n✓ Download Counter for Toolbar button\n✓ Porting downloads between Bar and Panel\n✓ Options Windows auto focus\n✓ Download Pause Color\n✓ Bar Background Color\n✓ Drag n Drop after Download complete\n✓ History feature. Download Status Bar will remember downloaded files across sessions.\n✓ Open Download Tab only utilizes one tab\n✓ Case insensitivity for file extensions\n✓ Gradient Color for Interface Elements (Download background, progress, complete, pause and speed color can be styled with a linear gradient rather than flat color)\n✓ Arguments for Virus Scanner\n✓ Delete File Warning\n✓ Bar Background Color now has gradient\n✓ Clean completed Downloads when Firefox quits\n✓ Progress Notifications (Progress, Speed and Remaining Time) can be shown/hidden\n✓ 4 color for Download Speed\n✓ Resume context option\n✓ Closing download bar automatically after specific time. This new option is placed above Auto Clear option in Options window.\n✓ MD5 Hash feature in Information Popup.\n✓ Preview for JPEG file.\n✓ \"Ask confirmation before deleting downloaded file\" option\n✓ Checksum Window to calculate MD5, MD2, SHA1, SHA256, SHA384, SHA512 and compare.\n✓ Statistics Page which is accessible from Add-on context menu\n✓ Vertical/Horizontal Progress Notifications\n✓ Font Size for File Name and Progress Notifications\n✓ Help Page contains full tutorial for Download Status Bar. (Right click Downloads button and select Help option from context menu to open up Help Page)\n✓ Rename Window Interface Update. (It is quicker to rename file now by separated File Name and Extension textboxes.)\n✓ Double Click functionality for Download Item can be set to either Launch or Show File via Options Window. It is placed under \"Ask confirmation before deleting downloaded file\".\n✓ Keyboard short-cut change via \"extensions.downloadbar.shortcutkey\" preference if you have a conflicting short-cut. You need to restart Firefox for the new short-cut.\n✓ \"Send to\" feature to send files to selected folders. Defaults are Desktop and Downloads directory and you can also chose another directory by Custom option.\n\n✓ Locale en-US\n✓ Locale fi-FI Finnish\n✓ Locale de German\n✓ Locale it Italian\n✓ Locale nl Dutch\n✓ Locale pl Polish\n✓ Locale sv-SE Swedish\n✓ Locale zh-CN Chinese (Simplified)\n✓ Locale zh-TW Chinese (Traditional)\n✓ Locale pt-BR Portuguese (Brazilian)\n✓ Locale tr Turkish\n✓ Locale hu Hungarian\n✓ Locale ro Romanian\n✓ Locale ja-JP Japanese\n✓ Locale ru Russian\n✓ Locale fr French\n✓ Locale mk-MK Macedonian";
	}
	
	document.addEventListener("DOMContentLoaded",function(event){
	
		setDLLinks();	

		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				   .getInterface(Components.interfaces.nsIWebNavigation)
				   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
				   .rootTreeItem
				   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				   .getInterface(Components.interfaces.nsIDOMWindow);	

		var sort=langs.sort();
		
		for(var i=0;i<sort.length;i++){
		
			var img=document.createElement("img");
			img.setAttribute("src","chrome://downloadbar/skin/flags/flag_"+getCountry(sort[i])+".png");
			img.setAttribute("locale",sort[i]);
			img.setAttribute("title",sort[i]+"  "+document.getElementById("downloadbar-hlpprprts").getString(sort[i]));
			img.addEventListener("click",function(event){
				var u1="https://addons.mozilla.org/";
				var u2=event.currentTarget.getAttribute("locale");
				var u3="/firefox/addon/download-status-bar/";
				var url=u1+u2+u3;
				mainWindow.gBrowser.selectedTab=mainWindow.gBrowser.addTab(url,{relatedToCurrent: true});
			},true);
			document.getElementById("flags").appendChild(img);

			var u1="https://addons.mozilla.org/";
			var u2=sort[i];
			var u3="/firefox/addon/download-status-bar/";
			var url=u1+u2+u3;			
			var anchor=document.createElement("a");
			anchor.setAttribute("class","amolink");			
			anchor.setAttribute("href",url);
			anchor.setAttribute("style","display:block;");
			anchor.setAttribute("locale",sort[i]);
			anchor.setAttribute("title",document.getElementById("downloadbar-hlpprprts").getString(sort[i]));
			anchor.textContent=sort[i]+" - "+document.getElementById("downloadbar-hlpprprts").getString(sort[i]);
			anchor.addEventListener("click",function(event){
				mainWindow.gBrowser.selectedTab=mainWindow.gBrowser.addTab(event.currentTarget.getAttribute("href"),{relatedToCurrent: true});
				event.preventDefault();
			},true);
			document.getElementById("anchors").appendChild(anchor);

		}
		
		var amo=document.querySelectorAll(".amo");
		var code="";
		for(var i=0;i<amo.length;i++){
			code+=amo[i].innerHTML+"\n\n";
		}
		
		//document.getElementById("code").parentNode.classList.remove("nodisplay");
		
		code=code.replace(/xmlns="http:\/\/www.w3.org\/1999\/xhtml"/g,"");
		code=code.replace(/<\/a><a  class="amolink"/g,'</a>\n<a  class="amolink"');
		code=code.replace(/<strong >/g,'<strong>');
		code=code.replace(/<b >/g,'<b>');		
		code=code.replace(/<i >/g,'<i>');
		code=code.replace(/<ul >/g,'<ul>');		
		code=code.replace(/<li><p>/g,'<li>');
		code=code.replace(/<\/p><\/li>/g,'</li>');
		code=code.replace(/\t/g,"").replace(/\n\n<ul>/g,"<ul>").replace(/<\/ul>\n\n/g,"</ul>");
		code=code.replace(/<b>==placeholder==<\/b>/g,getPlaceHolder());

		document.getElementById("code").value=code;
		
	},false);