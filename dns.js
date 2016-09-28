var dns = require("dns");

if( ! process.argv[2] || ! process.argv[3] ){
	return console.log("Error: no domain specified.");
}

//console.log(process.argv[2] + " " + process.argv[3]);

//process.argv[2]=process.argv[2].substring(1,process.argv[2].length-1);
//process.argv[3]=process.argv[3].substring(1,process.argv[3].length-1);

if( process.argv[2] == "resolve" || process.argv[2] == "r" ){
	dns.resolve(process.argv[3], function(e,a){
		if( e ) return console.log("Error: " + e);
		else console.log(process.argv[3] + " resolves to " + a.join(", "));
	});
}
else if( process.argv[2] == "ns" || process.argv[2] == "n" ){
	dns.resolveNs(process.argv[3], function(e,a){
		if( e ) return console.log("Error: " + e);
		else console.log(process.argv[3] + "'s nameservers are " + a.join(", "));
	});
}
else if( process.argv[2] == "ptr" || process.argv[2] == "p" || process.argv[2] == "reverse" ){
	dns.resolve(process.argv[3], "PTR", function(e,a){
		if( e ) return console.log("Error: " + e);
		else console.log(process.argv[3] + " resolves to " + a);
	});
}
else {
	console.log("%dns should be called with resolve or ns, and with a domain (e.g. %dns resolve eeti.me)");
}
