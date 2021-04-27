const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Downloads.jsm");
Components.utils.import("resource://gre/modules/DownloadUtils.jsm");
Components.utils.import("resource://gre/modules/osfile.jsm");
Components.utils.import("resource://gre/modules/DownloadIntegration.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/ComponentUtils.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");


// ChromeUtils.defineModuleGetter(
// 	this,
// 	"ComponentUtils",
// 	"resource://gre/modules/ComponentUtils.jsm"
//   );

function DownloadBarComponent() {
}
DownloadBarComponent.prototype = {
	classID: Components.ID("{3291e159-f321-4a35-b5f0-1f750accd22d}"),
	contractID: "@downloadbar.com/bs;1",
	classDescription: "Download Bar Component",
	QueryInterface: ChromeUtils.generateQI([Components.interfaces.nsIObserver, Components.interfaces.nsISupportsWeakReference, Components.interfaces.nsISupports]),
	get wrappedJSObject() { return (this); },
	onDownloadAdded: function (download, isDownloadPrivate) {

		function convert2RGBA(hex, opacity) {
			hex = hex.replace('#', '');
			let r = parseInt(hex.substring(0, 2), 16);
			let g = parseInt(hex.substring(2, 4), 16);
			let b = parseInt(hex.substring(4, 6), 16);
			return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
		}

		let dl = download;

		let targetFile;
		let startTime;
		let totalBytes;
		let amountTransferred;
		let source;
		let referrer;
		let progress;

		if (this.ff26above) {
			targetFile = dl.target;
			startTime = (dl.startTime ? dl.startTime.getTime() : null);
			totalBytes = dl.totalBytes;
			amountTransferred = dl.currentBytes;
			source = dl.source.url;
			referrer = dl.source.referrerInfo ? dl.source.referrerInfo.computedReferrerSpec : null;
			progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
		}
		else {
			targetFile = dl.targetFile;
			startTime = dl.startTime / 1000;
			totalBytes = dl.size;
			amountTransferred = dl.amountTransferred;
			source = dl.source.spec;
			referrer = dl.referrer ? dl.referrer.spec : null;
			progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
		}

		let basename = OS.Path.basename(targetFile.path);
		let time;
		let dlid;

		if (dl.dsbid) {
			dlid = dl.dsbid;
		}
		else {
			time = new Date().getTime();
			let randomness = parseInt(Math.random() * new Date().getTime());
			if (this.ff26above) {
				dlid = randomness + "-" + time;
				dl.dsbid = dlid;
			}
			else {
				dlid = dl.guid;
				//dl.dsbid=dlid;
			}
		}

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(this.windowtype);
		while (enumerator.hasMoreElements()) {

			let window = enumerator.getNext();
			let document = window.document;

			try {
				Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
			} catch (e) {
				// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
			}
			if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
				PrivateBrowsingUtils.privacyContextFromWindow) {
				var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
				var isWindowPrivate = privacyContext.usePrivateBrowsing;
			} else {
				// older than Firefox 19 or couldn't get window.
				var privacyContext = null;
				var isWindowPrivate = false;
			}

			if (isWindowPrivate != isDownloadPrivate) continue

			let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

			let uiid;
			if (brnch.getCharPref("extensions.downloadbar.userinterface") == "bar") uiid = "downloadbar-bar";
			else if (brnch.getCharPref("extensions.downloadbar.userinterface") == "panel") uiid = "downloadbar-downloadpanel";

			if (document.getElementById("downloadbar-stack-" + dlid)) return;

			if (uiid == "downloadbar-bar" && document.getElementById(uiid).getAttribute("collapsed") == "true") document.getElementById(uiid).setAttribute("collapsed", "false");
			else if (uiid == "downloadbar-downloadpanel") {
				//if(document.getElementById("addon-bar").collapsed) window.toggleAddonBar();
				document.getElementById("downloadbar-bar").setAttribute("collapsed", "true");
				document.getElementById("downloadbar-ddnbr").hidden = false;
			}

			let stck = document.createXULElement("stack");
			stck.setAttribute("id", "downloadbar-stack-" + dlid);
			stck.setAttribute("class", "downloadbar-dwnldtmstck");
			//stck.setAttribute("maxwidth","150");
			stck.setAttribute("context", "downloadsbar-statusbar-menu");
			let dwnldbckgrndclr = brnch.getCharPref("extensions.downloadbar.downloadbackgroundcolor");
			if (dwnldbckgrndclr != "null") stck.setAttribute("style", "background-image:linear-gradient(to bottom, " + convert2RGBA(dwnldbckgrndclr, 0.59) + " 0%, " + convert2RGBA(dwnldbckgrndclr, 1) + " 100%) !important;background-size:100% auto;background-repeat:no-repeat;");
			else stck.setAttribute("style", "background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.59) 0%, rgb(255, 255, 255) 100%) ! important; background-size: 100% auto; background-repeat: no-repeat;background-color:rgba(143,144,152,1) !important;border:1px solid #98a7ad !important;");
			stck.setAttribute("tooltip", "downloadbar-itempanel");

			let dwbldtmwdth = brnch.getCharPref("extensions.downloadbar.downloaditemwidth");
			if (dwbldtmwdth != "null") stck.style.setProperty("max-width", dwbldtmwdth + "px", "important");

			let dwbldtmhght = brnch.getCharPref("extensions.downloadbar.downloaditemheight");
			if (dwbldtmhght != "null") stck.style.setProperty("height", dwbldtmhght + "px", "important");

			stck.setAttribute("flex", "1");
			stck.setAttribute("downcompleted", "false");
			stck.setAttribute("paused", "false");
			stck.setAttribute("sourceurl", source);
			stck.setAttribute("sourcereferrer", referrer);
			stck.addEventListener("dblclick", DownloadBar.stckdbclck, false);
			stck.addEventListener("click", DownloadBar.stckclck, false);

			let hbx = document.createXULElement("hbox");
			hbx.setAttribute("id", "downloadbar-hbox-" + dlid);
			hbx.setAttribute("flex", "1");
			hbx.setAttribute("align", "stretch");
			//hbx.setAttribute("right","150");

			let dpclr = brnch.getCharPref("extensions.downloadbar.downloadprogresscolor");
			if (dpclr == "null") hbx.setAttribute("style", "background-image: linear-gradient(to bottom,  #cdeb8e 0%,#a5c956 100%);background-size:0% auto;background-repeat:no-repeat;");
			else hbx.setAttribute("style", "background-image:linear-gradient(to bottom, " + convert2RGBA(dpclr, 0.59) + " 0%, " + convert2RGBA(dpclr, 1) + " 100%) !important;background-size:0% auto;background-repeat:no-repeat;");


			let vbx = document.createXULElement("hbox");
			vbx.setAttribute("id", "downloadbar-vbox-" + dlid);
			vbx.setAttribute("class", "downloadbar-dwnldtmhbx");
			vbx.setAttribute("align", "center");
			let i = document.createXULElement("image");
			i.setAttribute("src", "moz-icon://" + targetFile.path + "?size=16");
			i.setAttribute("width", "16");
			i.setAttribute("height", "16");
			let lbl = document.createXULElement("label");
			lbl.setAttribute("id", "downloadbar-label-" + dlid);
			lbl.setAttribute("value", basename + " - 0KB - 100%");
			lbl.setAttribute("crop", "end");
			lbl.setAttribute("flex", "1");
			lbl.setAttribute("style", "margin-right:0;");
			if (brnch.getIntPref("extensions.downloadbar.filenamefontsize") != 0) lbl.style.setProperty("font-size", brnch.getIntPref("extensions.downloadbar.filenamefontsize") + "px", "important");


			let lbl2 = document.createXULElement("label");
			lbl2.setAttribute("id", "downloadbar-lbl-pgrss-" + dlid);
			lbl2.setAttribute("value", "");
			lbl2.setAttribute("style", "margin:0;");
			lbl2.setAttribute("hidden", !brnch.getBoolPref("extensions.downloadbar.showprogressnotification"));

			let lbl3 = document.createXULElement("label");
			lbl3.setAttribute("id", "downloadbar-lbl-speed-" + dlid);
			lbl3.setAttribute("value", "");
			lbl3.setAttribute("style", "margin:0;");
			lbl3.setAttribute("hidden", !brnch.getBoolPref("extensions.downloadbar.showspeednotification"));

			let lbl4 = document.createXULElement("label");
			lbl4.setAttribute("id", "downloadbar-lbl-rmngtm-" + dlid);
			lbl4.setAttribute("value", "");
			lbl4.setAttribute("style", "margin:0;");
			lbl4.setAttribute("hidden", !brnch.getBoolPref("extensions.downloadbar.showremainingtimenotification"));

			let ntfctnwnppr;

			if (brnch.getCharPref("extensions.downloadbar.progressnotificationalignment") == "horizontal") {

				ntfctnwnppr = document.createXULElement("box");
				ntfctnwnppr.setAttribute("id", "downloadbar-ntfctnwrppr-" + dlid);
				ntfctnwnppr.setAttribute("orient", "horizontal");
				if (brnch.getIntPref("extensions.downloadbar.progressfontsize") != 0) ntfctnwnppr.style.setProperty("font-size", brnch.getIntPref("extensions.downloadbar.progressfontsize") + "px", "important");

			}

			else {

				ntfctnwnppr = document.createXULElement("box");
				ntfctnwnppr.setAttribute("id", "downloadbar-ntfctnwrppr-" + dlid);
				ntfctnwnppr.setAttribute("orient", "vertical");
				if (brnch.getIntPref("extensions.downloadbar.progressfontsize") != 0) ntfctnwnppr.style.setProperty("font-size", brnch.getIntPref("extensions.downloadbar.progressfontsize") + "px", "important");

			}

			ntfctnwnppr.appendChild(lbl4);
			ntfctnwnppr.appendChild(lbl3);
			ntfctnwnppr.appendChild(lbl2);


			let dtclr = brnch.getCharPref("extensions.downloadbar.downloadtextcolor");
			if (dtclr != "null") {
				lbl.style.setProperty("color", dtclr, "important");
				lbl.style.setProperty("margin-right", "0", "important");
				ntfctnwnppr.style.setProperty("color", dtclr, "important");
				ntfctnwnppr.style.setProperty("margin-right", "0", "important");
			}
			else {
				lbl.style.setProperty("color", "#000000", "important");
				lbl.style.setProperty("margin-right", "0", "important");
				ntfctnwnppr.style.setProperty("color", "#000000", "important");
				ntfctnwnppr.style.setProperty("margin-right", "2px", "important");
			}

			vbx.appendChild(i);
			vbx.appendChild(lbl);
			vbx.appendChild(ntfctnwnppr);
			stck.appendChild(hbx);
			stck.appendChild(vbx);
			if (uiid == "downloadbar-bar") document.getElementById(uiid + "-wrbx").appendChild(stck);
			else if (uiid == "downloadbar-downloadpanel") {
				if (!brnch.getBoolPref("extensions.downloadbar.insertdownloadattopoflist")) document.getElementById(uiid).appendChild(stck);
				else document.getElementById(uiid).insertBefore(stck, document.getElementById(uiid).firstChild);
			}
			//let stckWdth=parseInt(window.getComputedStyle(document.getElementById("downloadbar-stack-"+dlid),null).getPropertyValue("width"));	
			//document.getElementById("downloadbar-stack-"+dlid).setAttribute("right",stckWdth);

			stck.dl = dl;

			if (dl.succeeded) {
				let endTime = new Date().getTime();

				//document.getElementById("downloadbar-hbox-"+dlid).setAttribute("right","0");
				document.getElementById("downloadbar-label-" + dlid).setAttribute("value", basename);
				//document.getElementById("downloadbar-lbl-pgrss-"+dlid).setAttribute("value"," - 100%");
				document.getElementById("downloadbar-hbox-" + dlid).style.backgroundSize = 100 + "% auto";
				document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode.parentNode.removeChild(document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode);
				document.getElementById("downloadbar-stack-" + dlid).setAttribute("downcompleted", "true");
				document.getElementById("downloadbar-stack-" + dlid).addEventListener("dragstart", DownloadBar.drgstrt, false);

				document.getElementById("downloadbar-stack-" + dlid).setAttribute("endtime", endTime);

				if (document.getElementById("downloadbar-cntr")) {
					let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
					let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) + 1;
					document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
				}
			}

			if (dl.canceled) {
				let dpsclr = brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
				if (dpsclr == "null") { }
				else {
					hbx.style.setProperty("background-image", "linear-gradient(to bottom, " + convert2RGBA(dpsclr, 0.59) + " 0%, " + convert2RGBA(dpsclr, 1) + " 100%)", "important");
					hbx.style.setProperty("background-size", stck.dl.progress + "%", "important");
				}
			}

			if (document.getElementById("downloadbar-cntr")) {
				let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]) + 1;
				let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]);
				document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
			}

		}

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if (brnch.getBoolPref("extensions.downloadbar.autoopendownloadtab")) {
			function openAndReuseOneTabPerURL(url) {
				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var rwin = wm.getMostRecentWindow(this.windowtype);

				var found = false;

				var browserWin = rwin;
				var tabbrowser = browserWin.gBrowser;

				// Check each tab of this browser instance
				var numTabs = tabbrowser.browsers.length;
				for (var index = 0; index < numTabs; index++) {
					var currentBrowser = tabbrowser.getBrowserAtIndex(index);
					if (url == currentBrowser.currentURI.spec) {

						// The URL is already opened. Select this tab.
						tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];

						// Focus *this* browser-window
						browserWin.focus();

						found = true;
						break;
					}
				}

				// Our URL isn't open. Open it now.
				if (!found) {
					var recentWindow = rwin;
					if (recentWindow) {
						// Use an existing browser window
						//recentWindow.delayedOpenTab(url, null, null, null, null);
						rwin.gBrowser.selectedTab = rwin.gBrowser.addTab("about:downloads", { relatedToCurrent: true, triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });
					}
					else {
						// No browser windows are open, so open a new one.
						window.open(url);
					}
				}

			}

			openAndReuseOneTabPerURL("about:downloads");
		}

		if (isDownloadPrivate) return


		try {
			var hstry = JSON.parse(this.readJSON("history.json"));
		}
		catch (e) {
			this.writeJSON("history.json", "{}");
			var hstry = JSON.parse(this.readJSON("history.json"));
		}

		for (var h in hstry) {

			if (!hstry[h].succeeded && decodeURIComponent(hstry[h].target.path) == targetFile.path) {

				let exid = hstry[h].id;
				//delete hstry[hstry[h].id];

				var oldhstry = JSON.stringify(hstry);

				var tmpobjct = {};
				tmpobjct[h] = hstry[h];

				var tempentry = '"' + h + '":' + JSON.stringify(hstry[h]);

				var objct = {};
				objct[dlid] = {};
				objct[dlid].id = dlid;
				objct[dlid].target = { path: encodeURIComponent(targetFile.path) };
				objct[dlid].succeeded = dl.succeeded;
				objct[dlid].source = { url: encodeURIComponent(dl.source.url), referrer: encodeURIComponent(dl.source.referrerInfo.computedReferrerSpec) };
				var newentry = '"' + dlid + '":' + JSON.stringify(objct[dlid]);

				this.writeJSON("history.json", oldhstry.replace(tempentry, newentry));

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(this.windowtype);
				while (enumerator.hasMoreElements()) {

					let window = enumerator.getNext();
					let document = window.document;

					if (document.getElementById("downloadbar-stack-" + exid)) {
						document.getElementById("downloadbar-stack-" + exid).parentNode.insertBefore(document.getElementById("downloadbar-stack-" + dlid), document.getElementById("downloadbar-stack-" + exid));
						document.getElementById("downloadbar-stack-" + exid).parentNode.removeChild(document.getElementById("downloadbar-stack-" + exid));
						if (document.getElementById("downloadbar-cntr")) {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]) - 1;
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]);
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}

					}

				}

			}

		}

		//refresh again in case temp replace
		try {
			var hstry = JSON.parse(this.readJSON("history.json"));
		}
		catch (e) {
			this.writeJSON("history.json", "{}");
			var hstry = JSON.parse(this.readJSON("history.json"));
		}

		hstry[dlid] = {};
		hstry[dlid].id = dlid;
		hstry[dlid].target = { path: encodeURIComponent(targetFile.path) };
		hstry[dlid].succeeded = dl.succeeded;
		hstry[dlid].source = { url: encodeURIComponent(dl.source.url), referrer: encodeURIComponent(dl.source.referrerInfo.computedReferrerSpec) };

		if (download.succeeded) {
			let endTime = new Date().getTime();

			hstry[dlid].endTime = endTime;
			hstry[dlid].source = { url: encodeURIComponent(dl.source.url), referrer: encodeURIComponent(dl.source.referrerInfo.computedReferrerSpec) };
			hstry[dlid].speed = dl.speed;
			hstry[dlid].totalBytes = dl.totalBytes;
			hstry[dlid].currentBytes = dl.currentBytes;
			hstry[dlid].progress = progress;
			hstry[dlid].startTime = dl.startTime;
			hstry[dlid].succeeded = dl.succeeded;
			hstry[dlid].canceled = dl.canceled;
		}

		this.writeJSON("history.json", JSON.stringify(hstry));
	},
	onDownloadChanged: function (download, isDownloadPrivate) {

		function convert2RGBA(hex, opacity) {
			hex = hex.replace('#', '');
			let r = parseInt(hex.substring(0, 2), 16);
			let g = parseInt(hex.substring(2, 4), 16);
			let b = parseInt(hex.substring(4, 6), 16);
			return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
		}
		try {

			let dl = download;

			let targetFile;
			let startTime;
			let totalBytes;
			let amountTransferred;
			let source;
			let referrer;
			let progress;

			if (this.ff26above) {
				targetFile = dl.target;
				startTime = (dl.startTime ? dl.startTime.getTime() : null);
				totalBytes = dl.totalBytes;
				amountTransferred = dl.currentBytes;
				source = dl.source.url;
				referrer = dl.source.referrerInfo ? dl.source.referrerInfo.computedReferrerSpec : null;
				progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
			}
			else {
				targetFile = dl.targetFile;
				startTime = dl.startTime / 1000;
				totalBytes = dl.size;
				amountTransferred = dl.amountTransferred;
				source = dl.source.spec;
				referrer = dl.referrer ? dl.referrer.spec : null;
				progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
			}

			let basename = OS.Path.basename(targetFile.path);
			let time;
			let dlid;

			if (dl.dsbid) {
				dlid = dl.dsbid;
			}
			else {
				time = new Date().getTime();
				let randomness = parseInt(Math.random() * new Date().getTime());
				if (this.ff26above) {
					dlid = randomness + "-" + time;
					dl.dsbid = dlid;
				}
				else {
					dlid = dl.guid;
					//dl.dsbid=dlid;
				}
			}

			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator);
			var win = wm.getMostRecentWindow("dsb:downloads");
			if (win && download.succeeded) {
				try {
					var hstry = JSON.parse(this.readJSON("history.json"));
				}
				catch (e) {
					this.writeJSON("history.json", "{}");
					var hstry = JSON.parse(this.readJSON("history.json"));
				}

				let endTime = new Date().getTime();

				hstry[dlid].endTime = endTime;
				hstry[dlid].source = { url: encodeURIComponent(source), referrer: encodeURIComponent(referrer) };
				hstry[dlid].speed = dl.speed;
				hstry[dlid].totalBytes = totalBytes;
				hstry[dlid].currentBytes = amountTransferred;
				hstry[dlid].progress = progress;
				hstry[dlid].startTime = startTime;
				hstry[dlid].succeeded = (dl.succeeded ? dl.succeeded : true);
				hstry[dlid].canceled = (dl.canceled ? dl.canceled : false);

				this.writeJSON("history.json", JSON.stringify(hstry));

				return;
			}

			let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

			let uiid;
			if (brnch.getCharPref("extensions.downloadbar.userinterface") == "bar") uiid = "downloadbar-bar";
			else if (brnch.getCharPref("extensions.downloadbar.userinterface") == "panel") uiid = "downloadbar-downloadpanel";

			try {
				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var rwin = wm.getMostRecentWindow(this.windowtype);

				rwin.document.getElementById("downloadbar-hbox-" + dlid).getAttribute("id");

			}
			catch (e) {
				let document = rwin.document;
				let stcks = document.getElementById(uiid).getElementsByTagName("stack");
				for (var i = -0; i < stcks.length; i++) {
					if (stcks[i].dl == dl) {
						dlid = stcks[i].getAttribute("id").replace("downloadbar-stack-", "");
						dl.dsbid = dlid;
						break;
					}
				}
			}

			let flext = basename.substring(basename.lastIndexOf(".") + 1, basename.length);

			if (download.succeeded) {

				let endTime = new Date().getTime();

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);

				if (brnch.getBoolPref("extensions.downloadbar.playsound")) {

					var rwin = wm.getMostRecentWindow(this.windowtype);
					let dop = brnch.getCharPref("extensions.downloadbar.audioplayerpath");
					if (dop != "") {
						let prefs = Components.classes["@mozilla.org/preferences-service;1"].
							getService(Components.interfaces.nsIPrefService).
							getBranch("extensions.downloadbar.")
						let audioplayerpath = prefs.getComplexValue("audioplayerpath", Components.interfaces.nsIFile).path;
						var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
						file.initWithPath(audioplayerpath);
						var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
						rwin.document.getElementById("downloadbar-opt-doplyr").setAttribute("src", ioService.newFileURI(file).spec);
						rwin.document.getElementById("downloadbar-opt-doplyr").play();
					}
					else {
						rwin.document.getElementById("downloadbar-opt-doplyr").setAttribute("src", "chrome://downloadbar/content/defaultNotification.wav");
						rwin.document.getElementById("downloadbar-opt-doplyr").play();
					}

				}

				var enumerator = wm.getEnumerator(this.windowtype);
				while (enumerator.hasMoreElements()) {

					let window = enumerator.getNext();
					let document = window.document;

					try {
						Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
					} catch (e) {
						// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
					}
					if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
						PrivateBrowsingUtils.privacyContextFromWindow) {
						var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
						var isWindowPrivate = privacyContext.usePrivateBrowsing;
					} else {
						// older than Firefox 19 or couldn't get window.
						var privacyContext = null;
						var isWindowPrivate = false;
					}

					if (isWindowPrivate != isDownloadPrivate) continue

					//document.getElementById("downloadbar-hbox-"+dlid).setAttribute("right","0");
					document.getElementById("downloadbar-label-" + dlid).setAttribute("value", basename);
					//document.getElementById("downloadbar-lbl-pgrss-"+dlid).setAttribute("value"," - 100%");
					document.getElementById("downloadbar-hbox-" + dlid).style.backgroundSize = 100 + "% auto";
					document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode.parentNode.removeChild(document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode);
					document.getElementById("downloadbar-stack-" + dlid).setAttribute("downcompleted", "true");
					document.getElementById("downloadbar-stack-" + dlid).addEventListener("dragstart", DownloadBar.drgstrt, false);

					document.getElementById("downloadbar-stack-" + dlid).setAttribute("endtime", endTime);

					if (document.getElementById("downloadbar-cntr")) {
						let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]) - 1;
						let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) + 1;
						document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
					}

					if (dlid == document.getElementById("downloadbar-itempanel").getAttribute("activeid")) {

						let s = document.getElementById("downloadbar-stack-" + dlid);
						let totalBYTES = this.hasDLProgress(dl) ? totalBytes : amountTransferred;

						let elapsedseconds = (parseInt(s.getAttribute("endtime")) - dl.startTime.getTime()) / 1000;
						let averagespeed = parseInt(totalBYTES / elapsedseconds / 1000);

						function normalizetime(time) {
							return time[0] + " " + time[1] + " " + (time[2] ? time[2] : "") + " " + (time[3] ? time[3] : "");
						}

						//let remainingtime=DownloadUtils.convertTimeUnits(parseInt((totalBYTES - dl.currentBytes)/dl.speed));		
						//let normalizedremainingtime=normalizetime(remainingtime);		

						let downloadtime = DownloadUtils.convertTimeUnits(elapsedseconds);
						let normalizeddownloadtime = normalizetime(downloadtime);

						document.getElementById("downloadbar-itempanel-crrntspdlbl").setAttribute("value", "-");
						document.getElementById("downloadbar-itempanel-pgrsslbl").setAttribute("value", 100 + "%");
						document.getElementById("downloadbar-itempanel-rmngtmlbl").setAttribute("value", "-");

						document.getElementById("downloadbar-itempanel-vrgspdnmhb").hidden = !(s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-vrgspdvlhb").hidden = !(s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-vrgspdlbl").setAttribute("value", (averagespeed != 0) ? averagespeed + " KB" : " - ");

						document.getElementById("downloadbar-itempanel-crrntspdnmhb").hidden = (s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-crrntspdvlhb").hidden = (s.getAttribute("downcompleted") == "true");
						//document.getElementById("downloadbar-itempanel-crrntspdlbl").setAttribute("value",(crrntspd!=0) ? crrntspd+" KB" : " - ");

						document.getElementById("downloadbar-itempanel-dwnldtmnmhb").hidden = !(s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-dwnldtmvlhb").hidden = !(s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-dwnldtmlbl").setAttribute("value", normalizeddownloadtime);

						document.getElementById("downloadbar-itempanel-rmngtmnmhb").hidden = (s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-rmngtmvlhb").hidden = (s.getAttribute("downcompleted") == "true");

						document.getElementById("downloadbar-itempanel-dwnldbytnmhb").hidden = (s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-dwnldbytvlhb").hidden = (s.getAttribute("downcompleted") == "true");

						let filesize = DownloadUtils.convertByteUnits(totalBYTES)[0];
						let filesizeunit = DownloadUtils.convertByteUnits(totalBYTES)[1];
						let filesizelabel = filesize + " " + filesizeunit;
						document.getElementById("downloadbar-itempanel-flszlbl").setAttribute("value", filesizelabel);

						document.getElementById("downloadbar-itempanel-flsznmhb").hidden = !(s.getAttribute("downcompleted") == "true");
						document.getElementById("downloadbar-itempanel-flszvlhb").hidden = !(s.getAttribute("downcompleted") == "true");

						//document.getElementById("downloadbar-itempanel-rmngtmlbl").setAttribute("value",(!isNaN(parseInt((totalBYTES - dl.currentBytes)/dl.speed))) ? normalizedremainingtime : " - ");										
					}

					let dcclr = brnch.getCharPref("extensions.downloadbar.downloadcompletecolor");
					if (dcclr != "null") document.getElementById("downloadbar-hbox-" + dlid).setAttribute("style", "background-image:linear-gradient(to bottom, " + convert2RGBA(dcclr, 0.59) + " 0%, " + convert2RGBA(dcclr, 1) + " 100%) !important;background-size:100% auto;background-repeat:no-repeat;");

					if (brnch.getBoolPref("extensions.downloadbar.autoclosebarwhendownloadscomplete")) {

						window.setTimeout(function () {
							let stcks = document.getElementById(uiid).getElementsByTagName("stack");
							let allcompleted = true;
							for (var i = -0; i < stcks.length; i++) {
								if (stcks[i].getAttribute("downcompleted") != "true") allcompleted = false;
							}
							if (allcompleted) { if (uiid == "downloadbar-bar") document.getElementById(uiid).setAttribute("collapsed", "true"); }
						}, brnch.getIntPref("extensions.downloadbar.autoclosesecond") * 1000);

					}

				}

				if (brnch.getCharPref("extensions.downloadbar.autoclearfiletypes").search(/\*/) != -1 || brnch.getCharPref("extensions.downloadbar.autoclearfiletypes").search(new RegExp(flext, "i")) != -1) {

					var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
					this.timer.push(timer);
					var that = this;

					timer.initWithCallback({

						notify: async function (aTimer) {

							try {

								let list = await Downloads.getList(Downloads.ALL);
								await list.remove(download);

							} catch (e) { Components.utils.reportError; }

							that.timer.splice(that.timer.indexOf(timer), 1);

						}

					}, brnch.getIntPref("extensions.downloadbar.autoclearsecond") * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

				}

				if (brnch.getBoolPref("extensions.downloadbar.automaticviruscan")) {
					if (brnch.getCharPref("extensions.downloadbar.disablescanfor").search(new RegExp(flext, "i")) == -1) {
						if (brnch.getCharPref("extensions.downloadbar.viruscanpath") != "") {

							let prefs = Components.classes["@mozilla.org/preferences-service;1"].
								getService(Components.interfaces.nsIPrefService).
								getBranch("extensions.downloadbar.")
							let viruscanpath = prefs.getComplexValue("viruscanpath", Components.interfaces.nsIFile).path;
							let virusarguments = brnch.getCharPref("extensions.downloadbar.virusscanarguments");

							if (virusarguments.search(/%1/g) != -1) {
								// create an nsIFile for the executable
								var file = Components.classes["@mozilla.org/file/local;1"]
									.createInstance(Components.interfaces.nsIFile);
								file.initWithPath(viruscanpath);
								// create an nsIProcess
								var process = Components.classes["@mozilla.org/process/util;1"]
									.createInstance(Components.interfaces.nsIProcess);
								process.init(file);
								// Run the process.
								// If first param is true, calling thread will be blocked until
								// called process terminates.
								// Second and third params are used to pass command-line arguments
								// to the process.
								var args = virusarguments.split(" ");
								for (var i = 0; i < args.length; ++i) {
									args[i] = args[i].replace(/%1/g, targetFile.path);
								}
								process.run(false, args, args.length);
							}
							else {
								dl.launcherPath = viruscanpath;
								dl.launch();
								dl.launcherPath = null;
							}

						}
					}
				}

				if (brnch.getBoolPref("extensions.downloadbar.autoopendownloaddirectory")) {
					dl.showContainingDirectory();
				}

				if (isDownloadPrivate) return

				try {
					var hstry = JSON.parse(this.readJSON("history.json"));
				}
				catch (e) {
					this.writeJSON("history.json", "{}");
					var hstry = JSON.parse(this.readJSON("history.json"));
				}

				hstry[dlid].endTime = endTime;
				hstry[dlid].source = { url: encodeURIComponent(dl.source.url), referrer: encodeURIComponent(dl.source.referrerInfo.computedReferrerSpec) };
				hstry[dlid].speed = dl.speed;
				hstry[dlid].totalBytes = this.hasDLProgress(dl) ? totalBytes : amountTransferred;
				hstry[dlid].currentBytes = dl.currentBytes;
				hstry[dlid].progress = progress;
				hstry[dlid].startTime = dl.startTime;
				hstry[dlid].succeeded = dl.succeeded;
				hstry[dlid].canceled = dl.canceled;

				this.writeJSON("history.json", JSON.stringify(hstry));

				try {
					var sttstcs = JSON.parse(this.readJSON("statistics.json"));
				}
				catch (e) {
					this.writeJSON("statistics.json", "{}");
					var sttstcs = JSON.parse(this.readJSON("statistics.json"));
				}

				var dlext = flext.toLowerCase();

				if (!sttstcs[dlext]) sttstcs[dlext] = {};

				if (!sttstcs[dlext].count) sttstcs[dlext].count = 1;
				else if (sttstcs[dlext].count) sttstcs[dlext].count += 1;

				if (!sttstcs[dlext].totalBytes) sttstcs[dlext].totalBytes = this.hasDLProgress(dl) ? totalBytes : amountTransferred;
				else if (sttstcs[dlext].totalBytes) sttstcs[dlext].totalBytes += this.hasDLProgress(dl) ? totalBytes : amountTransferred;

				this.writeJSON("statistics.json", JSON.stringify(sttstcs));

				return;
			}

			if (download.stopped) {

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(this.windowtype);
				while (enumerator.hasMoreElements()) {
					let window = enumerator.getNext();
					let document = window.document;

					try {
						Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
					} catch (e) {
						// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
					}
					if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
						PrivateBrowsingUtils.privacyContextFromWindow) {
						var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
						var isWindowPrivate = privacyContext.usePrivateBrowsing;
					} else {
						// older than Firefox 19 or couldn't get window.
						var privacyContext = null;
						var isWindowPrivate = false;
					}

					if (isWindowPrivate != isDownloadPrivate) continue

					let s = document.getElementById("downloadbar-stack-" + dlid);
					s.setAttribute("paused", "true");

					let hbx = document.getElementById("downloadbar-hbox-" + dlid.replace("downloadbar-stack-", ""));

					let dpclr = brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
					if (dpclr == "null") { }
					else hbx.style.setProperty("background-image", "linear-gradient(to bottom, " + dpclr + " 0%, " + dpclr + " 100%)", "important");

				}

				return;

			}

			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(this.windowtype);
			while (enumerator.hasMoreElements()) {

				let window = enumerator.getNext();
				let document = window.document;

				try {
					Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
				} catch (e) {
					// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
				}
				if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
					PrivateBrowsingUtils.privacyContextFromWindow) {
					var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
					var isWindowPrivate = privacyContext.usePrivateBrowsing;
				} else {
					// older than Firefox 19 or couldn't get window.
					var privacyContext = null;
					var isWindowPrivate = false;
				}

				if (isWindowPrivate != isDownloadPrivate) continue

				let speed = parseInt(download.speed / 1024);
				let slwstbndwdth = brnch.getIntPref("extensions.downloadbar.slowestbandwidth");
				let avrgbndwdth = brnch.getIntPref("extensions.downloadbar.averagebandwidth");
				let fststbndwdth = brnch.getIntPref("extensions.downloadbar.fastestbandwidth");
				let spdbckgndclr = null;
				//let remainingtime=parseInt((totalBytes - amountTransferred)/dl.speed);

				let remainingtime = DownloadUtils.convertTimeUnits(parseInt((totalBytes - amountTransferred) / dl.speed));
				let normalizedtime = remainingtime[0] + " " + remainingtime[1] + " " + (remainingtime[2] ? remainingtime[2] : "") + " " + (remainingtime[3] ? remainingtime[3] : "");

				let dpclr = brnch.getCharPref("extensions.downloadbar.downloadprogresscolor");

				if (dpclr == "null") document.getElementById("downloadbar-hbox-" + dlid).style.setProperty("background-image", "linear-gradient(to bottom,  #cdeb8e 0%,#a5c956 100%)", "important");
				else document.getElementById("downloadbar-hbox-" + dlid).style.setProperty("background-image", "linear-gradient(to bottom, " + convert2RGBA(dpclr, 0.59) + " 0%, " + convert2RGBA(dpclr, 1) + " 100%)", "important");

				if (speed <= slwstbndwdth) {

					if (brnch.getCharPref("extensions.downloadbar.slowestbandwidthcolor") != "null") spdbckgndclr = brnch.getCharPref("extensions.downloadbar.slowestbandwidthcolor");

				}

				if (speed > slwstbndwdth && speed <= avrgbndwdth) {

					if (brnch.getCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor") != "null") spdbckgndclr = brnch.getCharPref("extensions.downloadbar.averagespeedfirstbandwidthcolor");

				}

				if (speed > avrgbndwdth && speed <= fststbndwdth) {

					if (brnch.getCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor") != "null") spdbckgndclr = brnch.getCharPref("extensions.downloadbar.averagespeedsecondbandwidthcolor");

				}

				if (speed > fststbndwdth) {

					if (brnch.getCharPref("extensions.downloadbar.fastestbandwidthcolor") != "null") spdbckgndclr = brnch.getCharPref("extensions.downloadbar.fastestbandwidthcolor");

				}

				//let stckWdth=parseInt(window.getComputedStyle(document.getElementById("downloadbar-stack-"+dlid),null).getPropertyValue("width"));				
				if (spdbckgndclr != null) document.getElementById("downloadbar-hbox-" + dlid).setAttribute("style", "background-image:linear-gradient(to bottom, " + convert2RGBA(spdbckgndclr, 0.59) + " 0%, " + convert2RGBA(spdbckgndclr, 1) + " 100%) !important;background-repeat:no-repeat;");


				//document.getElementById("downloadbar-hbox-"+dlid).setAttribute("width",parseInt(stckWdth*((progress/100))));
				document.getElementById("downloadbar-hbox-" + dlid).style.backgroundSize = parseInt(progress) + "% auto";
				document.getElementById("downloadbar-label-" + dlid).setAttribute("value", basename);

				let rmngscnds = parseInt((totalBytes - amountTransferred) / dl.speed);

				let seconds = !isNaN(rmngscnds) ? (parseInt(rmngscnds % 60) < 10 ? "0" + parseInt(rmngscnds % 60) : parseInt(rmngscnds % 60)) : "00";
				let minutes = !isNaN(rmngscnds) ? (parseInt((rmngscnds / (60)) % 60) < 10 ? "0" + parseInt((rmngscnds / (60)) % 60) : parseInt((rmngscnds / (60)) % 60)) : "00";
				let hours = !isNaN(rmngscnds) ? (parseInt((rmngscnds / (60 * 60)) % 24) < 10 ? "0" + parseInt((rmngscnds / (60 * 60)) % 24) : parseInt((rmngscnds / (60 * 60)) % 24)) : "00";

				let prgrsslbltxt = brnch.getBoolPref("extensions.downloadbar.showprogressnotification") ? (" - " + parseInt(progress) + "%") : "";
				let spdlbltxt = brnch.getBoolPref("extensions.downloadbar.showspeednotification") ? (" - " + speed + " KB/s") : "";
				let rmngtmlbltxt = brnch.getBoolPref("extensions.downloadbar.showremainingtimenotification") ? (" - " + (hours != "00" ? hours + ":" : "") + minutes + ":" + seconds) : "";

				document.getElementById("downloadbar-lbl-pgrss-" + dlid).setAttribute("value", prgrsslbltxt);
				document.getElementById("downloadbar-lbl-pgrss-" + dlid).setAttribute("hidden", !brnch.getBoolPref("extensions.downloadbar.showprogressnotification") || !this.hasDLProgress(dl));
				document.getElementById("downloadbar-lbl-speed-" + dlid).setAttribute("value", spdlbltxt);
				document.getElementById("downloadbar-lbl-speed-" + dlid).setAttribute("hidden", !brnch.getBoolPref("extensions.downloadbar.showspeednotification"));
				document.getElementById("downloadbar-lbl-rmngtm-" + dlid).setAttribute("value", rmngtmlbltxt);
				document.getElementById("downloadbar-lbl-rmngtm-" + dlid).setAttribute("hidden", !brnch.getBoolPref("extensions.downloadbar.showremainingtimenotification") || !this.hasDLProgress(dl));

				document.getElementById("downloadbar-stack-" + dlid).setAttribute("sourceurl", source);
				document.getElementById("downloadbar-stack-" + dlid).setAttribute("sourcereferrer", referrer);
				document.getElementById("downloadbar-stack-" + dlid).dl = dl;

				if (dlid == document.getElementById("downloadbar-itempanel").getAttribute("activeid")) {
					document.getElementById("downloadbar-itempanel-crrntspdlbl").setAttribute("value", speed + " KB/s");
					document.getElementById("downloadbar-itempanel-pgrsslbl").setAttribute("value", progress + "%");
					document.getElementById("downloadbar-itempanel-rmngtmlbl").setAttribute("value", this.hasDLProgress(dl) ? normalizedtime : this.DownloadBar.gtPrpVlAdvncd("downloadbar-prprts_b1", "downloadbar.nknwn"));

					let filesize = DownloadUtils.convertByteUnits(totalBytes)[0];
					let filesizeunit = DownloadUtils.convertByteUnits(totalBytes)[1];
					let filesizelabel = this.hasDLProgress(dl) ? (filesize + " " + filesizeunit) : this.DownloadBar.gtPrpVlAdvncd("downloadbar-prprts_b1", "downloadbar.nknwn");
					let downloadedsize = DownloadUtils.convertByteUnits(amountTransferred)[0];
					let downloadedsizeunit = DownloadUtils.convertByteUnits(amountTransferred)[1];
					let downloadedsizelabel = downloadedsize + " " + downloadedsizeunit;
					document.getElementById("downloadbar-itempanel-dwnldbytlbl").setAttribute("value", downloadedsizelabel + " / " + filesizelabel);
				}

			}
		} catch (e) { }
	},
	onDownloadRemoved: function (download, isDownloadPrivate) {

		let dl = download;
		let basename = OS.Path.basename(dl.target.path);
		let time;
		let dlid;

		if (dl.dsbid) {
			dlid = dl.dsbid;
		}
		else {
			time = new Date().getTime();
			let randomness = parseInt(Math.random() * new Date().getTime());
			dlid = randomness + "-" + time;
			dl.dsbid = dlid;
		}

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		let uiid;
		if (brnch.getCharPref("extensions.downloadbar.userinterface") == "bar") uiid = "downloadbar-bar";
		else if (brnch.getCharPref("extensions.downloadbar.userinterface") == "panel") uiid = "downloadbar-downloadpanel";

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(this.windowtype);
		while (enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document = window.document;

			try {
				Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
			} catch (e) {
				// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
			}
			if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
				PrivateBrowsingUtils.privacyContextFromWindow) {
				var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
				var isWindowPrivate = privacyContext.usePrivateBrowsing;
			} else {
				// older than Firefox 19 or couldn't get window.
				var privacyContext = null;
				var isWindowPrivate = false;
			}

			if (isWindowPrivate != isDownloadPrivate) continue

			let s = document.getElementById("downloadbar-stack-" + dlid);
			//s.dl.cancel();
			s.parentNode.removeChild(s);

			try {
				var hstry = JSON.parse(this.readJSON("history.json"));
			}
			catch (e) {
				this.writeJSON("history.json", "{}");
				var hstry = JSON.parse(this.readJSON("history.json"));
			}
			delete hstry[dlid];
			this.writeJSON("history.json", JSON.stringify(hstry));

			if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
			if (document.getElementById("downloadbar-cntr")) {
				if (dl.succeeded) {
					let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
					let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
					document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
				}
				else {
					let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]) - 1;
					let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]);
					document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
				}
			}
		}
	},
	onDownloadSucceeded: function (download, isDownloadPrivate) {

		function convert2RGBA(hex, opacity) {
			hex = hex.replace('#', '');
			let r = parseInt(hex.substring(0, 2), 16);
			let g = parseInt(hex.substring(2, 4), 16);
			let b = parseInt(hex.substring(4, 6), 16);
			return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
		}

		let dl = download;

		let targetFile;
		let startTime;
		let totalBytes;
		let amountTransferred;
		let source;
		let referrer;
		let progress;

		if (this.ff26above) {
			targetFile = dl.target;
			startTime = (dl.startTime ? dl.startTime.getTime() : null);
			totalBytes = dl.totalBytes;
			amountTransferred = dl.currentBytes;
			source = dl.source.url;
			referrer = dl.source.referrerInfo ? dl.source.referrerInfo.computedReferrerSpec : null;
			progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
		}
		else {
			targetFile = dl.targetFile;
			startTime = dl.startTime / 1000;
			totalBytes = dl.size;
			amountTransferred = dl.amountTransferred;
			source = dl.source.spec;
			referrer = dl.referrer ? dl.referrer.spec : null;
			progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
		}

		let basename = OS.Path.basename(targetFile.path);
		let time;
		let dlid;

		if (dl.dsbid) {
			dlid = dl.dsbid;
		}
		else {
			time = new Date().getTime();
			let randomness = parseInt(Math.random() * new Date().getTime());
			if (this.ff26above) {
				dlid = randomness + "-" + time;
				dl.dsbid = dlid;
			}
			else {
				dlid = dl.guid;
				//dl.dsbid=dlid;
			}
		}

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		let endTime = new Date().getTime();
		let flext = basename.substring(basename.lastIndexOf(".") + 1, basename.length);

		let uiid;
		if (brnch.getCharPref("extensions.downloadbar.userinterface") == "bar") uiid = "downloadbar-bar";
		else if (brnch.getCharPref("extensions.downloadbar.userinterface") == "panel") uiid = "downloadbar-downloadpanel";

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);

		if (brnch.getBoolPref("extensions.downloadbar.playsound")) {

			var rwin = wm.getMostRecentWindow(this.windowtype);
			let dop = brnch.getCharPref("extensions.downloadbar.audioplayerpath");
			if (dop != "") {
				let prefs = Components.classes["@mozilla.org/preferences-service;1"].
					getService(Components.interfaces.nsIPrefService).
					getBranch("extensions.downloadbar.")
				let audioplayerpath = prefs.getComplexValue("audioplayerpath", Components.interfaces.nsIFile).path;
				var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
				file.initWithPath(audioplayerpath);
				var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
				rwin.document.getElementById("downloadbar-opt-doplyr").setAttribute("src", ioService.newFileURI(file).spec);
				rwin.document.getElementById("downloadbar-opt-doplyr").play();
			}
			else {
				rwin.document.getElementById("downloadbar-opt-doplyr").setAttribute("src", "chrome://downloadbar/content/defaultNotification.wav");
				rwin.document.getElementById("downloadbar-opt-doplyr").play();
			}

		}

		var enumerator = wm.getEnumerator(this.windowtype);
		while (enumerator.hasMoreElements()) {

			let window = enumerator.getNext();
			let document = window.document;

			try {
				Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
			} catch (e) {
				// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
			}
			if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
				PrivateBrowsingUtils.privacyContextFromWindow) {
				var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
				var isWindowPrivate = privacyContext.usePrivateBrowsing;
			} else {
				// older than Firefox 19 or couldn't get window.
				var privacyContext = null;
				var isWindowPrivate = false;
			}

			if (isWindowPrivate != isDownloadPrivate) continue

			//document.getElementById("downloadbar-hbox-"+dlid).setAttribute("right","0");
			document.getElementById("downloadbar-label-" + dlid).setAttribute("value", basename);
			//document.getElementById("downloadbar-lbl-pgrss-"+dlid).setAttribute("value"," - 100%");
			document.getElementById("downloadbar-hbox-" + dlid).style.backgroundSize = 100 + "% auto";
			document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode.parentNode.removeChild(document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode);
			document.getElementById("downloadbar-stack-" + dlid).setAttribute("downcompleted", "true");
			document.getElementById("downloadbar-stack-" + dlid).addEventListener("dragstart", DownloadBar.drgstrt, false);

			document.getElementById("downloadbar-stack-" + dlid).setAttribute("endtime", endTime);

			if (document.getElementById("downloadbar-cntr")) {
				let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]) - 1;
				let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) + 1;
				document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
			}

			if (dlid == document.getElementById("downloadbar-itempanel").getAttribute("activeid")) {
				let s = document.getElementById("downloadbar-stack-" + dlid);
				//let totalBytes=this.hasDLProgress(dl) ? totalBytes: amountTransferred;
				let elapsedseconds = (parseInt(s.getAttribute("endtime")) - startTime) / 1000;
				let averagespeed = parseInt(totalBytes / elapsedseconds / 1000);

				function normalizetime(time) {
					return time[0] + " " + time[1] + " " + (time[2] ? time[2] : "") + " " + (time[3] ? time[3] : "");
				}

				//let remainingtime=DownloadUtils.convertTimeUnits(parseInt((totalBytes - amountTransferred)/dl.speed));		
				//let normalizedremainingtime=normalizetime(remainingtime);		

				let downloadtime = DownloadUtils.convertTimeUnits(elapsedseconds);
				let normalizeddownloadtime = normalizetime(downloadtime);

				document.getElementById("downloadbar-itempanel-crrntspdlbl").setAttribute("value", "-");
				document.getElementById("downloadbar-itempanel-pgrsslbl").setAttribute("value", 100 + "%");
				document.getElementById("downloadbar-itempanel-rmngtmlbl").setAttribute("value", "-");

				document.getElementById("downloadbar-itempanel-vrgspdnmhb").hidden = !(s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-vrgspdvlhb").hidden = !(s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-vrgspdlbl").setAttribute("value", (averagespeed != 0) ? averagespeed + " KB" : " - ");

				document.getElementById("downloadbar-itempanel-crrntspdnmhb").hidden = (s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-crrntspdvlhb").hidden = (s.getAttribute("downcompleted") == "true");
				//document.getElementById("downloadbar-itempanel-crrntspdlbl").setAttribute("value",(crrntspd!=0) ? crrntspd+" KB" : " - ");

				document.getElementById("downloadbar-itempanel-dwnldtmnmhb").hidden = !(s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-dwnldtmvlhb").hidden = !(s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-dwnldtmlbl").setAttribute("value", normalizeddownloadtime);

				document.getElementById("downloadbar-itempanel-rmngtmnmhb").hidden = (s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-rmngtmvlhb").hidden = (s.getAttribute("downcompleted") == "true");

				document.getElementById("downloadbar-itempanel-dwnldbytnmhb").hidden = (s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-dwnldbytvlhb").hidden = (s.getAttribute("downcompleted") == "true");

				let filesize = DownloadUtils.convertByteUnits(totalBytes)[0];
				let filesizeunit = DownloadUtils.convertByteUnits(totalBytes)[1];
				let filesizelabel = filesize + " " + filesizeunit;
				document.getElementById("downloadbar-itempanel-flszlbl").setAttribute("value", filesizelabel);

				document.getElementById("downloadbar-itempanel-flsznmhb").hidden = !(s.getAttribute("downcompleted") == "true");
				document.getElementById("downloadbar-itempanel-flszvlhb").hidden = !(s.getAttribute("downcompleted") == "true");

				//document.getElementById("downloadbar-itempanel-rmngtmlbl").setAttribute("value",(!isNaN(parseInt((totalBytes - amountTransferred)/dl.speed))) ? normalizedremainingtime : " - ");										
			}

			let dcclr = brnch.getCharPref("extensions.downloadbar.downloadcompletecolor");
			if (dcclr != "null") document.getElementById("downloadbar-hbox-" + dlid).setAttribute("style", "background-image:linear-gradient(to bottom, " + convert2RGBA(dcclr, 0.59) + " 0%, " + convert2RGBA(dcclr, 1) + " 100%) !important;background-size:100% auto;background-repeat:no-repeat;");

			if (brnch.getBoolPref("extensions.downloadbar.autoclosebarwhendownloadscomplete")) {

				window.setTimeout(function () {
					let stcks = document.getElementById(uiid).getElementsByTagName("stack");
					let allcompleted = true;
					for (var i = -0; i < stcks.length; i++) {
						if (stcks[i].getAttribute("downcompleted") != "true") allcompleted = false;
					}
					if (allcompleted) { if (uiid == "downloadbar-bar") document.getElementById(uiid).setAttribute("collapsed", "true"); }
				}, brnch.getIntPref("extensions.downloadbar.autoclosesecond") * 1000);

			}

			if (brnch.getCharPref("extensions.downloadbar.autoclearfiletypes").search(/\*/) != -1 || brnch.getCharPref("extensions.downloadbar.autoclearfiletypes").search(new RegExp(flext, "i")) != -1) {
				let that = this;
				window.setTimeout(function () {
					try {
						var hstry = JSON.parse(that.readJSON("history.json"));
					}
					catch (e) {
						that.writeJSON("history.json", "{}");
						var hstry = JSON.parse(that.readJSON("history.json"));
					}
					delete hstry[dlid];
					that.writeJSON("history.json", JSON.stringify(hstry));
					if (document.getElementById("downloadbar-stack-" + dlid)) {
						document.getElementById("downloadbar-stack-" + dlid).parentNode.removeChild(document.getElementById("downloadbar-stack-" + dlid));
					}
					if (document.getElementById(uiid).getElementsByTagName("stack").length == 0) { if (uiid == "downloadbar-bar") document.getElementById(uiid).setAttribute("collapsed", "true"); }
					if (document.getElementById("downloadbar-cntr")) {
						let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
						let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
						document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
					}
				}, brnch.getIntPref("extensions.downloadbar.autoclearsecond") * 1000);
			}

		}

		if (brnch.getBoolPref("extensions.downloadbar.automaticviruscan")) {
			if (brnch.getCharPref("extensions.downloadbar.disablescanfor").search(new RegExp(flext, "i")) == -1) {
				if (brnch.getCharPref("extensions.downloadbar.viruscanpath") != "") {

					let prefs = Components.classes["@mozilla.org/preferences-service;1"].
						getService(Components.interfaces.nsIPrefService).
						getBranch("extensions.downloadbar.")
					let viruscanpath = prefs.getComplexValue("viruscanpath", Components.interfaces.nsIFile).path;
					let virusarguments = brnch.getCharPref("extensions.downloadbar.virusscanarguments");

					if (virusarguments.search(/%1/g) != -1 || !this.ff26above) {
						// create an nsIFile for the executable
						var file = Components.classes["@mozilla.org/file/local;1"]
							.createInstance(Components.interfaces.nsIFile);
						file.initWithPath(viruscanpath);
						// create an nsIProcess
						var process = Components.classes["@mozilla.org/process/util;1"]
							.createInstance(Components.interfaces.nsIProcess);
						process.init(file);
						// Run the process.
						// If first param is true, calling thread will be blocked until
						// called process terminates.
						// Second and third params are used to pass command-line arguments
						// to the process.
						var args = virusarguments.split(" ");
						for (var i = 0; i < args.length; ++i) {
							args[i] = args[i].replace(/%1/g, targetFile.path);
						}
						process.run(false, args, args.length);
					}
					else {
						dl.launcherPath = viruscanpath;
						dl.launch();
						dl.launcherPath = null;
					}

				}
			}
		}

		if (brnch.getBoolPref("extensions.downloadbar.autoopendownloaddirectory")) {
			if (DownloadBar.ff26above) {
				dl.showContainingDirectory();
			}
			else {
				if (dl.targetFile) {
					dl.targetFile.reveal();
				}
				else {
					var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
					file.initWithPath(s.dl.target.path);
					file.reveal();
				}
			}
		}

		if (isDownloadPrivate) return

		try {
			var hstry = JSON.parse(this.readJSON("history.json"));
		}
		catch (e) {
			this.writeJSON("history.json", "{}");
			var hstry = JSON.parse(this.readJSON("history.json"));
		}

		hstry[dlid].endTime = endTime;
		hstry[dlid].source = { url: encodeURIComponent(source), referrer: encodeURIComponent(referrer) };
		hstry[dlid].speed = dl.speed;
		hstry[dlid].totalBytes = totalBytes;
		hstry[dlid].currentBytes = amountTransferred;
		hstry[dlid].progress = progress;
		hstry[dlid].startTime = startTime;
		hstry[dlid].succeeded = (dl.succeeded ? dl.succeeded : true);
		hstry[dlid].canceled = (dl.canceled ? dl.canceled : false);

		this.writeJSON("history.json", JSON.stringify(hstry));

		try {
			var sttstcs = JSON.parse(this.readJSON("statistics.json"));
		}
		catch (e) {
			this.writeJSON("statistics.json", "{}");
			var sttstcs = JSON.parse(this.readJSON("statistics.json"));
		}

		var dlext = flext.toLowerCase();

		if (!sttstcs[dlext]) sttstcs[dlext] = {};

		if (!sttstcs[dlext].count) sttstcs[dlext].count = 1;
		else if (sttstcs[dlext].count) sttstcs[dlext].count += 1;

		if (!sttstcs[dlext].totalBytes) sttstcs[dlext].totalBytes = totalBytes;
		else if (sttstcs[dlext].totalBytes) sttstcs[dlext].totalBytes += totalBytes;

		this.writeJSON("statistics.json", JSON.stringify(sttstcs));
	},
	public_view: null,
	private_view: null,
	rgstrVw: async function () {
		if (this.ff26above) {
			Components.utils.import("resource://gre/modules/Downloads.jsm");
			Components.utils.import("resource://gre/modules/DownloadUtils.jsm");
			Components.utils.import("resource://gre/modules/osfile.jsm");

			var that = this;
			try {
				let public_list = await Downloads.getList(Downloads.PUBLIC);
				that.public_view = {
					onDownloadAdded: download => that.onDownloadAdded(download, false),
					onDownloadChanged: download => that.onDownloadChanged(download, false),
					onDownloadRemoved: download => that.onDownloadRemoved(download, false)
				};
				await public_list.addView(that.public_view);
				let private_list = await Downloads.getList(Downloads.PRIVATE);
				that.private_view = {
					onDownloadAdded: download => that.onDownloadAdded(download, true),
					onDownloadChanged: download => that.onDownloadChanged(download, true),
					onDownloadRemoved: download => that.onDownloadRemoved(download, true)
				};
				await private_list.addView(that.private_view);
			}
			catch (e) { Components.utils.reportError; }
		}
		else {
			var dm = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);
			dm.addListener(this.ff25.downloadProgressListener);
		}
	},
	ff26above: true,
	prprPrpts: function () {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
			.getService(Components.interfaces.nsIXULAppInfo);
		var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
			.getService(Components.interfaces.nsIVersionComparator);
		if (versionChecker.compare(appInfo.version, "26") >= 0) {
			this.ff26above = true;
			DownloadBar.ff26above = true;
			this.windowtype = "navigator:browser";
			DownloadBar.windowtype = "navigator:browser";
		}
		else {
			this.ff26above = false;
			DownloadBar.ff26above = false;
			this.windowtype = "navigator:browser";
			DownloadBar.windowtype = "navigator:browser";
		}
		switch (Services.appinfo.name) {
			case "Pale Moon":
				this.ff26above = false;
				DownloadBar.ff26above = false;
				this.windowtype = "navigator:browser";
				DownloadBar.windowtype = "navigator:browser";
				break;
			case "Thunderbird":
				try {
					Components.utils.import("resource://gre/modules/Downloads.jsm");
					this.ff26above = true;
					DownloadBar.ff26above = true;
				}
				catch (e) {
					this.ff26above = false;
					DownloadBar.ff26above = false;
				}
				this.windowtype = "mail:3pane";
				DownloadBar.windowtype = "mail:3pane";
				break;
			case "Fennec": break;
			default: //"Firefox", "SeaMonkey"
		}
		this.DownloadBar = DownloadBar;
	},
	init: function () {
		this.prprPrpts();
		var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
		file.append("downloadbar");
		file.append("history.json");
		var ioService = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
		if (!file.exists()) {
			var j = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
			j.append("downloadbar");
			j.append("history.json");
			try {
				j.create(0x00, 0664);
			}
			catch (e) {
				var parent = j.parent;
				parent.remove(false);
				var jn = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
				jn.append("downloadbar");
				jn.append("history.json");
				jn.create(0x00, 0664);
			}
			this.writeJSON("history.json", "{}");
		}
		var sfile = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
		sfile.append("downloadbar");
		sfile.append("statistics.json");
		var ioService = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
		if (!sfile.exists()) {
			var s = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
			s.append("downloadbar");
			s.append("statistics.json");
			try {
				s.create(0x00, 0664);
			}
			catch (e) {
				var sparent = s.parent;
				sparent.remove(false);
				var sn = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
				sn.append("downloadbar");
				sn.append("statistics.json");
				sn.create(0x00, 0664);
			}
			this.writeJSON("statistics.json", "{}");
		}
		this.switchst();
		this.switchdb();
		this.rgstrVw();
		this.rgstrObs();
		//this.addAddonListener();			

	},
	switchst: function () {
		var brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if (!brnch.getBoolPref("extensions.downloadbar.statisticsswitched") && this.readJSON("history.json") != "{}" && this.readJSON("statistics.json") == "{}") {


			try {
				var hstry = JSON.parse(this.readJSON("history.json"));
			}
			catch (e) {
				this.writeJSON("history.json", "{}");
				var hstry = JSON.parse(this.readJSON("history.json"));
			}

			var statpool = {}
			var stattotalcount = 0;
			var stattotalbytes = 0;

			for (var i in hstry) {

				if (!hstry[i].totalBytes) continue;

				var targetpath = decodeURIComponent(hstry[i].target.path);
				var basename = OS.Path.basename(targetpath);

				var flext = basename.substring(basename.lastIndexOf(".") + 1, basename.length).toLowerCase();
				var totalBytes = hstry[i].totalBytes;

				if (!statpool[flext]) statpool[flext] = {};

				if (!statpool[flext].count) statpool[flext].count = 1;
				else if (statpool[flext].count) statpool[flext].count += 1;

				if (!statpool[flext].totalbytes) statpool[flext].totalBytes = totalBytes;
				else if (statpool[flext].totalbytes) statpool[flext].totalBytes += totalBytes;

				stattotalcount++;
				stattotalbytes += totalBytes;

			}

			this.writeJSON("statistics.json", JSON.stringify(statpool));
			brnch.setBoolPref("extensions.downloadbar.statisticsswitched", true);

		}
	},
	rgstr: function () {
		if (this.dn) return;
		this.rgstrVw();
		this.dn = true;
	},
	switchdb: function () {
		var brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if (brnch.getCharPref("extensions.downloadbar.history") != "{}" && this.readJSON("history.json") == "{}") {
			this.writeJSON("history.json", brnch.getCharPref("extensions.downloadbar.history"));
			brnch.setCharPref("extensions.downloadbar.history", "{}");
		}
	},
	dn: false,
	observe: function (subject, topic, data) {
		switch (topic) {
			case "quit-application-granted":
				let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				if (brnch.getBoolPref("extensions.downloadbar.autocleancompletedonquit") == true) {
					try {
						var hstry = JSON.parse(this.readJSON("history.json"));
					}
					catch (e) {
						this.writeJSON("history.json", "{}");
						var hstry = JSON.parse(this.readJSON("history.json"));
					}
					for (var h in hstry) {
						if (hstry[h].succeeded) {
							//let exid=hstry[h].id;
							//delete hstry[hstry[h].id];
							delete hstry[h];
						}
					}
					this.writeJSON("history.json", JSON.stringify(hstry));
				}
				break;
			default:
				throw Components.Exception("Unknown topic: " + topic);
		}
	},
	rgstrObs: function () {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.addObserver(this, "quit-application-granted", true);
	},
	unrgstrObs: function () {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.removeObserver(this, "quit-application-granted");
	},
	read: function (file, charset) {
		try {
			var scriptableInputStream = Components.classes['@mozilla.org/scriptableinputstream;1']
				.createInstance(Components.interfaces.nsIScriptableInputStream);
			var fileInputStream = Components.classes['@mozilla.org/network/file-input-stream;1']
				.createInstance(Components.interfaces.nsIFileInputStream);
			var data = new String();
			fileInputStream.init(file, 1, 0, false);
			scriptableInputStream.init(fileInputStream);
			data += scriptableInputStream.read(-1);
			scriptableInputStream.close();
			fileInputStream.close();
			if (charset) {
				try {
					var scriptableUnicodeConverter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
						.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
					scriptableUnicodeConverter.charset = charset;
					data = scriptableUnicodeConverter.ConvertToUnicode(data);
				}
				catch (err) { }
			}
			return data;
		} catch (err) {
			return false;
		}
	},
	write: function (file, data, mode, charset) {
		try {
			var fileOutputStream = Components.classes['@mozilla.org/network/file-output-stream;1']
				.createInstance(Components.interfaces.nsIFileOutputStream);
			if (charset) {
				try {
					var scriptableUnicodeConverter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
						.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
					scriptableUnicodeConverter.charset = charset;
					data = scriptableUnicodeConverter.ConvertFromUnicode(data);
				}
				catch (err) { }
			}
			var flags = 0x02 | 0x08 | 0x20;
			if (mode == 'a') {
				flags = 0x02 | 0x10;
			}
			fileOutputStream.init(file, flags, 0664, 0);
			fileOutputStream.write(data, data.length);
			fileOutputStream.close();
			return true;
		}
		catch (err) { return false; }
	},
	readJSON: function (file) {
		var j = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
		j.append("downloadbar");
		j.append(file);
		return this.read(j, "UTF-8");
	},
	writeJSON: function (file, strng) {
		var j = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
		j.append("downloadbar");
		j.append(file);
		this.write(j, strng, "w", "UTF-8");
	},
	addAddonListener: function () {
		let listener = {
			onInstalling: function (addon) { },
			onUninstalling: function (addon) {
				if (addon.id == "{6c28e999-e900-4635-a39d-b1ec90ba0c0f}") {
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
						.getService(Components.interfaces.nsIPromptService);
					var check = { value: true };
					var result = prompts.confirmCheck(null, "Download Status Bar", "You are about to uninstall the add-on.\nDo you want to remove related database and settings files?",
						null, check);
					if (result) {
						var db = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
						db.append("downloadbar");
						db.remove(true);
						Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.downloadbar.").deleteBranch("");
					}
				}
			},
			onOperationCancelled: function (addon) { }
		}
		try {
			Components.utils.import("resource://gre/modules/AddonManager.jsm");
			AddonManager.addAddonListener(listener);
		} catch (ex) { }
	},
	ff25: {
		downloadProgressListener: {
			onSecurityChange: function (prog, req, state, dl) {
			},
			onProgressChange: function (prog, req, prog, progMax, tProg, tProgMax, dl) {
				Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.onDownloadChanged(dl, false);
			},
			onStateChange: function (prog, req, flags, status, dl) {
				if (status == 0) {
					Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.onDownloadAdded(dl, false);
				}
			},
			onDownloadStateChange: function (aState, dl) {
				var dm = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);
				switch (dl.state) {
					case dm.DOWNLOAD_FINISHED:
						Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.onDownloadSucceeded(dl, false);
						break;
					case dm.DOWNLOAD_FAILED:
						break;
				}
			}
		}
	},
	hasDLProgress: function (dl) {
		if (this.ff26above) return dl.hasProgress;
		else return dl.percentComplete != -1;
	},
	timer: [],
	windowtype: "navigator:browser"
}

