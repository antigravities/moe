console.log("----- This is node-moe-host 0.0.0");

getDate = function(){

  // http://stackoverflow.com/a/4929629

  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  var hh = today.getHours();
  var ii = today.getMinutes();
  var ss = today.getSeconds();
        if(dd<10) {
                dd='0'+dd
        }

        if(mm<10) {
                mm='0'+mm
        }

        if( ss<10){
                ss='0'+ss;
        }

        if( ii<10){
                ii='0'+ii;
        }
  return yyyy+'-'+mm+'-'+dd + " " + hh + ":" + ii + ":" + ss;
}


// Groupees adapter

var byline = require("byline");

var process = require("child_process").spawn("./phantomjs", ["groupees.js"]);
var stdout = byline(process.stdout);

var levels = [ "DEBUG", "INFO", "RESPONSE", "ERROR" ];

stdout.on('data', function(x){
	//console.log(x.toString());
	try {
		x = JSON.parse(x);
	} catch(e){
		var y = {};
		y.type = 0;
		y.from = "(anonymous)";
		y.message = x;
		x=y;
	}
	console.log("[" + getDate() + " " + levels[x.type] + "] " + x.from + ": " + x.message);
});
