Components.utils.import("resource://gre/modules/osfile.jsm");
var DownloadBarRnm = {
	load: function() {
		let s=window.arguments[0];
		let basename=OS.Path.basename(DownloadBarRnm.dbcomp.DownloadBar.gtTrgtPth(s));
		let flext=basename.substring(basename.lastIndexOf(".")+1, basename.length);
		document.getElementById("rnmflnm").value=basename.substring(0,basename.lastIndexOf("."));
		document.getElementById("rnmflext").value=flext;
	},
	accept: function (event) {
		let filename=document.getElementById("rnmflnm").value+"."+document.getElementById("rnmflext").value;
		DownloadBarRnm.dbcomp.DownloadBar.onRenameAccept(window.arguments[0],filename);
		return true;
	},
	cancel: function (event) {
		window.close();
		return false;
	},
	dbcomp:	Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject
}
window.addEventListener("load",function(event){DownloadBarRnm.load();},false);