if (ComponentUtils.generateNSGetFactory)
	var NSGetFactory = ComponentUtils.generateNSGetFactory([DownloadBarComponent]);

(function () {
	var registrar = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar)
	var cid = DownloadBarComponent.prototype.contractID
	try {
		registrar.unregisterFactory(registrar.contractIDToCID(cid), registrar.getClassObjectByContractID(cid, Ci.nsISupports));
	} catch (e) { }
	var dbc = DownloadBarComponent.prototype
	var fctry = NSGetFactory(dbc.classID)
	registrar.registerFactory(dbc.classID, dbc.classDescription, dbc.contractID, fctry);
})();

var DownloadBar = {
	dn: false,
	ff26above: true,
	load: function (window, document, closebar) {

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		document.getElementById('downloadsbar-mn').addEventListener("click", DownloadBar.menuclick, false);

		//Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.rgstr();

		let uiid = DownloadBar.gtuiid();
		if (uiid == "downloadbar-bar") {
			if (document.getElementById("downloadbar-ddnbr")) document.getElementById("downloadbar-ddnbr").hidden = true;
			if (document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
		}
		else if (uiid == "downloadbar-downloadpanel") {
			if (document.getElementById("downloadbar-ddnbr")) document.getElementById("downloadbar-ddnbr").hidden = false;
			document.getElementById("downloadbar-bar").setAttribute("collapsed", "true");
		}

		let brbckgrndclr = brnch.getCharPref("extensions.downloadbar.barbackgroundcolor");
		if (brbckgrndclr != null) {
			document.getElementById("downloadbar-bar").style.setProperty("background-image", "linear-gradient(to bottom, " + DownloadBar.convert2RGBA(brbckgrndclr, 0.59) + " 0%, " + DownloadBar.convert2RGBA(brbckgrndclr, 1) + " 100%)", "important");
			document.getElementById("downloadbar-bar").style.setProperty("background-size", "100% auto", "important");
			document.getElementById("downloadbar-bar").style.setProperty("background-repeat", "no-repeat", "important");
		}

		document.getElementById("downloadbar-bar-clrbttn").hidden = brnch.getBoolPref("extensions.downloadbar.hideclearbutton");
		document.getElementById("downloadsbar-mn").hidden = brnch.getBoolPref("extensions.downloadbar.hidedownloadsbutton");


		try {
			Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
		} catch (e) {
			// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
		}
		if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
			PrivateBrowsingUtils.privacyContextFromWindow) {
			var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
			var isWindowPrivate = privacyContext.usePrivateBrowsing;
		} else {
			// older than Firefox 19 or couldn't get window.
			var privacyContext = null;
			var isWindowPrivate = false;
		}

		if (!isWindowPrivate) {

			try {
				var hstry = JSON.parse(this.c.readJSON("history.json"));
			}
			catch (e) {
				this.c.writeJSON("history.json", "{}");
				var hstry = JSON.parse(this.c.readJSON("history.json"));
			}

			for (var i in hstry) {
				var hstryitem = hstry[i];
				hstry[i].startTime = new Date(hstry[i].startTime);//json date fix
				hstry[i].target.path = decodeURIComponent(hstry[i].target.path);
				hstry[i].source.url = decodeURIComponent(hstry[i].source.url);
				hstry[i].source.referrer = decodeURIComponent(hstry[i].source.referrer);

				hstry[i].showContainingDirectory = function D_showContainingDirectory() {
					return DownloadIntegration.showContainingDirectory(this.target.path);
				}
				hstry[i].launch = function () {
					if (!this.succeeded) {
						return Promise.reject(
							new Error("launch can only be called if the download succeeded")
						);
					}

					return DownloadIntegration.launchDownload(this);
				}
				hstry[i].cancel = function () {
					DownloadBar.deleteHistoryItem(this.id);
				}

				DownloadBar.nwdltm(window, document, hstryitem);

				if (uiid == "downloadbar-bar") {

					if (closebar && closebar == true) {
						document.getElementById(uiid).setAttribute("collapsed", "true");
					}
					else {
						document.getElementById(uiid).setAttribute("collapsed", "false");
					}

				}
			}

			/*var rd=document;
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							   .getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(DownloadBar.windowtype);			
			while(enumerator.hasMoreElements()) {
				
				let window = enumerator.getNext();
				let document=window.document;
	
				let stcks=document.getElementById(uiid).getElementsByTagName("stack");
									
				if(stcks.length!=0) {
					for (var i=0;i<stcks.length;i++){
						//let clonestck=stcks[i].cloneNode(true);
						let clonestck=rd.importNode(stcks[i],true);
						clonestck.dl=stcks[i].dl;
								
						if(uiid=="downloadbar-bar") rd.getElementById(uiid+"-wrbx").appendChild(clonestck);
						else if(uiid=="downloadbar-downloadpanel") rd.getElementById(uiid).appendChild(clonestck);
					}
					if(uiid=="downloadbar-bar") rd.getElementById(uiid).setAttribute("collapsed","false");
				}
	
				break;
				
			}*/

		}
		else {

			var rd = document;
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(DownloadBar.windowtype);
			while (enumerator.hasMoreElements()) {

				let window = enumerator.getNext();
				let document = window.document;

				try {
					Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
				} catch (e) {
					// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
				}
				if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
					PrivateBrowsingUtils.privacyContextFromWindow) {
					var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
					var isWindowPrivate = privacyContext.usePrivateBrowsing;
				} else {
					// older than Firefox 19 or couldn't get window.
					var privacyContext = null;
					var isWindowPrivate = false;
				}

				if (isWindowPrivate) {

					let uiid = DownloadBar.gtuiid();
					let stcks = document.getElementById(uiid).getElementsByTagName("stack");

					if (stcks.length != 0) {
						for (var i = 0; i < stcks.length; i++) {
							//let clonestck=stcks[i].cloneNode(true);
							let clonestck = rd.importNode(stcks[i], true);
							clonestck.dl = stcks[i].dl;

							if (uiid == "downloadbar-bar") rd.getElementById(uiid + "-wrbx").appendChild(clonestck);
							else if (uiid == "downloadbar-downloadpanel") rd.getElementById(uiid).appendChild(clonestck);
						}
						if (uiid == "downloadbar-bar") rd.getElementById(uiid).setAttribute("collapsed", "false");
					}

					break;

				}

			}

		}

		var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
			.getService(Components.interfaces.nsIXULRuntime);
		if (xulRuntime.OS == "Darwin") {
			let oldkyst = document.getElementById("downloadbar-tgglky").parentNode;
			oldkyst.parentNode.removeChild(oldkyst);

			let kyst = document.createXULElement("keyset");
			let ky = document.createXULElement("key");
			ky.setAttribute("id", "downloadbar-tgglky");
			ky.setAttribute("modifiers", "shift alt");
			ky.setAttribute("key", brnch.getCharPref("extensions.downloadbar.keyshortcut").toUpperCase());
			ky.setAttribute("oncommand", "void(0);");
			ky.addEventListener("command", DownloadBar.tgglbr, true);
			kyst.appendChild(ky);
			if (DownloadBar.windowtype == "navigator:browser") document.getElementById("main-window").appendChild(kyst);
			else if (DownloadBar.windowtype == "mail:3pane") document.getElementById("messengerWindow").appendChild(kyst);
		}

	},
	menuclick: function (event) {
		let document = event.currentTarget.ownerDocument;
		document.getElementById('downloadsbar-downnloads-menu').openPopup(document.getElementById('downloadsbar-mn'), 'before_start', 0, 0, false, false);
	},
	showfile: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let s = DownloadBar.getStack(document.popupNode);
		if (DownloadBar.ff26above) {
			s.dl.showContainingDirectory();
		}
		else {
			if (s.dl.targetFile) {
				s.dl.targetFile.reveal();
			}
			else {
				var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
				file.initWithPath(s.dl.target.path);
				file.reveal();
			}
		}
		if (s.getAttribute("downcompleted") == "true") {
			let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			if (brnch.getBoolPref("extensions.downloadbar.clearaftershowfile")) {
				if (DownloadBar.ff26above) {
					try {
						let list = await Downloads.getList(Downloads.ALL);
						await list.remove(s.dl);
					} catch (e) { Components.utils.reportError; }
				}
				else {
					var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						.getService(Components.interfaces.nsIWindowMediator);
					var enumerator = wm.getEnumerator(DownloadBar.windowtype);
					let sid = DownloadBar.getStack(document.popupNode).id;
					while (enumerator.hasMoreElements()) {
						let window = enumerator.getNext();
						let document = window.document;
						let s = document.getElementById(sid);
						//s.dl.cancel();
						s.parentNode.removeChild(s);
						DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
						let uiid = DownloadBar.gtuiid();
						if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
						if (document.getElementById("downloadbar-cntr")) {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}
					}
				}
			}
		}
	},
	showtrgt: function (event) {
		if (event.button == 0) {
			let document = event.currentTarget.ownerDocument;
			//let s=DownloadBar.getStack(document.popupNode);
			let s = document.getElementById("downloadbar-stack-" + document.getElementById("downloadbar-itempanel").getAttribute("activeid"));
			if (DownloadBar.ff26above) {
				s.dl.showContainingDirectory();
			}
			else {
				if (s.dl.targetFile) {
					s.dl.targetFile.reveal();
				}
				else {
					var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
					file.initWithPath(s.dl.target.path);
					file.reveal();
				}
			}
		}
	},
	launch: async function (event) {
		let document = event.currentTarget.ownerDocument;
		if (DownloadBar.getStack(document.popupNode).getAttribute("downcompleted") == "true") {
			let s = DownloadBar.getStack(document.popupNode);
			if (DownloadBar.ff26above) {
				s.dl.launch();
			}
			else {
				if (s.dl.targetFile) {
					s.dl.targetFile.launch();
				}
				else {
					var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
					file.initWithPath(s.dl.target.path);
					file.launch();
				}
			}
			let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			if (brnch.getBoolPref("extensions.downloadbar.clearafterlaunch")) {
				if (DownloadBar.ff26above) {
					try {
						let list = await Downloads.getList(Downloads.ALL);
						await list.remove(s.dl);
					} catch (e) { Components.utils.reportError; }
				}
				else {
					var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						.getService(Components.interfaces.nsIWindowMediator);
					var enumerator = wm.getEnumerator(DownloadBar.windowtype);
					let sid = DownloadBar.getStack(document.popupNode).id;
					while (enumerator.hasMoreElements()) {
						let window = enumerator.getNext();
						let document = window.document;
						let s = document.getElementById(sid);
						//s.dl.cancel();
						s.parentNode.removeChild(s);
						DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
						let uiid = DownloadBar.gtuiid();
						if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
						if (document.getElementById("downloadbar-cntr")) {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}
					}
				}
			}
		}
	},
	start: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		let s = DownloadBar.getStack(document.popupNode);

		if (DownloadBar.ff26above) {
			try {

				let list = await Downloads.getList(Downloads.ALL);
				let dwnldlist = list._downloads;

				for (var j = 0; j < dwnldlist.length; j++) {

					if (dwnldlist[j].target.path == s.dl.target.path) {

						let download = dwnldlist[j];
						await download.start();

						var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							.getService(Components.interfaces.nsIWindowMediator);
						var enumerator = wm.getEnumerator(DownloadBar.windowtype);
						let sid = s.id;
						while (enumerator.hasMoreElements()) {
							let window = enumerator.getNext();
							let document = window.document;

							let isWindowPrivate = DownloadBar.isWindowPrivate(window);
							if (isWindowPrivate != isDownloadPrivate) continue

							let s = document.getElementById(sid);
							s.setAttribute("paused", "false");
						}

					}
				}

			} catch (e) { Components.utils.reportError; }
		}
		else {

			s.dl.resume();

			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(DownloadBar.windowtype);
			let sid = s.id;
			while (enumerator.hasMoreElements()) {
				let window = enumerator.getNext();
				let document = window.document;

				let isWindowPrivate = DownloadBar.isWindowPrivate(window);
				if (isWindowPrivate != isDownloadPrivate) continue

				let s = document.getElementById(sid);
				s.setAttribute("paused", "false");
			}

		}
	},
	pause: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		if (DownloadBar.getStack(document.popupNode).getAttribute("downcompleted") != "true") {

			let s = DownloadBar.getStack(document.popupNode);

			if (DownloadBar.ff26above) {
				try {

					let list = await Downloads.getList(Downloads.ALL);
					let dwnldlist = list._downloads;

					for (var j = 0; j < dwnldlist.length; j++) {

						if (dwnldlist[j].target.path == s.dl.target.path) {

							let download = dwnldlist[j];
							await download.cancel();

							var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
								.getService(Components.interfaces.nsIWindowMediator);
							var enumerator = wm.getEnumerator(DownloadBar.windowtype);
							let sid = s.id;
							while (enumerator.hasMoreElements()) {
								let window = enumerator.getNext();
								let document = window.document;

								let isWindowPrivate = DownloadBar.isWindowPrivate(window);
								if (isWindowPrivate != isDownloadPrivate) continue

								let s = document.getElementById(sid);
								s.setAttribute("paused", "true");

								let hbx = document.getElementById("downloadbar-hbox-" + sid.replace("downloadbar-stack-", ""));

								let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
								let dpclr = brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
								if (dpclr == "null") { }
								else hbx.style.setProperty("background-image", "linear-gradient(to bottom, " + dpclr + " 0%, " + dpclr + " 100%)", "important");

							}

						}
					}

				} catch (e) { Components.utils.reportError; }
			}
			else {

				s.dl.pause();

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(DownloadBar.windowtype);
				let sid = s.id;
				while (enumerator.hasMoreElements()) {
					let window = enumerator.getNext();
					let document = window.document;

					let isWindowPrivate = DownloadBar.isWindowPrivate(window);
					if (isWindowPrivate != isDownloadPrivate) continue

					let s = document.getElementById(sid);
					s.setAttribute("paused", "true");

					let hbx = document.getElementById("downloadbar-hbox-" + sid.replace("downloadbar-stack-", ""));

					let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
					let dpclr = brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
					if (dpclr == "null") { }
					else hbx.style.setProperty("background-image", "linear-gradient(to bottom, " + dpclr + " 0%, " + dpclr + " 100%)", "important");

				}

			}
		}
	},
	pauseall: async function () {
		/*let uiid=DownloadBar.gtuiid();
		let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
		for(var i=0;i<stcks.length;i++){
			if(stcks[i].getAttribute("downcompleted")!="true") stcks[i].dl.cancel();
		}*/

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBar.windowtype);
		while (enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document = window.document;

			let uiid = DownloadBar.gtuiid();
			let stcks = document.getElementById(uiid).getElementsByTagName("stack");
			for (var i = 0; i < stcks.length; i++) {
				if (stcks[i].getAttribute("downcompleted") != "true") {

					let s = stcks[i];

					if (DownloadBar.ff26above) {

						try {

							let list = await Downloads.getList(Downloads.ALL);
							let dwnldlist = list._downloads;

							for (var j = 0; j < dwnldlist.length; j++) {

								if (dwnldlist[j].target.path == s.dl.target.path) {

									let download = dwnldlist[j];
									await download.cancel();

									let sid = s.id;
									s.setAttribute("paused", "true");

									let hbx = document.getElementById("downloadbar-hbox-" + sid.replace("downloadbar-stack-", ""));

									let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
									let dpclr = brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
									if (dpclr == "null") { }
									else hbx.style.setProperty("background-image", "linear-gradient(to bottom, " + dpclr + " 0%, " + dpclr + " 100%)", "important");

								}
							}

						} catch (e) { Components.utils.reportError; }

					}
					else {

						s.dl.pause();

						let sid = s.id;
						s.setAttribute("paused", "true");

						let hbx = document.getElementById("downloadbar-hbox-" + sid.replace("downloadbar-stack-", ""));

						let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
						let dpclr = brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
						if (dpclr == "null") { }
						else hbx.style.setProperty("background-image", "linear-gradient(to bottom, " + dpclr + " 0%, " + dpclr + " 100%)", "important");

					}
				}
			}
		}
	},
	resumeall: async function () {
		/*let uiid=DownloadBar.gtuiid();
		let stcks=document.getElementById(uiid).getElementsByTagName("stack");		
		for(var i=0;i<stcks.length;i++){
			stcks[i].dl.start();
		}*/
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBar.windowtype);
		while (enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document = window.document;

			let uiid = DownloadBar.gtuiid();
			let stcks = document.getElementById(uiid).getElementsByTagName("stack");
			for (var i = 0; i < stcks.length; i++) {
				if (stcks[i].getAttribute("downcompleted") != "true") {

					let s = stcks[i];

					if (DownloadBar.ff26above) {

						try {

							let list = await Downloads.getList(Downloads.ALL);
							let dwnldlist = list._downloads;

							for (var j = 0; j < dwnldlist.length; j++) {

								if (dwnldlist[j].target.path == s.dl.target.path) {

									let sid = s.id;
									s.setAttribute("paused", "false");

									let download = dwnldlist[j];
									await download.start();

								}
							}

						} catch (e) { Components.utils.reportError; }

					}
					else {

						let sid = s.id;
						s.setAttribute("paused", "false");

						s.dl.resume();

					}

				}
			}
		}
	},
	cancelall: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		let uiid = DownloadBar.gtuiid();
		let stcks = document.getElementById(uiid).getElementsByTagName("stack");
		for (var i = stcks.length - 1; i >= 0; i--) {
			if (stcks[i].getAttribute("downcompleted") != "true") {

				let s = stcks[i];

				if (DownloadBar.ff26above) {

					try {

						let list = await Downloads.getList(Downloads.ALL);
						let dwnldlist = list._downloads;

						for (var j = 0; j < dwnldlist.length; j++) {

							if (dwnldlist[j].target.path == s.dl.target.path) {

								let download = dwnldlist[j];
								await list.remove(download);
								await download.finalize(true);

							}
						}

					} catch (e) { Components.utils.reportError; }

				}
				else {
					try {
						s.dl.cancel();
						//s.dl.remove();
					}
					catch (e) {
						Components.utils.reportError("Cancel Download Error: " + e);
					}

					var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						.getService(Components.interfaces.nsIWindowMediator);
					var enumerator = wm.getEnumerator(DownloadBar.windowtype);
					let sid = s.id;
					while (enumerator.hasMoreElements()) {
						let window = enumerator.getNext();
						let document = window.document;

						let isWindowPrivate = DownloadBar.isWindowPrivate(window);
						if (isWindowPrivate != isDownloadPrivate) continue

						let s = document.getElementById(sid);
						//s.dl.cancel();
						s.parentNode.removeChild(s);
						DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
						let uiid = DownloadBar.gtuiid();
						if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
						if (document.getElementById("downloadbar-cntr")) {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}
					}
				}

			}
		}
	},
	cancel: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		if (DownloadBar.getStack(document.popupNode).getAttribute("downcompleted") != "true") {

			let s = DownloadBar.getStack(document.popupNode);

			if (DownloadBar.ff26above) {
				try {

					let list = await Downloads.getList(Downloads.ALL);
					let dwnldlist = list._downloads;

					for (var j = 0; j < dwnldlist.length; j++) {

						if (dwnldlist[j].target.path == s.dl.target.path) {
							let download = dwnldlist[j];
							await list.remove(download);
							await download.finalize(true);
							return;
						}

					}

					var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						.getService(Components.interfaces.nsIWindowMediator);
					var enumerator = wm.getEnumerator(DownloadBar.windowtype);
					let sid = s.id;
					while (enumerator.hasMoreElements()) {
						let window = enumerator.getNext();
						let document = window.document;

						let isWindowPrivate = DownloadBar.isWindowPrivate(window);
						if (isWindowPrivate != isDownloadPrivate) continue

						let s = document.getElementById(sid);
						//s.dl.cancel();
						s.parentNode.removeChild(s);
						DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
						let uiid = DownloadBar.gtuiid();
						if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
						if (document.getElementById("downloadbar-cntr")) {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}
					}


				} catch (e) { Components.utils.reportError; }
			}
			else {

				try {
					s.dl.cancel();
					//s.dl.remove();
				}
				catch (e) {
					Components.utils.reportError("Cancel Download Error: " + e);
				}

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(DownloadBar.windowtype);
				let sid = s.id;
				while (enumerator.hasMoreElements()) {
					let window = enumerator.getNext();
					let document = window.document;

					let isWindowPrivate = DownloadBar.isWindowPrivate(window);
					if (isWindowPrivate != isDownloadPrivate) continue

					let s = document.getElementById(sid);
					//s.dl.cancel();
					s.parentNode.removeChild(s);
					DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
					let uiid = DownloadBar.gtuiid();
					if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
					if (document.getElementById("downloadbar-cntr")) {
						if (s.dl.succeeded) {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}
						else {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]) - 1;
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]);
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}
					}
				}

			}
		}

	},
	getStack: function (dp) {
		let d = dp;
		while (d.nodeName != "stack") {
			d = d.parentNode;
		}
		return d;
	},
	clear: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);
		if (DownloadBar.getStack(document.popupNode).getAttribute("downcompleted") == "true") {

			let s = DownloadBar.getStack(document.popupNode);
			let that = DownloadBar;

			try {

				if (that.ff26above) {
					let list = await Downloads.getList(Downloads.ALL);
					let dwnldlist = list._downloads;

					for (var j = 0; j < dwnldlist.length; j++) {

						if (dwnldlist[j].target.path == s.dl.target.path) {
							let download = dwnldlist[j];
							await list.remove(download);
							return;
						}

					}
				}

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(DownloadBar.windowtype);
				let sid = s.id;
				while (enumerator.hasMoreElements()) {
					let window = enumerator.getNext();
					let document = window.document;

					let isWindowPrivate = DownloadBar.isWindowPrivate(window);
					if (isWindowPrivate != isDownloadPrivate) continue

					let s = document.getElementById(sid);
					//s.dl.cancel();
					s.parentNode.removeChild(s);
					DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
					let uiid = DownloadBar.gtuiid();
					if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
					if (document.getElementById("downloadbar-cntr")) {
						let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
						let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
						document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
					}
				}

			} catch (e) { Components.utils.reportError; }

		}
	},
	clearall: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);
		let uiid = DownloadBar.gtuiid();
		let stcks = document.getElementById(uiid).getElementsByTagName("stack");
		for (var i = stcks.length - 1; i >= 0; i--) {
			if (stcks[i].getAttribute("downcompleted") == "true") {
				let s = stcks[i];
				let that = DownloadBar;

				try {

					if (that.ff26above) {
						let list = await Downloads.getList(Downloads.ALL);
						let dwnldlist = list._downloads;

						for (var j = 0; j < dwnldlist.length; j++) {

							if (dwnldlist[j].target.path == s.dl.target.path) {
								let download = dwnldlist[j];
								await list.remove(download);
								return;
							}

						}
					}

					var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						.getService(Components.interfaces.nsIWindowMediator);
					var enumerator = wm.getEnumerator(DownloadBar.windowtype);
					let sid = s.id;
					while (enumerator.hasMoreElements()) {
						let window = enumerator.getNext();
						let document = window.document;

						let isWindowPrivate = DownloadBar.isWindowPrivate(window);
						if (isWindowPrivate != isDownloadPrivate) continue

						let s = document.getElementById(sid);
						//s.dl.cancel();
						s.parentNode.removeChild(s);
						DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
						let uiid = DownloadBar.gtuiid();
						if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
						if (document.getElementById("downloadbar-cntr")) {
							let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
							let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
							document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
						}
					}

				} catch (e) { Components.utils.reportError; }

			}

		}

	},
	dwnldbrmnpop: function (event) {
		let document = event.currentTarget.ownerDocument;
		let uiid = DownloadBar.gtuiid();
		document.getElementById("downloadsbar-dmclose").hidden = (uiid == "downloadbar-downloadpanel");
		document.getElementById("downloadsbar-dmclosems").hidden = (uiid == "downloadbar-downloadpanel");
	},
	pop: function (event) {
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		let document = event.currentTarget.ownerDocument;
		if (event.target.id != event.currentTarget.id) return;

		let s = DownloadBar.getStack(document.popupNode);
		let succeeded;
		let paused;

		if (DownloadBar.ff26above) {
			succeeded = s.dl.succeeded;
			paused = s.dl.canceled;
		}
		else {
			if (s.dl.state) {
				var dm = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);
				succeeded = s.dl.state == dm.DOWNLOAD_FINISHED;
				paused = s.dl.state == dm.DOWNLOAD_PAUSED;
			}
			else {
				succeeded = s.dl.succeeded;
				paused = s.dl.canceled;
			}
		}

		document.getElementById("downloadsbar-slmenu").hidden = !succeeded;
		document.getElementById("downloadsbar-chksm").hidden = !succeeded;
		document.getElementById("downloadsbar-rnm").hidden = !succeeded;
		document.getElementById("downloadsbar-sendto").hidden = !succeeded;
		document.getElementById("downloadsbar-dltfl").hidden = !succeeded;
		document.getElementById("downloadsbar-slmenusp").hidden = !succeeded;
		document.getElementById("downloadsbar-gtdwnlpg").disabled = !s.getAttribute("sourcereferrer");
		document.getElementById("downloadsbar-cpytrgtpth").hidden = !brnch.getBoolPref("extensions.downloadbar.enablecopytargetpathmenuitem");
		document.getElementById("downloadsbar-cncl").hidden = succeeded;
		document.getElementById("downloadsbar-strt").hidden = !paused;
		document.getElementById("downloadsbar-pause").hidden = s.getAttribute("downcompleted") == "true" || paused;
		document.getElementById("downloadsbar-ctnsmns").hidden = s.getAttribute("downcompleted") == "true" || paused;
		document.getElementById("downloadsbar-clrll").hidden = !brnch.getBoolPref("extensions.downloadbar.enableclearallmenuitem");
	},
	pnlpop: function (event) {
		let document = event.currentTarget.ownerDocument;

		let s = DownloadBar.getStack(document.popupNode);
		event.target.setAttribute("activeid", s.getAttribute("id").replace("downloadbar-stack-", ""));
		let dl = s.dl;

		let targetFile;
		let startTime;
		let totalBytes;
		let amountTransferred;
		let source;
		let referrer;
		let progress;

		if (DownloadBar.ff26above) {
			targetFile = dl.target;
			startTime = dl.startTime.getTime();
			totalBytes = (dl.totalBytes != 0 ? dl.totalBytes : dl.currentBytes);
			amountTransferred = dl.currentBytes;
			source = dl.source.url;
			referrer = dl.source.referrerInfo ? dl.source.referrerInfo.computedReferrerSpec : null;
			progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
		}
		else {
			if (dl.targetFile) {
				targetFile = dl.targetFile;
				startTime = dl.startTime / 1000;
				totalBytes = dl.size;
				amountTransferred = dl.amountTransferred;
				source = dl.source.spec;
				referrer = dl.referrer ? dl.referrer.spec : null;
				progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
			}
			else {
				targetFile = dl.target;
				startTime = dl.startTime.getTime();
				totalBytes = dl.totalBytes;
				amountTransferred = dl.currentBytes;
				source = dl.source.url;
				referrer = dl.source.referrerInfo ? dl.source.referrerInfo.computedReferrerSpec : null;
				progress = (dl.progress != undefined ? dl.progress : (dl.percentComplete != -1 ? dl.percentComplete : 0));
			}
		}

		let basename = OS.Path.basename(targetFile.path);

		let targetpath = targetFile.path;
		let crrntspd = parseInt(dl.speed / 1024);
		progress = progress + "%";

		let filesize = DownloadUtils.convertByteUnits(totalBytes)[0];
		let filesizeunit = DownloadUtils.convertByteUnits(totalBytes)[1];
		let filesizelabel = DownloadBar.hasDLProgress(dl) ? (filesize + " " + filesizeunit) : DownloadBar.gtPrpVlAdvncd("downloadbar-prprts_b1", "downloadbar.nknwn");
		let downloadedsize = DownloadUtils.convertByteUnits(amountTransferred)[0];
		let downloadedsizeunit = DownloadUtils.convertByteUnits(amountTransferred)[1];
		let downloadedsizelabel = downloadedsize + " " + downloadedsizeunit;

		let elapsedseconds = (parseInt(s.getAttribute("endtime")) - startTime) / 1000;
		let averagespeed = parseInt(totalBytes / elapsedseconds / 1000);

		function normalizetime(time) {
			return time[0] + " " + time[1] + " " + (time[2] ? time[2] : "") + " " + (time[3] ? time[3] : "");
		}

		let remainingtime = DownloadUtils.convertTimeUnits(parseInt((totalBytes - amountTransferred) / dl.speed));
		let normalizedremainingtime = normalizetime(remainingtime);

		let downloadtime = DownloadUtils.convertTimeUnits(elapsedseconds);
		let normalizeddownloadtime = normalizetime(downloadtime);

		document.getElementById("downloadbar-itempanel-imgcn").setAttribute("src", "moz-icon://" + targetpath + "?size=32");
		document.getElementById("downloadbar-itempanel-flnmbl").setAttribute("value", basename);

		if (event.target.getAttribute("leftclick") == "true") document.getElementById("downloadbar-itempanel-srclbl").classList.add("text-link");
		document.getElementById("downloadbar-itempanel-srclbl").setAttribute("value", source);
		//document.getElementById("downloadbar-itempanel-srclbl").setAttribute("tooltiptext",source);

		if (event.target.getAttribute("leftclick") == "true") document.getElementById("downloadbar-itempanel-trgtlbl").classList.add("text-link");
		document.getElementById("downloadbar-itempanel-trgtlbl").setAttribute("value", targetpath);
		//document.getElementById("downloadbar-itempanel-trgtlbl").setAttribute("tooltiptext",targetpath);

		document.getElementById("downloadbar-itempanel-vrgspdnmhb").hidden = !(s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-vrgspdvlhb").hidden = !(s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-vrgspdlbl").setAttribute("value", (averagespeed != 0) ? averagespeed + " KB/s" : " - ");

		document.getElementById("downloadbar-itempanel-crrntspdnmhb").hidden = (s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-crrntspdvlhb").hidden = (s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-crrntspdlbl").setAttribute("value", (crrntspd != 0) ? crrntspd + " KB" : " - ");

		document.getElementById("downloadbar-itempanel-pgrsslbl").setAttribute("value", progress);

		document.getElementById("downloadbar-itempanel-dwnldtmnmhb").hidden = !(s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-dwnldtmvlhb").hidden = !(s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-dwnldtmlbl").setAttribute("value", normalizeddownloadtime);

		document.getElementById("downloadbar-itempanel-rmngtmnmhb").hidden = (s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-rmngtmvlhb").hidden = (s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-rmngtmlbl").setAttribute("value", (!isNaN(parseInt((totalBytes - amountTransferred) / dl.speed))) ? (DownloadBar.hasDLProgress(dl) ? normalizedremainingtime : DownloadBar.gtPrpVlAdvncd("downloadbar-prprts_b1", "downloadbar.nknwn")) : " - ");

		document.getElementById("downloadbar-itempanel-dwnldbytnmhb").hidden = (s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-dwnldbytvlhb").hidden = (s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-dwnldbytlbl").setAttribute("value", downloadedsizelabel + " / " + filesizelabel);

		document.getElementById("downloadbar-itempanel-flsznmhb").hidden = !(s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-flszvlhb").hidden = !(s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-flszlbl").setAttribute("value", filesize + " " + filesizeunit);

		let flext = basename.substring(basename.lastIndexOf(".") + 1, basename.length);
		let lflext = flext.toLowerCase();

		if (lflext == "jpg" || lflext == "jpeg" || lflext == "gif" || lflext == "png" || lflext == "bmp") {

			document.getElementById("downloadbar-ppprvwimgwrp").hidden = !(s.getAttribute("downcompleted") == "true");
			if (event.target.getAttribute("leftclick") == "true") document.getElementById("downloadbar-ppprvwimg").style.setProperty("cursor", "pointer", "important");

			var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
			file.initWithPath(targetpath);
			var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)
			//document.getElementById("downloadbar-ppprvwimg").setAttribute("src",ioService.newFileURI(file).spec);		
			document.getElementById("downloadbar-ppprvwimg").style.setProperty("background-image", "url('" + ioService.newFileURI(file).spec + "')", "important");

		}
		else {
			document.getElementById("downloadbar-ppprvwimgwrp").hidden = true;
		}

		document.getElementById("downloadbar-itempanel-flhshnmhb").hidden = !(s.getAttribute("downcompleted") == "true");
		document.getElementById("downloadbar-itempanel-flhshlbl").hidden = !(s.getAttribute("downcompleted") == "true");

		if (s.getAttribute("downcompleted") == "true") {
			if (!s.hasAttribute("MD5")) {
				document.getElementById("downloadbar-itempanel-flhshlbl").setAttribute("value", DownloadBar.gtPrpVlAdvncd("downloadbar-optsprprts", "downloadbaropts.clcltng") + "... 0%");
				DownloadBar.Chksm.clcltHash(targetpath, "MD5", s);
			}
			else document.getElementById("downloadbar-itempanel-flhshlbl").setAttribute("value", s.getAttribute("MD5"));
		}

	},
	pnlhid: function (event) {
		let document = event.currentTarget.ownerDocument;
		event.target.setAttribute("activeid", "");
		event.target.setAttribute("leftclick", "false");
		document.getElementById("downloadbar-itempanel-srclbl").classList.remove("text-link");
		document.getElementById("downloadbar-itempanel-trgtlbl").classList.remove("text-link");
		document.getElementById("downloadbar-ppprvwimg").style.removeProperty("cursor");
		document.getElementById("downloadbar-ppprvwimg").style.removeProperty("background-image");
		DownloadBar.Chksm.cancel();
	},
	togglebar: function (event) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBar.windowtype);
		let collapsed = event.currentTarget.ownerDocument.getElementById("downloadbar-bar").collapsed;
		while (enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document = window.document;
			document.getElementById("downloadbar-bar").setAttribute("collapsed", !collapsed);
		}
	},
	closebar: function (event) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBar.windowtype);
		while (enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document = window.document;
			document.getElementById("downloadbar-bar").setAttribute("collapsed", "true");
		}
	},
	pndwnldtb: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
			.getService(Components.interfaces.nsIXULAppInfo);
		var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
			.getService(Components.interfaces.nsIVersionComparator);

		let aboutDownloadsAvailable = false;
		if (Services.appinfo.name == "Firefox" && versionChecker.compare(appInfo.version, "20") >= 0) {//starting with FF 20, about:downloads is available
			aboutDownloadsAvailable = true;
		}

		DownloadBar.openTab(window, aboutDownloadsAvailable ? "about:downloads" : "chrome://mozapps/content/downloads/downloads.xhtml");
	},
	shwlldwnldshstry: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		if (DownloadBar.windowtype == "mail:3pane") Components.classes['@mozilla.org/download-manager-ui;1'].getService(Components.interfaces.nsIDownloadManagerUI).show(window, null, Components.interfaces.nsIDownloadManagerUI.REASON_USER_INTERACTED);
		else {
			if (Services.appinfo.name == "SeaMonkey") {
				//var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
				//ww.openWindow(window,"chrome://mozapps/content/downloads/downloads.xul","Download:Manager","chrome,dialog=no,resizable",null);
				window.toDownloadManager();
			}
			else window.DownloadsPanel.showDownloadsHistory();
		}
	},
	scan: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let p = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).getCharPref("extensions.downloadbar.viruscanpath");
		if (p == "") {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				.getService(Components.interfaces.nsIPromptService);
			var result = prompts.confirm(null, "Download Status Bar", DownloadBar.gtPrpVl("vrscnnrlnfrst") + "\n" + DownloadBar.gtPrpVl("vrscnnrlnsnd"));
			if (result) {
				const nsIFilePicker = Components.interfaces.nsIFilePicker;
				var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
				fp.init(window, DownloadBar.gtPrpVl("lctvrsscnnr"), nsIFilePicker.modeOpen);
				var rv = fp.show();
				if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
					var prefs = Components.classes["@mozilla.org/preferences-service;1"].
						getService(Components.interfaces.nsIPrefService).
						getBranch("extensions.downloadbar.");
					prefs.setComplexValue("viruscanpath", Components.interfaces.nsIFile, fp.file);
				}
			}
			else return;
		}

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		let prefs2 = Components.classes["@mozilla.org/preferences-service;1"].
			getService(Components.interfaces.nsIPrefService).
			getBranch("extensions.downloadbar.")
		let viruscanpath = prefs2.getComplexValue("viruscanpath", Components.interfaces.nsIFile).path;
		let virusarguments = brnch.getCharPref("extensions.downloadbar.virusscanarguments");
		let s = DownloadBar.getStack(document.popupNode);

		if (virusarguments.search(/%1/g) != -1 || !DownloadBar.ff26above) {
			// create an nsIFile for the executable
			var file = Components.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsIFile);
			file.initWithPath(viruscanpath);
			// create an nsIProcess
			var process = Components.classes["@mozilla.org/process/util;1"]
				.createInstance(Components.interfaces.nsIProcess);
			process.init(file);
			// Run the process.
			// If first param is true, calling thread will be blocked until
			// called process terminates.
			// Second and third params are used to pass command-line arguments
			// to the process.
			var args = virusarguments.split(" ");
			for (var i = 0; i < args.length; ++i) {
				args[i] = args[i].replace(/%1/g, s.dl.target.path);
			}
			process.run(false, args, args.length);
		}
		else {
			s.dl.launcherPath = viruscanpath;
			s.dl.launch();
			s.dl.launcherPath = null;
		}
	},
	enable: function () {
		let s = DownloadBar.getStack(document.popupNode);
		s.dl.launcherPath = "C:\\Program Files (x86)\\Malwarebytes' Anti-Malware\\mbam.exe";
		s.dl.launch();
	},
	disable: function () {
		let s = DownloadBar.getStack(document.popupNode);
		s.dl.launcherPath = null;
		s.dl.launch();
	},
	pnptns: function () {
		gBrowser.selectedTab = gBrowser.addTab("chrome://downloadbar/content/options.xhtml", { relatedToCurrent: true, triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });
	},
	pnptnsdlg: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let ow = window.openDialog("chrome://downloadbar/content/options.xhtml", "Download Status Statusbar", "centerscreen,chrome");
		ow.focus();
	},
	checksum: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let s = DownloadBar.getStack(document.popupNode);
		let targetpath;
		if (DownloadBar.ff26above) {
			targetpath = s.dl.target.path;
		}
		else {
			if (s.dl.targetFile) {
				targetpath = s.dl.targetFile.path;
			}
			else {
				targetpath = s.dl.target.path;
			}
		}
		let cw = window.openDialog("chrome://downloadbar/content/checksum.xhtml", "Checksum", "centerscreen,chrome", targetpath, "MD5");
		cw.focus();
	},
	tgglbr: function (event) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBar.windowtype);
		let collapsed = event.currentTarget.ownerDocument.getElementById("downloadbar-bar").collapsed;
		while (enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document = window.document;
			document.getElementById("downloadbar-bar").setAttribute("collapsed", !collapsed);
		}
	},
	gtdwnlpg: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let gBrowser = window.gBrowser;
		let s = DownloadBar.getStack(document.popupNode);
		gBrowser.selectedTab = gBrowser.addTab(s.getAttribute("sourcereferrer"), { relatedToCurrent: true, triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });
	},
	gtsrc: function (event) {
		if (event.button == 0) {
			let document = event.currentTarget.ownerDocument;
			let window = document.defaultView;
			//let s=DownloadBar.getStack(document.popupNode);
			let s = document.getElementById("downloadbar-stack-" + document.getElementById("downloadbar-itempanel").getAttribute("activeid"));
			DownloadBar.openTab(window, s.getAttribute("sourceurl"));
		}
	},
	pnprvw: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let s = DownloadBar.getStack(document.popupNode);
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		let path = DownloadBar.gtTrgtPth(s);
		file.initWithPath(path);
		var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		DownloadBar.openTab(window, ioService.newFileURI(file).spec);
	},
	cpytrgtpth: function (event) {
		let document = event.currentTarget.ownerDocument;
		let s = DownloadBar.getStack(document.popupNode);
		const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(s.dl.target.path);
	},
	cpydwnldlnk: function (event) {
		let document = event.currentTarget.ownerDocument;
		let s = DownloadBar.getStack(document.popupNode);
		const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(s.getAttribute("sourceurl"));
	},
	dblclckclrll: function (event) {
		let document = event.currentTarget.ownerDocument;
		if (event.button != 2 && event.target.id == 'downloadbar-bar-wrbx' && event.currentTarget.id == 'downloadbar-bar-wrbx' && document.getAnonymousElementByAttribute(document.getElementById("downloadbar-bar-wrbx"), "anonid", "scrollbutton-up").collapsed == true) {
			DownloadBar.clearall(event);
		}
	},
	rghtClckMn: function (event) {
		let document = event.currentTarget.ownerDocument;
		if (event.button == 2 && event.target.id == 'downloadbar-bar-wrbx' && event.currentTarget.id == 'downloadbar-bar-wrbx') {
			document.getElementById("downloadsbar-downnloads-menu").openPopupAtScreen(event.screenX, event.screenY, true)
		}
	},
	dltfl: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if (brnch.getBoolPref("extensions.downloadbar.askconfirmationbeforedelete")) {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				.getService(Components.interfaces.nsIPromptService);
			var result = prompts.confirm(null, "Download Status Bar", DownloadBar.gtPrpVl("dltflfrst") + "\n" + DownloadBar.gtPrpVl("dltflscnd"));
			if (!result) return;
		}

		let s = DownloadBar.getStack(document.popupNode);
		let targetpath;
		if (DownloadBar.ff26above) {
			targetpath = s.dl.target.path;
		}
		else {
			if (s.dl.targetFile) {
				targetpath = s.dl.targetFile.path;
			}
			else {
				targetpath = s.dl.target.path;
			}
		}
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		file.initWithPath(targetpath);
		if (file.exists()) {
			file.remove(true);
		}

		let that = DownloadBar;

		try {

			if (that.ff26above) {
				let list = await Downloads.getList(Downloads.ALL);
				let dwnldlist = list._downloads;

				for (var j = 0; j < dwnldlist.length; j++) {

					if (dwnldlist[j].target.path == s.dl.target.path) {
						let download = dwnldlist[j];
						await list.remove(download);
						return;
					}

				}
			}

			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				.getService(Components.interfaces.nsIWindowMediator);
			var enumerator = wm.getEnumerator(DownloadBar.windowtype);
			let sid = s.id;
			while (enumerator.hasMoreElements()) {
				let window = enumerator.getNext();
				let document = window.document;

				let isWindowPrivate = DownloadBar.isWindowPrivate(window);
				if (isWindowPrivate != isDownloadPrivate) continue

				let s = document.getElementById(sid);
				//s.dl.cancel();
				s.parentNode.removeChild(s);
				DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
				let uiid = DownloadBar.gtuiid();
				if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
				if (document.getElementById("downloadbar-cntr")) {
					let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
					let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
					document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
				}
			}

		} catch (e) { Components.utils.reportError; }

	},
	onRenameAccept: function (s, filename) {
		let document = s.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		let path = DownloadBar.gtTrgtPth(s);
		file.initWithPath(path);

		let result = true;
		if (result) {
			if (filename != OS.Path.basename(path)) {

				try {
					file.moveTo(null, filename);
				}
				catch (e) { return }

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(DownloadBar.windowtype);
				let sid = s.id;
				while (enumerator.hasMoreElements()) {
					let window = enumerator.getNext();
					let document = window.document;

					let isWindowPrivate = DownloadBar.isWindowPrivate(window);
					if (isWindowPrivate != isDownloadPrivate) continue

					let s = document.getElementById(sid);
					s.dl.target.path = file.path;

					if (!isWindowPrivate) DownloadBar.updateHistoryItem(sid.replace("downloadbar-stack-", ""), s);
					let l = document.getElementById("downloadbar-label-" + sid.replace("downloadbar-stack-", ""));
					l.setAttribute("value", filename);
				}

			}
		}

	},
	rnmnw: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let s = DownloadBar.getStack(document.popupNode);
		let cw = window.openDialog("chrome://downloadbar/content/rename.xhtml", "Rename", "centerscreen,chrome,resizable", s);
		cw.focus();
	},
	rnm: function (event) {

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		let s = DownloadBar.getStack(document.popupNode);
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		file.initWithPath(s.dl.target.path);

		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService);

		var check = { value: false };

		var input = { value: OS.Path.basename(s.dl.target.path) };

		var result = prompts.prompt(null, "Download Status Bar", DownloadBar.gtPrpVl("rnmfl"), input, null, check);

		if (result) {
			if (input.value != OS.Path.basename(s.dl.target.path)) {

				try {
					file.moveTo(null, input.value);
				}
				catch (e) { return }

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(DownloadBar.windowtype);
				let sid = DownloadBar.getStack(document.popupNode).id;
				while (enumerator.hasMoreElements()) {
					let window = enumerator.getNext();
					let document = window.document;

					let isWindowPrivate = DownloadBar.isWindowPrivate(window);
					if (isWindowPrivate != isDownloadPrivate) continue

					let s = document.getElementById(sid);
					s.dl.target.path = file.path;
					if (!isWindowPrivate) DownloadBar.updateHistoryItem(sid.replace("downloadbar-stack-", ""), s);
					let l = document.getElementById("downloadbar-label-" + sid.replace("downloadbar-stack-", ""));
					l.setAttribute("value", input.value);
				}

			}
		}

	},
	gtuiid: function () {
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		let uiid;
		if (brnch.getCharPref("extensions.downloadbar.userinterface") == "bar") uiid = "downloadbar-bar";
		else if (brnch.getCharPref("extensions.downloadbar.userinterface") == "panel") uiid = "downloadbar-downloadpanel";
		return uiid;
	},
	dwnldpnlpop: function (event) {
		let document = event.currentTarget.ownerDocument;
		document.getElementById("downloadbar-pnlbll").hidden = document.getElementById("downloadbar-downloadpanel").getElementsByTagName("stack").length;
	},
	drgstrt: function (event) {
		let s = event.currentTarget;
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		file.initWithPath(s.dl.target.path);
		let dataTransfer = event.dataTransfer;
		dataTransfer.mozSetDataAt("application/x-moz-file", file, 0);
		dataTransfer.setDragImage(s, 30, 10);
		dataTransfer.effectAllowed = "copyMove";
	},
	deleteHistoryItem: function (id) {
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		try {
			var hstry = JSON.parse(this.c.readJSON("history.json"));
		}
		catch (e) {
			this.c.writeJSON("history.json", "{}");
			var hstry = JSON.parse(this.c.readJSON("history.json"));
		}
		delete hstry[id];
		this.c.writeJSON("history.json", JSON.stringify(hstry));
	},
	updateHistoryItem: function (id, s) {
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		try {
			var hstry = JSON.parse(this.c.readJSON("history.json"));
		}
		catch (e) {
			this.c.writeJSON("history.json", "{}");
			var hstry = JSON.parse(this.c.readJSON("history.json"));
		}
		let path = DownloadBar.gtTrgtPth(s);
		hstry[id].target = { path: encodeURIComponent(path) };
		this.c.writeJSON("history.json", JSON.stringify(hstry));
	},
	cid: null,
	stckclck: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if (event.button == 0) {
			if (brnch.getBoolPref("extensions.downloadbar.enableleftclickpopup")) {
				if (brnch.getBoolPref("extensions.downloadbar.prioritizedoubleclicking")) {
					if (event.button == 0) {
						var ect = event.currentTarget;
						var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							.getService(Components.interfaces.nsIWindowMediator);
						var rwin = wm.getMostRecentWindow(DownloadBar.windowtype);
						rwin.clearTimeout(DownloadBar.cid);
						DownloadBar.cid = rwin.setTimeout(function () {
							//event.currentTarget.ownerDocument.getElementById("downloadbar-itempanel").openPopupAtScreen(event.screenX, event.screenY, true);
							let window = ect.ownerDocument.defaultView;
							let document = ect.ownerDocument;
							let stckWdth = parseInt(window.getComputedStyle(ect, null).getPropertyValue("width"));
							ect.ownerDocument.getElementById('downloadbar-itempanel').setAttribute("leftclick", "true");
							ect.ownerDocument.getElementById('downloadbar-itempanel').openPopup(ect, 'before_start', parseInt(stckWdth / 2), 0, false, false, event);
						}, brnch.getIntPref("extensions.downloadbar.doubleclickinterval"));
					}
				}
				else {
					//event.currentTarget.ownerDocument.getElementById("downloadbar-itempanel").openPopupAtScreen(event.screenX, event.screenY, true);
					let window = event.currentTarget.ownerDocument.defaultView;
					let document = event.currentTarget.ownerDocument;
					let stckWdth = parseInt(window.getComputedStyle(event.currentTarget, null).getPropertyValue("width"));
					event.currentTarget.ownerDocument.getElementById('downloadbar-itempanel').setAttribute("leftclick", "true");
					event.currentTarget.ownerDocument.getElementById('downloadbar-itempanel').openPopup(event.currentTarget, 'before_start', parseInt(stckWdth / 2), 0, false, false, event);
				}
			}
		}
		else if (event.button == 1) {
			if (event.currentTarget.getAttribute("downcompleted") == "true") {
				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var enumerator = wm.getEnumerator(DownloadBar.windowtype);
				let sid = event.currentTarget.id;
				while (enumerator.hasMoreElements()) {
					let window = enumerator.getNext();
					let document = window.document;
					let s = document.getElementById(sid);
					//s.dl.cancel();
					s.parentNode.removeChild(s);
					DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
					let uiid = DownloadBar.gtuiid();
					if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
					if (document.getElementById("downloadbar-cntr")) {
						let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
						let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
						document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
					}
				}
			}
		}
	},
	stckdbclck: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		if (brnch.getBoolPref("extensions.downloadbar.enableleftclickpopup")) {
			if (brnch.getBoolPref("extensions.downloadbar.prioritizedoubleclicking")) {
				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
				var rwin = wm.getMostRecentWindow(DownloadBar.windowtype);
				rwin.clearTimeout(DownloadBar.cid);
				//event.currentTarget.ownerDocument.getElementById('downloadbar-itempanel').hidePopup();
			}
		}
		if (brnch.getCharPref("extensions.downloadbar.doubleclickaction") == "Launch") {
			let s = event.currentTarget;
			if (s.getAttribute("downcompleted") == "true") {
				if (DownloadBar.ff26above) {
					s.dl.launch();
				}
				else {
					if (s.dl.targetFile) {
						s.dl.targetFile.launch();
					}
					else {
						var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
						file.initWithPath(s.dl.target.path);
						file.launch();
					}
				}
				if (brnch.getBoolPref("extensions.downloadbar.clearafterlaunch")) {
					if (DownloadBar.ff26above) {
						try {
							let list = await Downloads.getList(Downloads.ALL);
							await list.remove(s.dl);
						} catch (e) { Components.utils.reportError; }
					}
					else {
						var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							.getService(Components.interfaces.nsIWindowMediator);
						var enumerator = wm.getEnumerator(DownloadBar.windowtype);
						let sid = s.id;
						while (enumerator.hasMoreElements()) {
							let window = enumerator.getNext();
							let document = window.document;
							let s = document.getElementById(sid);
							//s.dl.cancel();
							s.parentNode.removeChild(s);
							DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
							let uiid;
							if (brnch.getCharPref("extensions.downloadbar.userinterface") == "bar") uiid = "downloadbar-bar";
							else if (brnch.getCharPref("extensions.downloadbar.userinterface") == "panel") uiid = "downloadbar-downloadpanel";

							if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
							if (document.getElementById("downloadbar-cntr")) {
								let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
								let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
								document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
							}
						}
					}
				}
			}
		}
		else if (brnch.getCharPref("extensions.downloadbar.doubleclickaction") == "Show File") {
			let s = event.currentTarget;
			if (DownloadBar.ff26above) {
				s.dl.showContainingDirectory();
			}
			else {
				if (s.dl.targetFile) {
					s.dl.targetFile.reveal();
				}
				else {
					var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
					file.initWithPath(s.dl.target.path);
					file.reveal();
				}
			}
			if (s.getAttribute("downcompleted") == "true") {
				if (brnch.getBoolPref("extensions.downloadbar.clearaftershowfile")) {
					if (DownloadBar.ff26above) {
						try {
							let list = await Downloads.getList(Downloads.ALL);
							await list.remove(s.dl);
						} catch (e) { Components.utils.reportError; }
					}
					else {
						var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
							.getService(Components.interfaces.nsIWindowMediator);
						var enumerator = wm.getEnumerator(DownloadBar.windowtype);
						let sid = s.id;
						while (enumerator.hasMoreElements()) {
							let window = enumerator.getNext();
							let document = window.document;
							let s = document.getElementById(sid);
							//s.dl.cancel();
							s.parentNode.removeChild(s);
							DownloadBar.deleteHistoryItem(sid.replace("downloadbar-stack-", ""));
							let uiid = DownloadBar.gtuiid();
							if (uiid == "downloadbar-bar" && document.getElementById(uiid).getElementsByTagName("stack").length == 0) document.getElementById(uiid).setAttribute("collapsed", "true");
							if (document.getElementById("downloadbar-cntr")) {
								let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
								let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) - 1;
								document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
							}
						}
					}
				}
			}
		}
	},
	nwdltm: function (window, document, hstryitem) {

		//if(!hstryitem.succeeded) return

		let download = hstryitem;

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		let uiid;
		if (brnch.getCharPref("extensions.downloadbar.userinterface") == "bar") uiid = "downloadbar-bar";
		else if (brnch.getCharPref("extensions.downloadbar.userinterface") == "panel") uiid = "downloadbar-downloadpanel";

		let dl = download;
		let basename = OS.Path.basename(dl.target.path);
		let dlid = hstryitem.id;

		let stck = document.createXULElement("stack");
		stck.setAttribute("id", "downloadbar-stack-" + dlid);
		stck.setAttribute("class", "downloadbar-dwnldtmstck");
		//stck.setAttribute("maxwidth","150");
		stck.setAttribute("context", "downloadsbar-statusbar-menu");
		let dwnldbckgrndclr = brnch.getCharPref("extensions.downloadbar.downloadbackgroundcolor");
		if (dwnldbckgrndclr != "null") stck.setAttribute("style", "background-image:linear-gradient(to bottom, " + DownloadBar.convert2RGBA(dwnldbckgrndclr, 0.59) + " 0%, " + DownloadBar.convert2RGBA(dwnldbckgrndclr, 1) + " 100%) !important;background-size:100% auto;background-repeat:no-repeat;");
		else stck.setAttribute("style", "background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.59) 0%, rgb(255, 255, 255) 100%) ! important; background-size: 100% auto; background-repeat: no-repeat;background-color:rgba(143,144,152,1) !important;border:1px solid #98a7ad !important;");
		stck.setAttribute("tooltip", "downloadbar-itempanel");

		let dwbldtmwdth = brnch.getCharPref("extensions.downloadbar.downloaditemwidth");
		if (dwbldtmwdth != "null") stck.style.setProperty("max-width", dwbldtmwdth + "px", "important");

		let dwbldtmhght = brnch.getCharPref("extensions.downloadbar.downloaditemheight");
		if (dwbldtmhght != "null") stck.style.setProperty("height", dwbldtmhght + "px", "important");

		stck.setAttribute("flex", "1");
		stck.setAttribute("downcompleted", "false");
		stck.setAttribute("paused", "false");
		stck.setAttribute("sourceurl", dl.source.url);
		stck.setAttribute("sourcereferrer", dl.source.referrer);
		stck.addEventListener("dblclick", DownloadBar.stckdbclck, false);
		stck.addEventListener("click", DownloadBar.stckclck, false);

		let hbx = document.createXULElement("hbox");
		hbx.setAttribute("id", "downloadbar-hbox-" + dlid);
		hbx.setAttribute("flex", "1");
		hbx.setAttribute("align", "stretch");
		//hbx.setAttribute("right","150");

		let dpclr = brnch.getCharPref("extensions.downloadbar.downloadprogresscolor");
		if (dpclr == "null") hbx.setAttribute("style", "background-image: linear-gradient(to bottom,  #cdeb8e 0%,#a5c956 100%);background-size:0% auto;background-repeat:no-repeat;");
		else hbx.setAttribute("style", "background-image:linear-gradient(to bottom, " + DownloadBar.convert2RGBA(dpclr, 0.59) + " 0%, " + DownloadBar.convert2RGBA(dpclr, 1) + " 100%) !important;background-size:0% auto;background-repeat:no-repeat;");


		let vbx = document.createXULElement("hbox");
		vbx.setAttribute("id", "downloadbar-vbox-" + dlid);
		vbx.setAttribute("class", "downloadbar-dwnldtmhbx");
		vbx.setAttribute("align", "center");
		let i = document.createXULElement("image");
		i.setAttribute("src", "moz-icon://" + dl.target.path + "?size=16");
		i.setAttribute("width", "16");
		i.setAttribute("height", "16");
		let lbl = document.createXULElement("label");
		lbl.setAttribute("id", "downloadbar-label-" + dlid);
		lbl.setAttribute("value", basename + " - 0KB - 100%");
		lbl.setAttribute("crop", "end");
		lbl.setAttribute("flex", "1");
		lbl.setAttribute("style", "margin-right:0;");
		if (brnch.getIntPref("extensions.downloadbar.filenamefontsize") != 0) lbl.style.setProperty("font-size", brnch.getIntPref("extensions.downloadbar.filenamefontsize") + "px", "important");

		let lbl2 = document.createXULElement("label");
		lbl2.setAttribute("id", "downloadbar-lbl-pgrss-" + dlid);
		lbl2.setAttribute("value", "");
		lbl2.setAttribute("style", "margin:0;");

		let lbl3 = document.createXULElement("label");
		lbl3.setAttribute("id", "downloadbar-lbl-speed-" + dlid);
		lbl3.setAttribute("value", "");
		lbl3.setAttribute("style", "margin:0;");

		let lbl4 = document.createXULElement("label");
		lbl4.setAttribute("id", "downloadbar-lbl-rmngtm-" + dlid);
		lbl4.setAttribute("value", "");
		lbl4.setAttribute("style", "margin:0;");

		let ntfctnwnppr;

		if (brnch.getCharPref("extensions.downloadbar.progressnotificationalignment") == "horizontal") {

			ntfctnwnppr = document.createXULElement("box");
			ntfctnwnppr.setAttribute("id", "downloadbar-ntfctnwrppr-" + dlid);
			ntfctnwnppr.setAttribute("orient", "horizontal");
			if (brnch.getIntPref("extensions.downloadbar.progressfontsize") != 0) ntfctnwnppr.style.setProperty("font-size", brnch.getIntPref("extensions.downloadbar.progressfontsize") + "px", "important");

		}

		else {

			ntfctnwnppr = document.createXULElement("box");
			ntfctnwnppr.setAttribute("id", "downloadbar-ntfctnwrppr-" + dlid);
			ntfctnwnppr.setAttribute("orient", "vertical");
			if (brnch.getIntPref("extensions.downloadbar.progressfontsize") != 0) ntfctnwnppr.style.setProperty("font-size", brnch.getIntPref("extensions.downloadbar.progressfontsize") + "px", "important");

		}

		ntfctnwnppr.appendChild(lbl4);
		ntfctnwnppr.appendChild(lbl3);
		ntfctnwnppr.appendChild(lbl2);
		ntfctnwnppr.appendChild(lbl2);
		ntfctnwnppr.appendChild(lbl2);
		ntfctnwnppr.appendChild(lbl2);

		let dtclr = brnch.getCharPref("extensions.downloadbar.downloadtextcolor");
		if (dtclr != "null") {
			lbl.style.setProperty("color", dtclr, "important");
			lbl.style.setProperty("margin-right", "0", "important");
			ntfctnwnppr.style.setProperty("color", dtclr, "important");
			ntfctnwnppr.style.setProperty("margin-right", "0", "important");
		}
		else {
			lbl.style.setProperty("color", "#000000", "important");
			lbl.style.setProperty("margin-right", "0", "important");
			ntfctnwnppr.style.setProperty("color", "#000000", "important");
			ntfctnwnppr.style.setProperty("margin-right", "2px", "important");
		}

		vbx.appendChild(i);
		vbx.appendChild(lbl);
		vbx.appendChild(ntfctnwnppr);
		stck.appendChild(hbx);
		stck.appendChild(vbx);

		if (uiid == "downloadbar-bar") document.getElementById(uiid + "-wrbx").appendChild(stck);
		else if (uiid == "downloadbar-downloadpanel") {
			if (!brnch.getBoolPref("extensions.downloadbar.insertdownloadattopoflist")) document.getElementById(uiid).appendChild(stck);
			else document.getElementById(uiid).insertBefore(stck, document.getElementById(uiid).firstChild);
		}
		//let stckWdth=parseInt(window.getComputedStyle(document.getElementById("downloadbar-stack-"+dlid),null).getPropertyValue("width"));	
		//document.getElementById("downloadbar-stack-"+dlid).setAttribute("right",stckWdth);

		if (dl.succeeded) {

			//document.getElementById("downloadbar-hbox-"+dlid).setAttribute("right","0");
			document.getElementById("downloadbar-label-" + dlid).setAttribute("value", basename);
			//document.getElementById("downloadbar-lbl-pgrss-"+dlid).setAttribute("value"," - 100%");
			document.getElementById("downloadbar-hbox-" + dlid).style.backgroundSize = 100 + "% auto";
			document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode.parentNode.removeChild(document.getElementById("downloadbar-lbl-pgrss-" + dlid).parentNode);
			document.getElementById("downloadbar-stack-" + dlid).setAttribute("downcompleted", "true");
			document.getElementById("downloadbar-stack-" + dlid).addEventListener("dragstart", DownloadBar.drgstrt, false);
			document.getElementById("downloadbar-stack-" + dlid).setAttribute("endtime", dl.endTime);

			let dcclr = brnch.getCharPref("extensions.downloadbar.downloadcompletecolor");
			if (dcclr != "null") document.getElementById("downloadbar-hbox-" + dlid).setAttribute("style", "background-image:linear-gradient(to bottom, " + DownloadBar.convert2RGBA(dcclr, 0.59) + " 0%, " + DownloadBar.convert2RGBA(dcclr, 1) + " 100%) !important;background-size:100% auto;background-repeat:no-repeat;");

			stck.dl = dl;

			if (document.getElementById("downloadbar-cntr")) {
				let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]);
				let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]) + 1;
				document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
			}

		}
		else {

			stck.dl = dl;
			let sid = stck.id;

			(async function () {
				try {
					let list = await Downloads.getList(Downloads.ALL);
					let dwnldlist = list._downloads;

					for (var i = 0; i < dwnldlist.length; i++) {

						if (dwnldlist[i].target.path == stck.dl.target.path) {
							stck.dl = dwnldlist[i];

							if (stck.dl.canceled) {
								let hbx = document.getElementById("downloadbar-hbox-" + sid.replace("downloadbar-stack-", ""));

								let dpsclr = brnch.getCharPref("extensions.downloadbar.downloadpausecolor");
								if (dpsclr == "null") { }
								else {
									hbx.style.setProperty("background-image", "linear-gradient(to bottom, " + DownloadBar.convert2RGBA(dpsclr, 0.59) + " 0%, " + DownloadBar.convert2RGBA(dpsclr, 1) + " 100%)", "important");
									hbx.style.setProperty("background-size", stck.dl.progress + "%", "important");
								}
							}

						}

					}
				} catch (error) {
					Components.utils.reportError;
				}
			})

			if (document.getElementById("downloadbar-cntr")) {
				let prgrscnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[0]) + 1;
				let cmpltcnt = parseInt(document.getElementById("downloadbar-cntr").getAttribute("value").split(":")[1]);
				document.getElementById("downloadbar-cntr").setAttribute("value", prgrscnt + ":" + cmpltcnt);
			}
		}

	},
	convert2RGBA: function (hex, opacity) {
		hex = hex.replace('#', '');
		let r = parseInt(hex.substring(0, 2), 16);
		let g = parseInt(hex.substring(2, 4), 16);
		let b = parseInt(hex.substring(4, 6), 16);
		return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
	},
	clcltHash: function (path) {
		// hardcoded here for convenience
		var path = path;
		var f = Components.classes["@mozilla.org/file/local;1"]
			.createInstance(Components.interfaces.nsIFile);
		f.initWithPath(path);
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Components.interfaces.nsIFileInputStream);
		// open for reading
		istream.init(f, 0x01, 0444, 0);
		var ch = Components.classes["@mozilla.org/security/hash;1"]
			.createInstance(Components.interfaces.nsICryptoHash);
		// we want to use the MD5 algorithm
		ch.init(ch.MD5);
		// this tells updateFromStream to read the entire file
		const PR_UINT32_MAX = 0xffffffff;
		ch.updateFromStream(istream, PR_UINT32_MAX);
		// pass false here to get binary data back
		var hash = ch.finish(false);

		// return the two-digit hexadecimal code for a byte
		function toHexString(charCode) {
			return ("0" + charCode.toString(16)).slice(-2);
		}

		// convert the binary hash data to a hex string.

		// No longer supported
		//var s = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");

		var s = [];
		var i;
		for (i in hash) {
			s[i] = ("0" + hash.charCodeAt(i).toString(16)).slice(-2);
		}
		var result = s.join("");

		// result now contains your hash in hex
		return result;
	},
	sttstcs: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		DownloadBar.openTab(window, "chrome://downloadbar/content/statistics.xhtml");
	},
	isWindowPrivate: function (window) {
		try {
			Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
		} catch (e) {
			// old Firefox versions (e.g. 3.6) didn't have PrivateBrowsingUtils.
		}
		if (window && "undefined" != typeof (PrivateBrowsingUtils) &&
			PrivateBrowsingUtils.privacyContextFromWindow) {
			var privacyContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
			var isWindowPrivate = privacyContext.usePrivateBrowsing;
		} else {
			// older than Firefox 19 or couldn't get window.
			var privacyContext = null;
			var isWindowPrivate = false;
		}
		return isWindowPrivate;
	},
	c: Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject,
	copy: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(document.popupNode.getAttribute("value"));
	},
	help: function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;
		DownloadBar.openTab(window, "chrome://downloadbar/content/help.xhtml");
	},
	sendto: async function (event) {
		let document = event.currentTarget.ownerDocument;
		let window = document.defaultView;

		var isDownloadPrivate = DownloadBar.isWindowPrivate(window);

		let s = DownloadBar.getStack(document.popupNode);
		let targetpath;
		if (DownloadBar.ff26above) {
			targetpath = s.dl.target.path;
		}
		else {
			if (s.dl.targetFile) {
				targetpath = s.dl.targetFile.path;
			}
			else {
				targetpath = s.dl.target.path;
			}
		}

		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
		file.initWithPath(targetpath);

		var dir;
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
			getService(Components.interfaces.nsIPrefService).
			getBranch("extensions.downloadbar.customfolders.");

		if (event.target.id == "downloadsbar-sendto-desktp") {
			dir = Components.classes["@mozilla.org/file/directory_service;1"].
				getService(Components.interfaces.nsIProperties).
				get("Desk", Components.interfaces.nsIFile);
		}
		else if (event.target.id == "downloadsbar-sendto-dwnlds") {
			// var dnldMgr = Components.classes["@mozilla.org/download-manager;1"]
			// 						.getService(Components.interfaces.nsIDownloadManager);
			// dir=dnldMgr.defaultDownloadsDirectory;	

			dir = new FileUtils.File(await Downloads.getSystemDownloadsDirectory());
		}
		else if (event.target.id == "downloadsbar-sendto-cstm") {
			const nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(window, DownloadBar.gtPrpVl("chsfldr"), nsIFilePicker.modeGetFolder);
			// var rv = fp.show();
			fp.open(function (rv) {
				if (rv == nsIFilePicker.returnOK) {
					dir = fp.file;

					let children = prefs.getChildList("", {});
					for (let i = 0; i < children.length; i++) {
						if (fp.file.path == prefs.getComplexValue(children[i], Components.interfaces.nsIFile).path) return;
					}
					prefs.setComplexValue(new Date().getTime(), Components.interfaces.nsIFile, fp.file);
				}
				else if (rv == nsIFilePicker.returnCancel) {
					return;
				}
			});
		}
		else if (event.target.id == "downloadsbar-sendto-cstm-clear") {
			prefs.deleteBranch("");
		}
		else if (event.target.classList.contains("downloadbar-sendtocustomfolder")) {
			if (event.target.customfolder.exists()) {
				dir = event.target.customfolder;
			}
			else {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					.getService(Components.interfaces.nsIPromptService);
				prompts.alert(null, "Download Status Bar", "Folder can not be found. Folder is either deleted, renamed or moved to another location. Please reselect another folder by Custom menu option.");
				return;
			}
		}

		try {
			file.moveTo(dir, file.leafName);
		}
		catch (e) { return }

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBar.windowtype);
		let sid = s.id;
		while (enumerator.hasMoreElements()) {
			let window = enumerator.getNext();
			let document = window.document;

			let isWindowPrivate = DownloadBar.isWindowPrivate(window);
			if (isWindowPrivate != isDownloadPrivate) continue

			let s = document.getElementById(sid);
			s.dl.target.path = file.path;
			if (!isWindowPrivate) DownloadBar.updateHistoryItem(sid.replace("downloadbar-stack-", ""), s);
			let l = document.getElementById("downloadbar-label-" + sid.replace("downloadbar-stack-", ""));
			l.setAttribute("value", file.leafName);
		}

		//s.dl.showContainingDirectory();

	},
	sendtopop: async function (event) {
		let document = event.currentTarget.ownerDocument;

		if (event.target.id != event.currentTarget.id) return;

		var dsktpdir = Components.classes["@mozilla.org/file/directory_service;1"].
			getService(Components.interfaces.nsIProperties).
			get("Desk", Components.interfaces.nsIFile);

		// var dnldMgr = Components.classes["@mozilla.org/download-manager;1"]
		// 			.getService(Components.interfaces.nsIDownloadManager);

		// var dwnlddir = dnldMgr.defaultDownloadsDirectory

		var dwnlddir = await Downloads.getSystemDownloadsDirectory();

		var profdir = Components.classes["@mozilla.org/file/directory_service;1"].
			getService(Components.interfaces.nsIProperties).
			get("ProfD", Components.interfaces.nsIFile);

		var iOService = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);

		var dsktpdirurl = iOService.newFileURI(dsktpdir);
		var dwnlddirurl = iOService.newFileURI(new FileUtils.File(dwnlddir));
		var profdirurl = iOService.newFileURI(profdir);

		document.getElementById("downloadsbar-sendto-desktp").style.setProperty("list-style-image", "url('" + "moz-icon:" + dsktpdirurl.spec + "?size=16" + "')", "important");
		document.getElementById("downloadsbar-sendto-dwnlds").style.setProperty("list-style-image", "url('" + "moz-icon:" + dwnlddirurl.spec + "?size=16" + "')", "important");
		document.getElementById("downloadsbar-sendto-cstm").style.setProperty("list-style-image", "url('" + "moz-icon:" + profdirurl.spec + "?size=16" + "')", "important");

		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		var branch = prefs.getBranch("extensions.downloadbar.customfolders.");
		var obj = {}
		var children = branch.getChildList("", obj);
		for (var i = 0; i < children.length; i++) {
			var customfolder = branch.getComplexValue(children[i], Components.interfaces.nsIFile);
			var cstmfldrmntm = document.createXULElement("menuitem");
			cstmfldrmntm.setAttribute("label", customfolder.leafName);
			cstmfldrmntm.setAttribute("class", "menuitem-iconic downloadbar-sendtocustomfolder");
			cstmfldrmntm.customfolder = customfolder;
			cstmfldrmntm.style.setProperty("list-style-image", "url('" + "moz-icon:" + iOService.newFileURI(customfolder).spec + "?size=16" + "')", "important");
			document.getElementById("downloadsbar-sendtomn").insertBefore(cstmfldrmntm, document.getElementById("downloadsbar-sendto-customfoldersseparatorbelow"));

			document.getElementById("downloadsbar-sendto-customfoldersseparatorabove").setAttribute("hidden", "false");
			document.getElementById("downloadsbar-sendto-cstm-clear").setAttribute("hidden", "false");
		}
	},
	sendtopophid: function (event) {
		let document = event.currentTarget.ownerDocument;
		if (event.target.id != event.currentTarget.id) return;

		var children = event.currentTarget.getElementsByClassName("downloadbar-sendtocustomfolder");
		for (var i = children.length - 1; i >= 0; i--) {
			children[i].parentNode.removeChild(children[i]);
		}
		document.getElementById("downloadsbar-sendto-customfoldersseparatorabove").setAttribute("hidden", "true");
		document.getElementById("downloadsbar-sendto-cstm-clear").setAttribute("hidden", "true");
	},
	Chksm: {
		clcltHash: function (path, algorithm, stck) {
			if (this.running == true) {
				this.cancel();
			}
			else {
				this.running = true;

				var path = path;
				var file = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsIFile);
				file.initWithPath(path);

				this.file = file;
				this.stck = stck;
				this.chunk_size = 16777215;
				this.interval = 100;
				this.istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
					.createInstance(Components.interfaces.nsIFileInputStream);

				this.istream.init(file, 0x01, 0444, 0);
				this.ch = Components.classes["@mozilla.org/security/hash;1"]
					.createInstance(Components.interfaces.nsICryptoHash);

				if (algorithm == "MD5") this.ch.init(this.ch.MD5);
				else if (algorithm == "SHA1") this.ch.init(this.ch.SHA1);
				else if (algorithm == "MD2") this.ch.init(this.ch.MD2);
				else if (algorithm == "SHA256") this.ch.init(this.ch.SHA256);
				else if (algorithm == "SHA384") this.ch.init(this.ch.SHA384);
				else if (algorithm == "SHA512") this.ch.init(this.ch.SHA512);

				this.remaining = file.fileSize;

				this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
				this.timer.initWithCallback(this, 10, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
			}
		},
		notify: function (timer) {
			if (this.running && this.remaining > 0) {
				let bytes;
				if (this.remaining > this.chunk_size) {
					bytes = this.chunk_size;
				} else {
					bytes = this.remaining;
				}
				if (this.ch != null && this.istream != null) {
					this.ch.updateFromStream(this.istream, bytes);
					this.remaining = this.remaining - bytes;

					let progress = (1 - this.remaining / (this.file.fileSize)) * 100;
					this.stck.ownerDocument.getElementById("downloadbar-itempanel-flhshlbl").value = DownloadBar.gtPrpVlAdvncd("downloadbar-optsprprts", "downloadbaropts.clcltng") + "... " + parseInt(progress) + "%";

					if (this.timer != null) this.timer.initWithCallback(this, this.interval, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
				}
			}
			else {
				this.finalize(this.ch, this.istream, this.remaining);
			}
		},
		finalize: function (ch, istream, pending) {
			if (this.running) {
				var hash = ch.finish(false);

				var s = [];
				var i;
				for (i in hash) {
					s[i] = ("0" + hash.charCodeAt(i).toString(16)).slice(-2);
				}
				this.result = s.join("");

				this.stck.ownerDocument.getElementById("downloadbar-itempanel-flhshlbl").value = this.result;
				this.stck.setAttribute("MD5", this.result);

				this.running = false;
				this.istream.close();
				this.istream = null;
				this.file = null;
				this.stck = null;
				this.chunk_size = 0;
				this.interval = 0;
				this.ch = null;
				this.remaining = 0;
				this.timer = null;

			} else {
				this.cancel();
			}
		},
		cancel: function () {
			if (this.running) {
				this.running = false;
				this.istream.close();
				this.istream = null;
				this.file = null;
				this.stck = null;
				this.chunk_size = 0;
				this.interval = 0;
				this.ch = null;
				this.remaining = 0;
				this.timer = null;
			}
		}
	},
	unload: function (event) {

		let document = event.currentTarget.document;
		let window = document.defaultView;

		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator(DownloadBar.windowtype);
		let w = 0;
		while (enumerator.hasMoreElements()) {
			enumerator.getNext();
			w++;
		}

		let uiid = DownloadBar.gtuiid();
		let stcks = document.getElementById(uiid).getElementsByTagName("stack");
		let allcompleted = true;

		for (var i = -0; i < stcks.length; i++) {
			if (stcks[i].getAttribute("downcompleted") != "true") {
				allcompleted = false;
			}
		}

		if (brnch.getBoolPref("extensions.downloadbar.continuedownloadsonquit") && w == 0 && !allcompleted) window.openDialog("chrome://downloadbar/content/downloads.xhtml", "about:downloads", "centerscreen,chrome,resizable");

	},
	brwsrVrlyPrprts: Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://downloadbar/locale/browserOverlay.properties"),
	ptnsPrprts: Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://downloadbar/locale/options.properties"),
	brwsrVrlyPrprts_b1: Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://downloadbar/locale/browserOverlay_b1.properties"),
	gtPrpVl: function (prop) {
		return this.brwsrVrlyPrprts.GetStringFromName(prop);
	},
	gtPrpVlAdvncd: function (strngBndlId, prop) {
		if (strngBndlId == "downloadbar-optsprprts") return this.ptnsPrprts.GetStringFromName(prop);
		else if (strngBndlId == "downloadbar-prprts_b1") return this.brwsrVrlyPrprts_b1.GetStringFromName(prop);
	},
	hasDLProgress: function (dl) {
		if (this.ff26above) return dl.hasProgress;
		else return dl.percentComplete != -1;
	},
	windowtype: "navigator:browser",
	openTab: function (window, URI) {
		switch (Services.appinfo.name) {
			case "Thunderbird":
				Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("mail:3pane").document.getElementById("tabmail").openTab("contentTab", { contentPage: URI, clickHandler: ("") });
				break;
			case "Fennec": break;
			default: //"Firefox", "SeaMonkey"
				let gBrowser = window.gBrowser;
				gBrowser.selectedTab = gBrowser.addTab(URI, { relatedToCurrent: true, triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() });
		}
	},
	gtTrgtPth: function (s) {
		let path;
		if (DownloadBar.ff26above) {
			path = s.dl.target.path;
		}
		else {
			if (s.dl.targetFile) {
				path = s.dl.targetFile.path;
			}
			else {
				path = s.dl.target.path;
			}
		}
		return path;
	},
	appndTllsMn: function (document) {

		let windowtype = document.documentElement.getAttribute("windowtype");

		var downloadbar_tls_root_1_menu = document.createXULElement("menu");
		downloadbar_tls_root_1_menu.setAttribute("id", "downloadbar-tls");
		downloadbar_tls_root_1_menu.setAttribute("label", "Download Status Bar");
		downloadbar_tls_root_1_menu.setAttribute("class", "menu-iconic");
		//downloadbar_tls_root_1_menu.addEventListener("command", DownloadBar.tgglbr, true);

		var downloadbar_downloads_menu_root_1_menupopup = document.createXULElement("menupopup");
		downloadbar_downloads_menu_root_1_menupopup.setAttribute("id", "downloadsbar-downnloads-tools-menu");
		downloadbar_downloads_menu_root_1_menupopup.addEventListener("popupshowing", DownloadBar.dwnldbrmnpop, true);
		var downloadbar_downloads_menu_root_1_menupopup_1_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("label", DownloadBar.gtPrpVlAdvncd("downloadbar-prprts_b1", "downloadbar.tgglbr"));
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("id", "downloadsbar-tools-dmclose");
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVlAdvncd("downloadbar-prprts_b1", "downloadbar.tgglbr"));
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.addEventListener("command", DownloadBar.togglebar, true);
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 112px, 80px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_1_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_2_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup_2_menuseparator.setAttribute("id", "downloadsbar-tools-dmclosems");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_2_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_3_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.hlp"));
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("id", "downloadsbar-tools-help");
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.hlp"));
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.addEventListener("command", DownloadBar.help, true);
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 64px, 80px, 48px) !important; list-style-image: url('chrome://downloadbar/skin/images/Crystal Project.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_3_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_4_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_4_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu = document.createXULElement("menu");
		downloadbar_downloads_menu_root_1_menupopup_5_menu.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.dwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu.setAttribute("style", "-moz-image-region: rect(48px, 112px, 64px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu.setAttribute("class", "menu-iconic");
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup = document.createXULElement("menupopup");
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.pslldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.addEventListener("command", DownloadBar.pauseall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.setAttribute("style", "-moz-image-region: rect(320px, 112px, 336px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.rsmlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.addEventListener("command", DownloadBar.resumeall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.setAttribute("style", "-moz-image-region: rect(336px, 16px, 352px, 0) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.cncllldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.addEventListener("command", DownloadBar.cancelall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.setAttribute("style", "-moz-image-region: rect(320px, 128px, 336px, 112px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_4_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_4_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.clrlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("id", "downloadsbar-tools-dmclearall");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.clrlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.addEventListener("command", DownloadBar.clearall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("style", "-moz-image-region: rect(176px, 144px, 192px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Tango.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem);
		downloadbar_downloads_menu_root_1_menupopup_5_menu.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup);
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu);
		var downloadbar_downloads_menu_root_1_menupopup_6_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_6_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_7_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.pndwnldtb"));
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("id", "downloadsbar-tools-dwnldtb");
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.pndwnldtb"));
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.addEventListener("command", DownloadBar.pndwnldtb, true);
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("style", "-moz-image-region: rect(16px, 96px, 32px, 80px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_7_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_8_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.shwlldwnldshstry"));
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("id", "downloadsbar-tools-shwDwnldsHstry");
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.shwlldwnldshstry"));
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.addEventListener("command", DownloadBar.shwlldwnldshstry, true);
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("style", "-moz-image-region: rect(32px, 144px, 48px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_8_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_9_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.sttstcs"));
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("id", "downloadsbar-tools-sttstcs");
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.sttstcs"));
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.addEventListener("command", DownloadBar.sttstcs, true);
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("style", "list-style-image: url('chrome://downloadbar/skin/images/statistics.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_9_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_10_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_10_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_11_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.ptns"));
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("id", "downloadsbar-tools-pnts");
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.ptns"));
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.addEventListener("command", DownloadBar.pnptnsdlg, true);
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 48px, 80px, 32px) !important; list-style-image: url('chrome://downloadbar/skin/images/Silk.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_11_menuitem);

		downloadbar_tls_root_1_menu.appendChild(downloadbar_downloads_menu_root_1_menupopup);
		if (windowtype == "navigator:browser") {
			if (document.getElementById("menu_ToolsPopup")) document.getElementById("menu_ToolsPopup").appendChild(downloadbar_tls_root_1_menu);
			else document.getElementById("taskPopup").appendChild(downloadbar_tls_root_1_menu);
		}
		else if (windowtype == "mail:3pane") document.getElementById("taskPopup").appendChild(downloadbar_tls_root_1_menu);

	},
	rmvTllsMn: function (document) {
		document.getElementById("downloadbar-tls").parentNode.removeChild(document.getElementById("downloadbar-tls"));
	},
	appndDtlsPnl: function (document) {
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var downloadbar_itempanel_root_1_panel = document.createXULElement("panel");
		downloadbar_itempanel_root_1_panel.setAttribute("id", "downloadbar-itempanel");
		downloadbar_itempanel_root_1_panel.setAttribute("type", "arrow");
		downloadbar_itempanel_root_1_panel.setAttribute("noautofocus", "true");
		downloadbar_itempanel_root_1_panel.addEventListener("popupshowing", DownloadBar.pnlpop, true);
		downloadbar_itempanel_root_1_panel.setAttribute("activeid", "null");
		downloadbar_itempanel_root_1_panel.addEventListener("popuphiding", DownloadBar.pnlhid, true);
		downloadbar_itempanel_root_1_panel.setAttribute("flip", "slide");
		downloadbar_itempanel_root_1_panel.setAttribute("leftclick", "false");
		if (Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS == "Darwin" && DownloadBar.gtuiid() == "downloadbar-downloadpanel") downloadbar_itempanel_root_1_panel.setAttribute("level", "top");//top is necessary
		downloadbar_itempanel_root_1_panel.setAttribute("side", "top");
		downloadbar_itempanel_root_1_panel.setAttribute("position", "bottomcenter topleft");
		var downloadbar_itempanel_root_1_panel_1_vbox = document.createXULElement("vbox");
		downloadbar_itempanel_root_1_panel_1_vbox.setAttribute("style", "padding:5px;");
		var downloadbar_itempanel_root_1_panel_1_vbox_1_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_1_hbox.setAttribute("align", "center");
		//downloadbar_itempanel_root_1_panel_1_vbox_1_hbox.setAttribute("style", "padding:0px 4px 4px 4px;");
		var downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_1_image = document.createXULElement("image");
		downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_1_image.setAttribute("src", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_1_image.setAttribute("id", "downloadbar-itempanel-imgcn");
		downloadbar_itempanel_root_1_panel_1_vbox_1_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_1_image);
		var downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_2_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_2_label.setAttribute("id", "downloadbar-itempanel-flnmbl");
		downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_2_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_1_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_1_hbox_2_label);
		downloadbar_itempanel_root_1_panel_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_1_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox.setAttribute("align", "center");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox = document.createXULElement("vbox");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox.setAttribute("style", "margin-top:2px !important;");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.src") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_1_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.trgt") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_2_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox.setAttribute("id", "downloadbar-itempanel-vrgspdnmhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.vrgspd") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_3_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox.setAttribute("id", "downloadbar-itempanel-crrntspdnmhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.crrntspd") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_4_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.prgrs") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_5_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox.setAttribute("id", "downloadbar-itempanel-rmngtmnmhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.rmngtm") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_6_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox.setAttribute("id", "downloadbar-itempanel-dwnldtmnmhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.dwnldtm") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_7_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox.setAttribute("id", "downloadbar-itempanel-dwnldbytnmhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.dwnldbyt") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_8_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox.setAttribute("id", "downloadbar-itempanel-flsznmhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.flsz") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_9_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox.setAttribute("align", "right");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox.setAttribute("class", "downloadbar-itempanel-hblft");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox.setAttribute("id", "downloadbar-itempanel-flhshnmhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.md5hsh") + " :");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox_10_hbox);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_1_vbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox = document.createXULElement("vbox");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox.setAttribute("style", "margin-top:2px !important;");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox.setAttribute("id", "downloadbar-itempanel-src");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.addEventListener("click", DownloadBar.gtsrc, true);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.setAttribute("style", "border:none !important;");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.setAttribute("id", "downloadbar-itempanel-srclbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.setAttribute("value", "null");
		if (brnch.getBoolPref("extensions.downloadbar.trimsourceurl")) downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.setAttribute("crop", "end");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.setAttribute("flex", "1");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.setAttribute("width", "150");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label.setAttribute("context", "downloadsbar-copy-menu");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_1_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox.setAttribute("id", "downloadbar-itempanel-trgtvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox_1_label.addEventListener("click", DownloadBar.showtrgt, true);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox_1_label.setAttribute("style", "border:none !important;");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox_1_label.setAttribute("id", "downloadbar-itempanel-trgtlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox_1_label.setAttribute("context", "downloadsbar-copy-menu");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_2_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox.setAttribute("id", "downloadbar-itempanel-vrgspdvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox_1_label.setAttribute("id", "downloadbar-itempanel-vrgspdlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_3_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox.setAttribute("id", "downloadbar-itempanel-crrntspdvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox_1_label.setAttribute("id", "downloadbar-itempanel-crrntspdlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_4_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox_1_label.setAttribute("id", "downloadbar-itempanel-pgrsslbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_5_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox.setAttribute("id", "downloadbar-itempanel-rmngtmvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox_1_label.setAttribute("id", "downloadbar-itempanel-rmngtmlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_6_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox.setAttribute("id", "downloadbar-itempanel-dwnldtmvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox_1_label.setAttribute("id", "downloadbar-itempanel-dwnldtmlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_7_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox.setAttribute("id", "downloadbar-itempanel-dwnldbytvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox_1_label.setAttribute("id", "downloadbar-itempanel-dwnldbytlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_8_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox.setAttribute("id", "downloadbar-itempanel-flszvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox_1_label.setAttribute("id", "downloadbar-itempanel-flszlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_9_hbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox = document.createXULElement("hbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox.setAttribute("class", "downloadbar-itempanel-hbright");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox.setAttribute("id", "downloadbar-itempanel-flhshvlhb");
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox_1_label = document.createXULElement("label");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox_1_label.setAttribute("id", "downloadbar-itempanel-flhshlbl");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox_1_label.setAttribute("value", "null");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox_1_label);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox_10_hbox);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_2_vbox);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox = document.createXULElement("vbox");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox.setAttribute("id", "downloadbar-ppprvwimgwrp");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox.setAttribute("align", "center");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox.setAttribute("pack", "center");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox.setAttribute("style", "margin-left:24px;");
		let imagesize = 128;
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox.setAttribute("width", imagesize + 28);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox.setAttribute("height", imagesize + 28);
		var downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image = document.createXULElement("image");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image.setAttribute("id", "downloadbar-ppprvwimg");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image.setAttribute("src", "null");
		//downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image.setAttribute("style", "box-shadow:0 0 1em grey;background-size:contain;background-repeat:no-repeat;background-position:center;background-color:white;border:1px solid grey;");
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image.setAttribute("width", imagesize);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image.setAttribute("height", imagesize);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image.addEventListener("click", DownloadBar.pnprvw, true);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox_1_image);
		downloadbar_itempanel_root_1_panel_1_vbox_2_hbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox_3_vbox);
		downloadbar_itempanel_root_1_panel_1_vbox.appendChild(downloadbar_itempanel_root_1_panel_1_vbox_2_hbox);
		downloadbar_itempanel_root_1_panel.appendChild(downloadbar_itempanel_root_1_panel_1_vbox);
		document.getElementById("mainPopupSet").appendChild(downloadbar_itempanel_root_1_panel);
	},
	rmvDtlsPnl: function (document) {
		document.getElementById("downloadbar-itempanel").parentNode.removeChild(document.getElementById("downloadbar-itempanel"));
	}

}

function setComplexCharValue(aBranch, aPrefName, aValue) {
	// var string = Components.classes["@mozilla.org/supports-string;1"]
	//                        .createInstance(Components.interfaces.nsISupportsString);
	// string.data = aValue;
	// aBranch = aBranch ? aBranch : Services.prefs;
	// aBranch.setComplexValue(aPrefName, Components.interfaces.nsISupportsString, string);

	aBranch.setStringPref(aPrefName, aValue);
}

function setPrefs(aBranch, aPrefName, aValue) {
	switch (typeof aValue) {
		case "string":
			setComplexCharValue(aBranch, aPrefName, aValue);
			return;
		case "number":
			aBranch.setIntPref(aPrefName, aValue);
			return;
		case "boolean":
			aBranch.setBoolPref(aPrefName, aValue);
			return;
	}
}

function setDefaultPrefs(aPrefName, aValue) {
	let aBranch = Services.prefs.getDefaultBranch(null);
	setPrefs(aBranch, aPrefName, aValue);
}

var WindowListener = {
	setupBrowserUI: function (window, closebar) {

		let document = window.document;
		let windowtype = document.documentElement.getAttribute("windowtype");
		let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		var downloadbar_keyset_root_1_keyset = document.createXULElement("keyset");
		var downloadbar_keyset_root_1_keyset_1_key = document.createXULElement("key");
		downloadbar_keyset_root_1_keyset_1_key.setAttribute("id", "downloadbar-tgglky");
		downloadbar_keyset_root_1_keyset_1_key.setAttribute("modifiers", "accel alt");
		downloadbar_keyset_root_1_keyset_1_key.setAttribute("key", brnch.getCharPref("extensions.downloadbar.keyshortcut"));
		downloadbar_keyset_root_1_keyset_1_key.setAttribute("oncommand", "void(0);");
		downloadbar_keyset_root_1_keyset_1_key.addEventListener("command", DownloadBar.tgglbr, true);
		downloadbar_keyset_root_1_keyset.appendChild(downloadbar_keyset_root_1_keyset_1_key);
		if (windowtype == "navigator:browser") document.getElementById("main-window").appendChild(downloadbar_keyset_root_1_keyset);
		else if (windowtype == "mail:3pane") document.getElementById("messengerWindow").appendChild(downloadbar_keyset_root_1_keyset);

		/*var downloadbar_stringbundleset_root_1_stringbundleset = document.createXULElement("stringbundleset");
		var downloadbar_stringbundleset_root_1_stringbundleset_1_stringbundle = document.createXULElement("stringbundle");
		downloadbar_stringbundleset_root_1_stringbundleset_1_stringbundle.setAttribute("id", "downloadbar-prprts");
		downloadbar_stringbundleset_root_1_stringbundleset_1_stringbundle.setAttribute("src", "chrome://downloadbar/locale/browserOverlay.properties");
		var downloadbar_stringbundleset_root_1_stringbundleset_2_stringbundle = document.createXULElement("stringbundle");
		downloadbar_stringbundleset_root_1_stringbundleset_2_stringbundle.setAttribute("id", "downloadbar-optsprprts");
		downloadbar_stringbundleset_root_1_stringbundleset_2_stringbundle.setAttribute("src", "chrome://downloadbar/locale/options.properties");
		var downloadbar_stringbundleset_root_1_stringbundleset_3_stringbundle = document.createXULElement("stringbundle");
		downloadbar_stringbundleset_root_1_stringbundleset_3_stringbundle.setAttribute("id", "downloadbar-prprts_b1");
		downloadbar_stringbundleset_root_1_stringbundleset_3_stringbundle.setAttribute("src", "chrome://downloadbar/locale/browserOverlay_b1.properties");	
		downloadbar_stringbundleset_root_1_stringbundleset.appendChild(downloadbar_stringbundleset_root_1_stringbundleset_1_stringbundle);
		downloadbar_stringbundleset_root_1_stringbundleset.appendChild(downloadbar_stringbundleset_root_1_stringbundleset_2_stringbundle);
		downloadbar_stringbundleset_root_1_stringbundleset.appendChild(downloadbar_stringbundleset_root_1_stringbundleset_3_stringbundle);	
		if(windowtype=="navigator:browser") document.getElementById("main-window").appendChild(downloadbar_stringbundleset_root_1_stringbundleset);		
		else if(windowtype=="mail:3pane") document.getElementById("messengerWindow").appendChild(downloadbar_stringbundleset_root_1_stringbundleset);*/

		var downloadbar_statusbar_menu_root_1_menupopup = document.createXULElement("menupopup");
		downloadbar_statusbar_menu_root_1_menupopup.setAttribute("id", "downloadsbar-statusbar-menu");
		downloadbar_statusbar_menu_root_1_menupopup.addEventListener("popupshowing", DownloadBar.pop, true);
		var downloadbar_statusbar_menu_root_1_menupopup_1_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_1_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.lnch"));
		downloadbar_statusbar_menu_root_1_menupopup_1_menuitem.setAttribute("id", "downloadsbar-slmenu");
		downloadbar_statusbar_menu_root_1_menupopup_1_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.lnch"));
		downloadbar_statusbar_menu_root_1_menupopup_1_menuitem.addEventListener("command", DownloadBar.launch, true);
		downloadbar_statusbar_menu_root_1_menupopup_1_menuitem.setAttribute("style", "font-weight:bold; list-style-image: url('chrome://downloadbar/skin/images/launch.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_1_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_1_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_2_menuseparator = document.createXULElement("menuseparator");
		downloadbar_statusbar_menu_root_1_menupopup_2_menuseparator.setAttribute("id", "downloadsbar-slmenusp");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_2_menuseparator);
		var downloadbar_statusbar_menu_root_1_menupopup_3_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_3_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.shwfl"));
		downloadbar_statusbar_menu_root_1_menupopup_3_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.shwfl"));
		downloadbar_statusbar_menu_root_1_menupopup_3_menuitem.addEventListener("command", DownloadBar.showfile, true);
		downloadbar_statusbar_menu_root_1_menupopup_3_menuitem.setAttribute("style", "-moz-image-region: rect(80px, 80px, 96px, 64px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_3_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_3_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_4_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_4_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.shwmngr"));
		downloadbar_statusbar_menu_root_1_menupopup_4_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.shwmngr"));
		downloadbar_statusbar_menu_root_1_menupopup_4_menuitem.addEventListener("command", DownloadBar.shwlldwnldshstry, true);
		downloadbar_statusbar_menu_root_1_menupopup_4_menuitem.setAttribute("style", "-moz-image-region: rect(32px, 144px, 48px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_4_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_4_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_5_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_5_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.vrscn"));
		downloadbar_statusbar_menu_root_1_menupopup_5_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.vrscn"));
		downloadbar_statusbar_menu_root_1_menupopup_5_menuitem.addEventListener("command", DownloadBar.scan, true);
		downloadbar_statusbar_menu_root_1_menupopup_5_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 32px, 80px, 16px) !important; list-style-image: url('chrome://downloadbar/skin/images/Silk.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_5_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_5_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_6_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_6_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.chksm"));
		downloadbar_statusbar_menu_root_1_menupopup_6_menuitem.setAttribute("id", "downloadsbar-chksm");
		downloadbar_statusbar_menu_root_1_menupopup_6_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.chksm"));
		downloadbar_statusbar_menu_root_1_menupopup_6_menuitem.addEventListener("command", DownloadBar.checksum, true);
		downloadbar_statusbar_menu_root_1_menupopup_6_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 144px, 80px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Silk.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_6_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_6_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_7_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_7_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.rnm"));
		downloadbar_statusbar_menu_root_1_menupopup_7_menuitem.setAttribute("id", "downloadsbar-rnm");
		downloadbar_statusbar_menu_root_1_menupopup_7_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.rnm"));
		downloadbar_statusbar_menu_root_1_menupopup_7_menuitem.addEventListener("command", DownloadBar.rnmnw, true);
		downloadbar_statusbar_menu_root_1_menupopup_7_menuitem.setAttribute("style", "-moz-image-region: rect(0, 112px, 16px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_7_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_7_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu = document.createXULElement("menu");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.sendto"));
		downloadbar_statusbar_menu_root_1_menupopup_8_menu.addEventListener("command", DownloadBar.sendto, true);
		downloadbar_statusbar_menu_root_1_menupopup_8_menu.setAttribute("style", "-moz-image-region: rect(224px, 32px, 240px, 16px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu.setAttribute("class", "menu-iconic");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu.setAttribute("id", "downloadsbar-sendto");
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup = document.createXULElement("menupopup");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.setAttribute("id", "downloadsbar-sendtomn");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.addEventListener("popupshowing", DownloadBar.sendtopop, true);
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.addEventListener("popuphiding", DownloadBar.sendtopophid, true);
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_1_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_1_menuitem.setAttribute("id", "downloadsbar-sendto-desktp");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_1_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.desktopfolder"));
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_1_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_1_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_2_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_2_menuitem.setAttribute("id", "downloadsbar-sendto-dwnlds");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_2_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.downloadsfolder"));
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_2_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_2_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_3_menuseparator_1 = document.createXULElement("menuseparator");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_3_menuseparator_1.setAttribute("id", "downloadsbar-sendto-customfoldersseparatorabove");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_3_menuseparator_1.setAttribute("hidden", "true");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_3_menuseparator_1);
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_3_menuseparator_2 = document.createXULElement("menuseparator");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_3_menuseparator_2.setAttribute("id", "downloadsbar-sendto-customfoldersseparatorbelow");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_3_menuseparator_2);
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_4_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_4_menuitem.setAttribute("id", "downloadsbar-sendto-cstm");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_4_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.customfolder"));
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_4_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_4_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_5_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_5_menuitem.setAttribute("id", "downloadsbar-sendto-cstm-clear");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_5_menuitem.setAttribute("hidden", "true");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_5_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.clr"));
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_5_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_5_menuitem.setAttribute("style", "-moz-image-region: rect(176px, 144px, 192px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Tango.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup_5_menuitem);
		downloadbar_statusbar_menu_root_1_menupopup_8_menu.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu_1_menupopup);
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_8_menu);
		var downloadbar_statusbar_menu_root_1_menupopup_9_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_9_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.dltfl"));
		downloadbar_statusbar_menu_root_1_menupopup_9_menuitem.setAttribute("id", "downloadsbar-dltfl");
		downloadbar_statusbar_menu_root_1_menupopup_9_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.dltfl"));
		downloadbar_statusbar_menu_root_1_menupopup_9_menuitem.setAttribute("style", "-moz-image-region: rect(16px, 48px, 32px, 32px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_9_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup_9_menuitem.addEventListener("command", DownloadBar.dltfl, true);
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_9_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_10_menuseparator = document.createXULElement("menuseparator");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_10_menuseparator);
		var downloadbar_statusbar_menu_root_1_menupopup_11_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_11_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.gtdwnlpg"));
		downloadbar_statusbar_menu_root_1_menupopup_11_menuitem.setAttribute("id", "downloadsbar-gtdwnlpg");
		downloadbar_statusbar_menu_root_1_menupopup_11_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.gtdwnlpg"));
		downloadbar_statusbar_menu_root_1_menupopup_11_menuitem.addEventListener("command", DownloadBar.gtdwnlpg, true);
		downloadbar_statusbar_menu_root_1_menupopup_11_menuitem.setAttribute("style", "-moz-image-region: rect(304px, 64px, 320px, 48px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_11_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_11_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem.setAttribute("label", "Copy Target Path");
		downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem.setAttribute("id", "downloadsbar-cpytrgtpth");
		downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem.setAttribute("tooltiptext", "Copy Target Path");
		downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem.addEventListener("command", DownloadBar.cpytrgtpth, true);
		downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem.setAttribute("style", "-moz-image-region: rect(0px, 144px, 16px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_11b_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_12_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_12_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.cpydwnldlnk"));
		downloadbar_statusbar_menu_root_1_menupopup_12_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.cpydwnldlnk"));
		downloadbar_statusbar_menu_root_1_menupopup_12_menuitem.addEventListener("command", DownloadBar.cpydwnldlnk, true);
		downloadbar_statusbar_menu_root_1_menupopup_12_menuitem.setAttribute("style", "-moz-image-region: rect(208px, 128px, 224px, 112px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_12_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_12_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_13_menuseparator = document.createXULElement("menuseparator");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_13_menuseparator);
		var downloadbar_statusbar_menu_root_1_menupopup_14_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_14_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.cncl"));
		downloadbar_statusbar_menu_root_1_menupopup_14_menuitem.setAttribute("id", "downloadsbar-cncl");
		downloadbar_statusbar_menu_root_1_menupopup_14_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.cncl"));
		downloadbar_statusbar_menu_root_1_menupopup_14_menuitem.addEventListener("command", DownloadBar.cancel, true);
		downloadbar_statusbar_menu_root_1_menupopup_14_menuitem.setAttribute("style", "-moz-image-region: rect(320px, 128px, 336px, 112px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_14_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_14_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_15_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_15_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.resume"));
		downloadbar_statusbar_menu_root_1_menupopup_15_menuitem.setAttribute("id", "downloadsbar-strt");
		downloadbar_statusbar_menu_root_1_menupopup_15_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.resume"));
		downloadbar_statusbar_menu_root_1_menupopup_15_menuitem.addEventListener("command", DownloadBar.start, true);
		downloadbar_statusbar_menu_root_1_menupopup_15_menuitem.setAttribute("style", "-moz-image-region: rect(336px, 16px, 352px, 0) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_15_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_15_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_16_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_16_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.pause"));
		downloadbar_statusbar_menu_root_1_menupopup_16_menuitem.setAttribute("id", "downloadsbar-pause");
		downloadbar_statusbar_menu_root_1_menupopup_16_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.pause"));
		downloadbar_statusbar_menu_root_1_menupopup_16_menuitem.addEventListener("command", DownloadBar.pause, true);
		downloadbar_statusbar_menu_root_1_menupopup_16_menuitem.setAttribute("style", "-moz-image-region: rect(320px, 112px, 336px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_16_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_16_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_17_menuseparator = document.createXULElement("menuseparator");
		downloadbar_statusbar_menu_root_1_menupopup_17_menuseparator.setAttribute("id", "downloadsbar-ctnsmns");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_17_menuseparator);
		var downloadbar_statusbar_menu_root_1_menupopup_18_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_18_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.clr"));
		downloadbar_statusbar_menu_root_1_menupopup_18_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.clr"));
		downloadbar_statusbar_menu_root_1_menupopup_18_menuitem.addEventListener("command", DownloadBar.clear, true);
		downloadbar_statusbar_menu_root_1_menupopup_18_menuitem.setAttribute("style", "-moz-image-region: rect(176px, 144px, 192px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Tango.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_18_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_18_menuitem);
		var downloadbar_statusbar_menu_root_1_menupopup_19_menuitem = document.createXULElement("menuitem");
		downloadbar_statusbar_menu_root_1_menupopup_19_menuitem.setAttribute("id", "downloadsbar-clrll");
		downloadbar_statusbar_menu_root_1_menupopup_19_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.clrll"));
		downloadbar_statusbar_menu_root_1_menupopup_19_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.clrll"));
		downloadbar_statusbar_menu_root_1_menupopup_19_menuitem.addEventListener("command", DownloadBar.clearall, true);
		downloadbar_statusbar_menu_root_1_menupopup_19_menuitem.setAttribute("style", "-moz-image-region: rect(176px, 144px, 192px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Tango.png') !important;");
		downloadbar_statusbar_menu_root_1_menupopup_19_menuitem.setAttribute("class", "menuitem-iconic");
		//downloadbar_statusbar_menu_root_1_menupopup_19_menuitem.setAttribute("hidden", !brnch.getBoolPref("extensions.downloadbar.enableclearallmenuitem") ? "true" : "false");
		downloadbar_statusbar_menu_root_1_menupopup.appendChild(downloadbar_statusbar_menu_root_1_menupopup_19_menuitem);
		document.getElementById("mainPopupSet").appendChild(downloadbar_statusbar_menu_root_1_menupopup);

		var downloadbar_downloads_menu_root_1_menupopup = document.createXULElement("menupopup");
		downloadbar_downloads_menu_root_1_menupopup.setAttribute("id", "downloadsbar-downnloads-menu");
		downloadbar_downloads_menu_root_1_menupopup.addEventListener("popupshowing", DownloadBar.dwnldbrmnpop, true);
		var downloadbar_downloads_menu_root_1_menupopup_1_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.clsbr"));
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("id", "downloadsbar-dmclose");
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.clsbr"));
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.addEventListener("command", DownloadBar.closebar, true);
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 112px, 80px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_1_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_1_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_2_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup_2_menuseparator.setAttribute("id", "downloadsbar-dmclosems");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_2_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_3_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.hlp"));
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("id", "downloadsbar-help");
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.hlp"));
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.addEventListener("command", DownloadBar.help, true);
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 64px, 80px, 48px) !important; list-style-image: url('chrome://downloadbar/skin/images/Crystal Project.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_3_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_3_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_4_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_4_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu = document.createXULElement("menu");
		downloadbar_downloads_menu_root_1_menupopup_5_menu.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.dwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu.setAttribute("style", "-moz-image-region: rect(48px, 112px, 64px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu.setAttribute("class", "menu-iconic");
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup = document.createXULElement("menupopup");
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.pslldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.addEventListener("command", DownloadBar.pauseall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.setAttribute("style", "-moz-image-region: rect(320px, 112px, 336px, 96px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_1_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.rsmlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.addEventListener("command", DownloadBar.resumeall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.setAttribute("style", "-moz-image-region: rect(336px, 16px, 352px, 0) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_2_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.cncllldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.addEventListener("command", DownloadBar.cancelall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.setAttribute("style", "-moz-image-region: rect(320px, 128px, 336px, 112px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_3_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_4_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_4_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.clrlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("id", "downloadsbar-dmclearall");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.clrlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.addEventListener("command", DownloadBar.clearall, true);
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("style", "-moz-image-region: rect(176px, 144px, 192px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Tango.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup_5_menuitem);
		downloadbar_downloads_menu_root_1_menupopup_5_menu.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu_1_menupopup);
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_5_menu);
		var downloadbar_downloads_menu_root_1_menupopup_6_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_6_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_65_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_65_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.clrlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_65_menuitem.setAttribute("id", "downloadsbar-dwnldtb");
		downloadbar_downloads_menu_root_1_menupopup_65_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.clrlldwnlds"));
		downloadbar_downloads_menu_root_1_menupopup_65_menuitem.addEventListener("command", DownloadBar.clearall, true);
		downloadbar_downloads_menu_root_1_menupopup_65_menuitem.setAttribute("style", "-moz-image-region: rect(176px, 144px, 192px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Tango.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_65_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_65_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_675_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_675_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_7_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.pndwnldtb"));
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("id", "downloadsbar-dwnldtb");
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.pndwnldtb"));
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.addEventListener("command", DownloadBar.pndwnldtb, true);
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("style", "-moz-image-region: rect(16px, 96px, 32px, 80px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_7_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_7_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_8_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.shwlldwnldshstry"));
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("id", "downloadsbar-shwDwnldsHstry");
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.shwlldwnldshstry"));
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.addEventListener("command", DownloadBar.shwlldwnldshstry, true);
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("style", "-moz-image-region: rect(32px, 144px, 48px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_8_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_8_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_9_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.sttstcs"));
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("id", "downloadsbar-sttstcs");
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.sttstcs"));
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.addEventListener("command", DownloadBar.sttstcs, true);
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("style", "list-style-image: url('chrome://downloadbar/skin/images/statistics.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_9_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_9_menuitem);
		var downloadbar_downloads_menu_root_1_menupopup_10_menuseparator = document.createXULElement("menuseparator");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_10_menuseparator);
		var downloadbar_downloads_menu_root_1_menupopup_11_menuitem = document.createXULElement("menuitem");
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.ptns"));
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("id", "downloadsbar-pnts");
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.ptns"));
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.addEventListener("command", DownloadBar.pnptnsdlg, true);
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("style", "-moz-image-region: rect(64px, 48px, 80px, 32px) !important; list-style-image: url('chrome://downloadbar/skin/images/Silk.png') !important;");
		downloadbar_downloads_menu_root_1_menupopup_11_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_downloads_menu_root_1_menupopup.appendChild(downloadbar_downloads_menu_root_1_menupopup_11_menuitem);
		document.getElementById("mainPopupSet").appendChild(downloadbar_downloads_menu_root_1_menupopup);

		DownloadBar.appndDtlsPnl(document);

		var downloadbar_panel_root_1_panel = document.createXULElement("panel");
		downloadbar_panel_root_1_panel.setAttribute("id", "downloadbar-panel");
		downloadbar_panel_root_1_panel.setAttribute("type", "arrow");
		downloadbar_panel_root_1_panel.setAttribute("orient", "vertical");
		downloadbar_panel_root_1_panel.setAttribute("noautofocus", "true");
		downloadbar_panel_root_1_panel.addEventListener("popupshowing", DownloadBar.dwnldpnlpop, true);
		downloadbar_panel_root_1_panel.setAttribute("flip", "both");
		downloadbar_panel_root_1_panel.setAttribute("side", "top");
		downloadbar_panel_root_1_panel.setAttribute("position", "bottomcenter topleft");
		var downloadbar_panel_root_1_panel_1_vbox = document.createXULElement("arrowscrollbox");
		downloadbar_panel_root_1_panel_1_vbox.setAttribute("id", "downloadbar-downloadpanel");
		downloadbar_panel_root_1_panel_1_vbox.setAttribute("flex", "1");
		downloadbar_panel_root_1_panel_1_vbox.setAttribute("orient", "vertical");
		downloadbar_panel_root_1_panel_1_vbox.setAttribute("maxheight", "500");
		var downloadbar_panel_root_1_panel_1_vbox_1_hbox = document.createXULElement("hbox");
		downloadbar_panel_root_1_panel_1_vbox_1_hbox.setAttribute("id", "downloadbar-pnlbll");
		downloadbar_panel_root_1_panel_1_vbox_1_hbox.setAttribute("align", "center");
		downloadbar_panel_root_1_panel_1_vbox_1_hbox.setAttribute("pack", "center");
		var downloadbar_panel_root_1_panel_1_vbox_1_hbox_1_label = document.createXULElement("label");
		downloadbar_panel_root_1_panel_1_vbox_1_hbox_1_label.setAttribute("value", "Download Status Bar");
		downloadbar_panel_root_1_panel_1_vbox_1_hbox.appendChild(downloadbar_panel_root_1_panel_1_vbox_1_hbox_1_label);
		downloadbar_panel_root_1_panel_1_vbox.appendChild(downloadbar_panel_root_1_panel_1_vbox_1_hbox);
		downloadbar_panel_root_1_panel.appendChild(downloadbar_panel_root_1_panel_1_vbox);
		document.getElementById("mainPopupSet").appendChild(downloadbar_panel_root_1_panel);

		var downloadbar_copy_menu_root_1_menupopup = document.createXULElement("menupopup");
		downloadbar_copy_menu_root_1_menupopup.setAttribute("id", "downloadsbar-copy-menu");
		var downloadbar_copy_menu_root_1_menupopup_1_menuitem = document.createXULElement("menuitem");
		downloadbar_copy_menu_root_1_menupopup_1_menuitem.setAttribute("label", DownloadBar.gtPrpVl("downloadbar.cpy"));
		downloadbar_copy_menu_root_1_menupopup_1_menuitem.setAttribute("id", "downloadsbar-cpymenu");
		downloadbar_copy_menu_root_1_menupopup_1_menuitem.setAttribute("tooltiptext", DownloadBar.gtPrpVl("downloadbar.cpy"));
		downloadbar_copy_menu_root_1_menupopup_1_menuitem.addEventListener("command", DownloadBar.copy, true);
		downloadbar_copy_menu_root_1_menupopup_1_menuitem.setAttribute("style", "font-weight:bold; -moz-image-region: rect(0px, 144px, 16px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Fugue.png') !important;");
		downloadbar_copy_menu_root_1_menupopup_1_menuitem.setAttribute("class", "menuitem-iconic");
		downloadbar_copy_menu_root_1_menupopup.appendChild(downloadbar_copy_menu_root_1_menupopup_1_menuitem);
		document.getElementById("mainPopupSet").appendChild(downloadbar_copy_menu_root_1_menupopup);

		var downloadbar_downloadbar_root_1_vbox_1_hbox = document.createXULElement("hbox");
		downloadbar_downloadbar_root_1_vbox_1_hbox.setAttribute("id", "downloadbar-bar");
		downloadbar_downloadbar_root_1_vbox_1_hbox.setAttribute("insertbefore", "addon-bar");
		downloadbar_downloadbar_root_1_vbox_1_hbox.setAttribute("style", "overflow-x:hidden;overflow-y:hidden;");
		var downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox = document.createXULElement("hbox");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.setAttribute("align", "center");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.setAttribute("pack", "center");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.setAttribute("id", "downloadsbar-mn");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.setAttribute("context", "downloadsbar-downnloads-menu");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.setAttribute("class", "db" + brnch.getCharPref("extensions.downloadbar.buttontype"));
		var downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_image = document.createXULElement("image");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_image.setAttribute("src", "chrome://downloadbar/skin/16.png");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_image);
		var downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_label = document.createXULElement("label");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.dwnlds"));
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_label);
		var downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_audio = document.createElementNS("http://www.w3.org/1999/xhtml", "audio");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_audio.setAttribute("src", "");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_audio.setAttribute("style", "visibility:collapse;");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_audio.setAttribute("id", "downloadbar-opt-doplyr");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_audio.setAttribute("preload", "auto");
		downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox_1_audio);
		downloadbar_downloadbar_root_1_vbox_1_hbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_1_vbox);
		var downloadbar_downloadbar_root_1_vbox_1_hbox_2_arrowscrollbox = document.createXULElement("arrowscrollbox");
		downloadbar_downloadbar_root_1_vbox_1_hbox_2_arrowscrollbox.setAttribute("id", "downloadbar-bar-wrbx");
		downloadbar_downloadbar_root_1_vbox_1_hbox_2_arrowscrollbox.setAttribute("flex", "1");
		downloadbar_downloadbar_root_1_vbox_1_hbox_2_arrowscrollbox.addEventListener("click", DownloadBar.rghtClckMn, true);
		downloadbar_downloadbar_root_1_vbox_1_hbox_2_arrowscrollbox.addEventListener("dblclick", DownloadBar.dblclckclrll, true);
		downloadbar_downloadbar_root_1_vbox_1_hbox_2_arrowscrollbox.setAttribute("orient", "horizontal");
		downloadbar_downloadbar_root_1_vbox_1_hbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_2_arrowscrollbox);
		var downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox = document.createXULElement("hbox");
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox.setAttribute("id", "downloadbar-bar-clrbttn");
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox.setAttribute("pack", "center");
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox.setAttribute("align", "center");
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox.setAttribute("class", "db" + brnch.getCharPref("extensions.downloadbar.buttontype"));
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox.addEventListener("click", DownloadBar.clearall, true);
		var downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox_1_image = document.createXULElement("image");
		//downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox_1_image.setAttribute("src", "chrome://downloadbar/skin/16.png");
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox_1_image.setAttribute("style", "-moz-image-region: rect(176px, 144px, 192px, 128px) !important; list-style-image: url('chrome://downloadbar/skin/images/Tango.png') !important;");
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox_1_image);
		var downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox_1_label = document.createXULElement("label");
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox_1_label.setAttribute("value", DownloadBar.gtPrpVl("downloadbar.clr"));
		downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox_1_label);
		downloadbar_downloadbar_root_1_vbox_1_hbox.appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox_3_vbox);
		if (windowtype == "navigator:browser") {
			if (document.getElementById("addon-bar")) {
				if (document.getElementById("addon-bar").parentNode == document.getElementById("browser-bottombox")) document.getElementById("addon-bar").parentNode.insertBefore(downloadbar_downloadbar_root_1_vbox_1_hbox, document.getElementById("addon-bar"));
				else document.getElementById("browser-bottombox").appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox);
			}
			else {
				document.getElementById("browser-bottombox").appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox);
				// document.getElementById("status-bar").parentNode.insertBefore(downloadbar_downloadbar_root_1_vbox_1_hbox,document.getElementById("status-bar"));
			}
		}
		else if (windowtype == "mail:3pane") {
			document.getElementById("browser-bottombox").appendChild(downloadbar_downloadbar_root_1_vbox_1_hbox);
			// document.getElementById("status-bar").parentNode.insertBefore(downloadbar_downloadbar_root_1_vbox_1_hbox,document.getElementById("status-bar"));
		}

		var downloadbar_ddnbr_root_1_toolbarbutton = document.createXULElement("toolbarbutton");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("id", "downloadbar-ddnbr");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("label", "Download Status Bar");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("tooltiptext", "Download Status Bar");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("style", "list-style-image: url('chrome://downloadbar/skin/16.png') !important;");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("type", "button");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("popup", "downloadbar-panel");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("context", "downloadsbar-downnloads-menu");
		downloadbar_ddnbr_root_1_toolbarbutton.setAttribute("removable", "true");
		var downloadbar_ddnbr_root_1_toolbarbutton_1_hbox = document.createXULElement("hbox");
		downloadbar_ddnbr_root_1_toolbarbutton_1_hbox.setAttribute("align", "center");
		downloadbar_ddnbr_root_1_toolbarbutton_1_hbox.setAttribute("class", "toolbarbutton-icon");
		var downloadbar_ddnbr_root_1_toolbarbutton_1_hbox_1_image = document.createXULElement("image");
		downloadbar_ddnbr_root_1_toolbarbutton_1_hbox.appendChild(downloadbar_ddnbr_root_1_toolbarbutton_1_hbox_1_image);
		var downloadbar_ddnbr_root_1_toolbarbutton_1_hbox_2_label = document.createXULElement("label");
		downloadbar_ddnbr_root_1_toolbarbutton_1_hbox_2_label.setAttribute("id", "downloadbar-cntr");
		downloadbar_ddnbr_root_1_toolbarbutton_1_hbox_2_label.setAttribute("value", "0:0");
		downloadbar_ddnbr_root_1_toolbarbutton_1_hbox.appendChild(downloadbar_ddnbr_root_1_toolbarbutton_1_hbox_2_label);
		downloadbar_ddnbr_root_1_toolbarbutton.appendChild(downloadbar_ddnbr_root_1_toolbarbutton_1_hbox);

		try {
			var button = downloadbar_ddnbr_root_1_toolbarbutton;

			let toolbar, currentset, idx, newInstall = false,
				toolbars = document.querySelectorAll("toolbar");

			for (let i = 0; i < toolbars.length; ++i) {
				let tb = toolbars[i];
				currentset = tb.getAttribute("currentset").split(","),
					idx = currentset.indexOf(button.id);
				if (idx != -1) {
					toolbar = tb;
					break;
				}
			}

			if (toolbar) {

				let before = null;
				if (idx != -1) {
					// Need to get ids for separators so can insert in front of them if need be.
					let separators = toolbar.getElementsByTagName("toolbarseparator");
					let j = 0;
					for (let i = 0; ((i < currentset.length) && (j < separators.length)); ++i)
						if (currentset[i] == "separator")
							currentset[i] = separators[j++].id

					// inserting the button before the first item in `currentset`
					// after `idx` that is present in the document
					for (let i = idx + 1; i < currentset.length; ++i) {
						before = document.getElementById(currentset[i]);
						if (before) {
							break;
						}
					}
				}

				(document.getElementById("navigator-toolbox") || document.getElementById("mail-toolbox")).palette.appendChild(downloadbar_ddnbr_root_1_toolbarbutton);
				toolbar.insertItem(button.id, before);

				try {//fallback
					if (!document.getElementById("downloadbar-ddnbr")) {
						toolbar.insertItem(button.id, null);
					}
				}
				catch (e) { }

			}
			else {

				if (windowtype == "navigator:browser") {

					if (!window.CustomizableUI) {//Firefox 28 and below
						var addonBar = document.getElementById("addon-bar");
						if (addonBar && !addonBar.collapsed) {
							if (!document.getElementById("downloadbar-ddnbr")) {
								(document.getElementById("navigator-toolbox") || document.getElementById("mail-toolbox")).palette.appendChild(downloadbar_ddnbr_root_1_toolbarbutton);
								addonBar.insertItem("downloadbar-ddnbr", document.getElementById("addonbar-closebutton") ? document.getElementById("addonbar-closebutton").nextSibling : document.getElementById("statusbar"));
							}
						}
						else {
							if (!document.getElementById("downloadbar-ddnbr")) {
								var navBarId = "nav-bar";
								var navBar = document.getElementById(navBarId);
								(document.getElementById("navigator-toolbox") || document.getElementById("mail-toolbox")).palette.appendChild(downloadbar_ddnbr_root_1_toolbarbutton);
								navBar.insertItem("downloadbar-ddnbr", null, null, false);
							}
						}
					}
					else {
						//Firefox 29 and later always adds to navigation toolbar as default 'cause there is no add-on bar
						if (!document.getElementById("downloadbar-ddnbr")) {
							var navBarId = "nav-bar";
							var navBar = document.getElementById(navBarId);
							(document.getElementById("navigator-toolbox") || document.getElementById("mail-toolbox")).palette.appendChild(downloadbar_ddnbr_root_1_toolbarbutton);
							navBar.insertItem("downloadbar-ddnbr", null, null, false);
						}
					}
				}
				else if (windowtype == "mail:3pane") {
					//Thunderbird
					if (!document.getElementById("downloadbar-ddnbr")) {
						var navBarId = "mail-bar3";
						var navBar = document.getElementById(navBarId);
						(document.getElementById("navigator-toolbox") || document.getElementById("mail-toolbox")).palette.appendChild(downloadbar_ddnbr_root_1_toolbarbutton);
						navBar.insertItem("downloadbar-ddnbr", null, null, false);
					}
				}
			}
		}
		catch (e) { }

		DownloadBar.appndTllsMn(document);

		if (closebar) DownloadBar.load(window, document, closebar);
		else DownloadBar.load(window, document);

		window.addEventListener("unload", DownloadBar.unload, false);

		if (!brnch.getBoolPref("extensions.downloadbar.firstrun") && window == Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow(windowtype)) {
			brnch.setBoolPref("extensions.downloadbar.firstrun", true);
			window.setTimeout(function () { DownloadBar.openTab(window, "chrome://downloadbar/content/help.xhtml") }, 1000);
		}

		// Take any steps to add UI or anything to the browser window
		// document.getElementById() etc. will work here

	},

	tearDownBrowserUI: function (window) {
		let document = window.document;

		// Take any steps to remove UI or anything from the browser window
		// document.getElementById() etc. will work here
		try { document.getElementById("downloadbar-tgglky").parentNode.parentNode.removeChild(document.getElementById("downloadbar-tgglky").parentNode); } catch (e) { }
		//try{document.getElementById("downloadbar-prprts").parentNode.parentNode.removeChild(document.getElementById("downloadbar-prprts").parentNode);}catch(e){}
		try { document.getElementById("downloadsbar-statusbar-menu").parentNode.removeChild(document.getElementById("downloadsbar-statusbar-menu")); } catch (e) { }
		try { document.getElementById("downloadsbar-downnloads-menu").parentNode.removeChild(document.getElementById("downloadsbar-downnloads-menu")); } catch (e) { }
		try { DownloadBar.rmvDtlsPnl(document); } catch (e) { }
		try { document.getElementById("downloadbar-panel").parentNode.removeChild(document.getElementById("downloadbar-panel")); } catch (e) { }
		try { document.getElementById("downloadsbar-copy-menu").parentNode.removeChild(document.getElementById("downloadsbar-copy-menu")); } catch (e) { }
		try { document.getElementById("downloadbar-bar").parentNode.removeChild(document.getElementById("downloadbar-bar")); } catch (e) { }
		try { document.getElementById("downloadbar-ddnbr").parentNode.removeChild(document.getElementById("downloadbar-ddnbr")); } catch (e) { }
		try { DownloadBar.rmvTllsMn(document); } catch (e) { }

	},

	// nsIWindowMediatorListener functions
	onOpenWindow: function (xulWindow) {
		// A new window has opened
		let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIDOMWindow);

		// Wait for it to finish loading
		domWindow.addEventListener("load", function listener() {

			domWindow.removeEventListener("load", listener, false);

			// If this is a browser window then setup its UI	  
			if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser") WindowListener.setupBrowserUI(domWindow);
			else if (domWindow.document.documentElement.getAttribute("windowtype") == "mail:3pane") WindowListener.setupBrowserUI(domWindow);

		}, false);
	},

	onCloseWindow: function (xulWindow) {
	},

	onWindowTitleChange: function (xulWindow, newTitle) {
	}
};

