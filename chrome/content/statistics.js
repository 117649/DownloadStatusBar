
	Components.utils.import("resource://gre/modules/Downloads.jsm");
	Components.utils.import("resource://gre/modules/DownloadUtils.jsm");			
	Components.utils.import("resource://gre/modules/osfile.jsm");
	Components.utils.import("resource://gre/modules/Task.jsm");
	Components.utils.import("resource://gre/modules/DownloadIntegration.jsm");
	
	DBStatistics={
		center:function(){
			var main=document.getElementById("main");
			main.style.setProperty("top","50%","important");
			main.style.setProperty("left","50%","important");		
			main.style.setProperty("position","absolute","important");
			main.style.setProperty("width","820px","important");		
			main.style.setProperty("margin-left","-"+main.scrollWidth/2+"px","important");
			main.style.setProperty("margin-top","-"+main.scrollHeight/2+"px","important");		
		},
		rstSttstcs:function(){
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
									.getService(Components.interfaces.nsIPromptService);
			var check = {value: true};
			var result = prompts.confirmCheck(null, "Download Status Bar", document.getElementById("downloadbar-sttstcsprts").getString("downloadbarsttstcs.abttrst")+"\n"+document.getElementById("downloadbar-sttstcsprts").getString("downloadbarsttstcs.wldlkt"),null, check);
			if(result){
				Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.writeJSON("statistics.json","{}");
				var brnch=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				brnch.setBoolPref("extensions.downloadbar.statisticsswitched",true);				
				window.location.reload();
			}		
		},
		makeTransparent:function (event){
			event.target.contentDocument.body.style.backgroundColor='transparent';
		}
	}
		
	document.addEventListener("DOMContentLoaded",function(event){

		document.body.style.setProperty("padding","0","important");
		document.body.style.setProperty("margin","0","important");
		document.body.style.setProperty("width","100%","important");
		document.body.style.setProperty("overflow","hidden","important");
		document.body.style.setProperty("background-image","linear-gradient(to bottom, rgb(205, 235, 142) 0%, rgb(165, 201, 86) 100%)","important");
		document.body.style.setProperty("height",document.documentElement.clientHeight+"px","important");
		document.body.style.setProperty("background-attachment","fixed","important");	
		
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				   .getInterface(Components.interfaces.nsIWebNavigation)
				   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
				   .rootTreeItem
				   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				   .getInterface(Components.interfaces.nsIDOMWindow);

		try{
			var sttstcs=JSON.parse(Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.readJSON("statistics.json"));
		}
		catch(e){
			Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.writeJSON("statistics.json","{}");
			var sttstcs=JSON.parse(Components.classes["@downloadbar.com/bs;1"].getService().wrappedJSObject.readJSON("statistics.json"));
		}

		var statpool=sttstcs;
		var stattotalcount=0;
		var stattotalbytes=0;
			
		for(var i in sttstcs)
		{
		
			//if(!sttstcs[i].totalBytes) continue;
			
			var totalBytes=sttstcs[i].totalBytes;
			stattotalcount+=sttstcs[i].count;
			stattotalbytes+=totalBytes;
						
		}
		
		var url="http://chart.apis.google.com/chart?cht=p3";
		var s="&chd=t:"
		var s2="&chd=t:"
		var e="&chl="
		var e2="&chl="
		var f="&chs=800x200"
		//var g="&chco=0000FF,FF0000"
		var g="";
		var bg="&chf=bg,s,FFFFFF00";
				
		for(var j in statpool)
		{
		
			s+=parseFloat(statpool[j].totalBytes/stattotalbytes*100).toFixed(2)+","
			
			var k=j.toUpperCase()+" ("+parseFloat(statpool[j].totalBytes/stattotalbytes*100).toFixed(2)+"%)"+"|";
			e+=encodeURIComponent(k);

			s2+=parseFloat(statpool[j].count/stattotalcount*100).toFixed(2)+","
			
			var k2=j.toUpperCase()+" ("+statpool[j].count+")"+"|";
			e2+=encodeURIComponent(k2);
			
		}
			
		if(Object.keys(statpool).length===0) {

			document.getElementById("statbybyte").parentNode.style.display="none"
			document.getElementById("statbycount").parentNode.style.display="none"
			document.getElementById("notification").style.display="block"

		}
		
		else {
		
			s=s.replace(/,$/,"")
			s2=s2.replace(/,$/,"")

			e=e.replace(/\|$/,"")
			e2=e2.replace(/\|$/,"")
			
			document.getElementById("statbybyte").parentNode.style.display="block"
			document.getElementById("statbycount").parentNode.style.display="block"
			document.getElementById("notification").style.display="none"				

			document.getElementById("statbybyte").addEventListener("load",DBStatistics.makeTransparent,true);
			document.getElementById("statbycount").addEventListener("load",DBStatistics.makeTransparent,true);
			
			document.getElementById("statbybyte").setAttribute("src",url+s+e+f+g+bg);	
			document.getElementById("statbycount").setAttribute("src",url+s2+e2+f+g+bg);
			
		}		
		
		DBStatistics.center();			
		
	},false);
	
	window.addEventListener("load",function(){
		DBStatistics.center();
	},true);