async function install(data) {
	(await AddonManager.getAddonByID(`${data.id}`)).__AddonInternal__.signedState = AddonManager.SIGNEDSTATE_NOT_REQUIRED;
}

function uninstall(data, reason) {

	if (reason != ADDON_UNINSTALL) return;

	var db = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
	db.append("downloadbar");
	db.remove(true);
	Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.downloadbar.").deleteBranch("");

}

function startup(data, reason) {

	Services.strings.flushBundles();

	Services.scriptloader.loadSubScript("chrome://downloadbar/content/defaults/preferences/defaults.js", { pref: setDefaultPrefs });

	let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	let dbcomp = Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject;
	dbcomp.prprPrpts();

	let isupdateavailable = false;
	if (reason == ADDON_UPGRADE || reason == ADDON_DOWNGRADE) {
		isupdateavailable = true;
	}
	let closebar = brnch.getBoolPref("extensions.downloadbar.closebar");

	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].
		getService(Ci.nsIWindowMediator);

	// Get the list of browser windows already open
	let windows = wm.getEnumerator(dbcomp.windowtype);
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext()/* .QueryInterface(Ci.nsIDOMWindow) */;
		WindowListener.setupBrowserUI(domWindow, (isupdateavailable && closebar));

		(async function (domWindow) {
			if (win.document.createXULElement) {
				if (win.location.origin + win.location.pathname == "chrome://browser/content/browser.xhtml") {
					win.gBrowser.tabs.filter(x => x.linkedBrowser.currentURI.spec == 'about:addons' && x.linkedBrowser.contentWindow).forEach(x => Services.scriptloader.loadSubScript("chrome://downloadbar/content/aboutaddons.js", x.linkedBrowser.contentWindow));
				}
			}
		})(domWindow);
	}

	(async function () {
		let documentObserver = {
			observe(document) {
				if (document.defaultView.location.href == "about:addons") Services.scriptloader.loadSubScript("chrome://downloadbar/content/aboutaddons.js", document.defaultView);
			}
		};
		Services.obs.addObserver(documentObserver, "chrome-document-loaded");
	})();

	// Wait for any new browser windows to open
	wm.addListener(WindowListener);

	var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
		.getService(Components.interfaces.nsIStyleSheetService);
	var ios = Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	var uri = ios.newURI("chrome://downloadbar/skin/downloadbar.css", null, null);
	if (!sss.sheetRegistered(uri, sss.USER_SHEET))
		sss.loadAndRegisterSheet(uri, sss.USER_SHEET);

	dbcomp.init();

}

async function shutdown(data, reason) {

	let brnch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	let dbcomp = Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject;

	// When the application is shutting down we normally don't have to clean
	// up any UI changes made
	if (reason == APP_SHUTDOWN)
		return;

	if (reason == ADDON_UPGRADE || reason == ADDON_DOWNGRADE) {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var rwin = wm.getMostRecentWindow(dbcomp.windowtype);
		brnch.setBoolPref("extensions.downloadbar.closebar", rwin.document.getElementById("downloadbar-bar").collapsed);
	}

	let wm2 = Cc["@mozilla.org/appshell/window-mediator;1"].
		getService(Ci.nsIWindowMediator);

	// Get the list of browser windows already open
	let windows = wm2.getEnumerator(dbcomp.windowtype);
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext()/* .QueryInterface(Ci.nsIDOMWindow) */;

		WindowListener.tearDownBrowserUI(domWindow);
	}

	// Stop listening for any new browser windows to open
	wm2.removeListener(WindowListener);

	var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
		.getService(Components.interfaces.nsIStyleSheetService);
	var ios = Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	var u = ios.newURI("chrome://downloadbar/skin/downloadbar.css", null, null);
	if (sss.sheetRegistered(u, sss.USER_SHEET))
		sss.unregisterSheet(u, sss.USER_SHEET);

	if (dbcomp.ff26above) {
		try {
			let public_list = await Downloads.getList(Downloads.PUBLIC);
			await public_list.removeView(dbcomp.public_view);
			//dbcomp.public_view=null;

			let private_list = await Downloads.getList(Downloads.PRIVATE);
			await private_list.removeView(dbcomp.private_view);
			//dbcomp.private_view=null;
		} catch (e) { Components.utils.reportError; }
	}
	else {
		var dm = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);
		dm.removeListener(dbcomp.ff25.downloadProgressListener);
	}

	dbcomp.unrgstrObs();

	var reg = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	reg.unregisterFactory(reg.contractIDToCID("@downloadbar.com/bs;1"), reg.getClassObjectByContractID("@downloadbar.com/bs;1", Components.interfaces.nsISupports))

}