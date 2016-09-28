function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

var Page = require("webpage");
var fs = require("fs");
var system = require("system");

var process = require("child_process");
var spawn = process.spawn;

//var HumbleBTA = require("./humblebta.js");

//var time = require("./worldtime.js");

/* module.exports.onPageLoad = function(){
	if( ! TZDATAJS_INJECTED ){
		console.log("Injecting TZDataJS...");
		page.evaluate(function(){
			var script = document.createElement("script");
			script.setAttribute("src", "http://tzdata-javascript.org/tzdata-javascript.js");
			document.getElementsByTagName("body")[0].appendChild(script);
		});
		TZDATAJS_INJECTED = true;
		console.log("Done!");
	}
} */
/* try {
	loaded;
} catch(e){
	page.includeJs("https://maps.googleapis.com/maps/api/js?sensor=false", function(){
		loaded=true;
		page.evaluate(function(){
			window._MOE_GEOCODER = new google.maps.Geocoder();
			window._MOE_GEOCODE = function(place, callback){
				window._MOE_GEOCODER({"address": place}, function(r,s){
					if( s == google.maps.GeocoderStatus.OK ) callback({ lat: r[0].geometry.location.lat(), lng: r[0].geometry.location.lng() });
					else callback(null);
        page.includeJs("https://maps.googleapis.com/maps/api/js?sensor=false", function(){
                loaded=true;
                page.evaluate(function(){
                        window._MOE_GEOCODER = new google.maps.Geocoder();
                        window._MOE_GEOCODE = function(place, callback){
                                window._MOE_GEOCODER({"address": place}, function(r,s){
                                        if( s == google.maps.GeocoderStatus.OK ) callback({ lat: r[0].geometry.location.lat(), lng: r[0].geometry.location.lng() });
                                        else callback(null);
                                });
                        }
                });
        });
				});
			}
		});
	});
} */

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var donators = [];
var donatoremotes = {};

function parseConfig(){
	config = JSON.parse(fs.read("config.json"));
	config.quickreplies.forEach(function(v){
		write("Registering quickreply " + v.n);
		module.exports[v.n] = commandDummy(v.n, v.r);
	});
	donators = config.donators;
	donatoremotes = config.donatoremotes;
}


Command = function(callback, synopsis, man, isRestricted){
	this.callback = callback;
	this.synopsis = synopsis;
	this.man = man;
	this.isRestricted = isRestricted||false;
}

function commandDummy(name, message){
	return new Command(function(f,a,m){
		return message.replace("{n}", m.raw.user.name);
	}, name, message);
}

function mediaWikiScrape(url, callback, nwiki){
	var x = Page.create();
	x.open(url, function(s){
		if( s != "success" ){
			callback("(page not found)");
			x.close();
		}
		else {
			var scraped = x.evaluate(function(){
				var scraped = {};
				if( document.getElementById("firstHeading") != undefined ) scraped.title = document.getElementById("firstHeading").innerText;
				else if( document.getElementsByClassName("header-title").length >= 1 ) scraped.title = document.getElementsByClassName("header-title")[0].innerText;
				else scraped.title = "???";
				var found = false;
				var i = 0;
				scraped.text = "???";
				while( ! found && i < document.getElementById("mw-content-text").getElementsByTagName("p").length-1 ){
					var sel = document.getElementById("mw-content-text").getElementsByTagName("p")[i];
					if( sel.parentElement.getAttribute("id") != "mw-content-text" ) i++;
					else {
						scraped.text = document.getElementById("mw-content-text").getElementsByTagName("p")[i].innerText.split(".")[0] + ".";
						break;
					}
				}
				scraped.wiki = document.title.split("-")[document.title.split("-").length-1].trim();
			return scraped;
			});
			if( scraped.text.length > 400 ) scraped.text = scraped.text.substring(0,400) + "...";
			var m = nwiki + " - " + scraped.title + ": " + scraped.text + " " + x.url;
			callback(m);
			x.close();
		}
	});
}

module.exports = {};

module.exports.unknown = new Command(function(f,a,m){
	if( a[1] == "" || a.length < 2 ) a[1] = "nothing";
	var responses = [ "{x}? What's that?", "I don't know what '{x}' means.", "What's a(n) {x}?", "I apologize, English is my second language after machine code. Can you please tell me what a(n) {x} is?", "Alex has taught me a lot of things, but not about {x}. Sorry :(" ];
	var response = responses[Math.floor(Math.random()*responses.length)].replace("{x}", a[1]);
	return response;
	// return "Unknown command.";
}, "unknown ARG", "Unknown dummy command. Not meant to be called directly.");

module.exports.unknown = new Command(function(f,a,m){
	var valid = superadmin.concat(donators);

	try {
		valid.forEach(function(v){
			try {
				if( me[v] && me[v].command && me[v].command.split(" ")[0] == a[1]){
					m.sendMessage(me[v].command.split(" ").slice(1).join(" "));
					throw "done";
				}
			} catch(e){
				throw e;
			}
		});
	} catch(e){
		return;
	}

	var cmd = a.slice(1);
	cmd.unshift("%");

	commands["%"].callback(f,cmd,m);
});

module.exports.slap = new Command(function(f,a,m){
	if( a.length < 2 ){ res = "I don't know who you want to slap."; }
	else {
		res = m.raw.user.name + " slapped " + a.slice(1).join(" ") + " with a large fishbot";
		if( a[1].replace(/\./g, "").replace(/\</g, "").replace(/\>/g, "").toLowerCase().substring(0,3) == "moe" || a[1] == "me" ){
			res = m.raw.user.name + " slapped themself, because they're an ultra meanie >:(";
		}
	}
	return res;
}, "slap", "Slap someone or something.");

module.exports.hello = new Command(function(f,a,m){
	var greetings = [ "Hello", "Konnichiwa", "Ohayou", "Guten tag", "O hai", "WHY HELLO THAR", "Hey", "Hi", "What's up", "Hola" ];

	return greetings[Math.floor(Math.random()*greetings.length)] + ", " + m.raw.user.name + "!";
}, "hello", "Say hello!");
module.exports.hi = module.exports.hello;

module.exports.goodbye = new Command(function(f,a,m){
	var seeyas = [ "Bye", "Good bye", "Sayonara", "See ya", "Ciao", "Adios", "Hasta luego", "I'll see you when I see you" ];
	return seeyas[Math.floor(Math.random()*seeyas.length)] + ", " + m.raw.user.name + "!";
}, "goodbye", "Bid moe farewell.");
module.exports.bye = module.exports.goodbye;

module.exports.about = new Command(function(f,a,m){
	var cmds = "";
	try {
		if( commands ) cmds=" and have " + Object.keys(commands).length + " total commands. Phew.";
	}
	catch(e){
	}
	return "I'm moe (pronounced mo-ay), your favorite cute chatbot! I'm programmed by Alexandra F (antigravities - https://alexandra.moe/) and hosted by eeti.me in Canada. You can find more information at https://URL/. I've seen " + messages_seen + " messages, handled " + messages_handled + " (that's " + (((messages_handled/messages_seen).toFixed(4))*100) + "%!)" + cmds;
}, "about", "Learn about moe");

module.exports.echo = new Command(function(f,a){
	return a.slice(1).join(" ");
}, "echo SOMETHING", "Repeat SOMETHING.", true);

module.exports.off = new Command(function(){
	setTimeout(phantom.exit, 1000);
	return "I-I'm sorry... It won't happen again, I promise!";
}, "off", "Tell moe to go away.", true);

module.exports.kickstarter = new Command(function(f,a,m,x){
	if( a.length < 2 || ! (/https?:\/\/(www)?\.kickstarter\.com\/projects\/([0-9]*)\/(.*)/.test(a[1])) ) return "Please supply a Kickstarter URL.";
	var p = Page.create();
	p.open(a[1], function(s){
			if( (s != "success" || startsWith(p.url, "https://kck.st/")) && ! x ){ return m.sendMessage("Couldn't find that Kickstarter project. Does it exist?"); }
			var obj = p.evaluate(function(){
				var obj = {};
				obj.name = document.getElementsByClassName("green-dark")[0].innerHTML.trim();
				obj.by = document.getElementsByClassName("green-dark")[1].children[0].children[0].innerHTML.trim();
				obj.backers = document.getElementsByTagName("data")[0].innerHTML;
				obj.pledged = document.getElementsByTagName("data")[1].innerHTML.substring(1);
				obj.timeleft = document.getElementsByClassName("num")[2].innerHTML;
				obj.goal = document.getElementsByClassName("money")[1].innerHTML.trim();
				return obj;
			});
			p.close();
			m.sendMessage("Kickstarter: project \"" + obj.name + "\" by " + obj.by + " has " + obj.backers + " backers, $" + obj.pledged + " pledged of " + obj.goal + " goal, and " + obj.timeleft + " days left.");
		});
}, "kickstarter ID", "View a Kickstarter project.");

module.exports.w = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please specify a webm to link to.";
	var x = Page.create();
	x.open("https://webms.alexandra.moe/files/", function(s){
		if( s != "success" ) return "Error accessing webm server.";
		var memes = x.evaluate(function(){
			var memes = [];
			Array.prototype.slice.call(document.getElementsByTagName("a")).forEach(function(v){
				if( v.getAttribute("href") == "../" ) return;
				else memes.push(v.getAttribute("href"));
			});
			return memes;
		});
		if( memes.indexOf(a[1] + ".webm") == -1 ){
			//m.sendMessage(m.page, m.raw.chat_id, "Webm not found.");
			try {
			var found = "";
			memes.forEach(function(v){
				v=v.split(".")[0];
				if( v.indexOf(a[1]) > -1 && ! found ) found="Did you mean https://webms.alexandra.moe/#" + v.split(".")[0] + " ?";
			});
			m.sendMessage("Webm not found. " + found);
			} catch(e) {
				console.log(e);
			}
		}
		else m.sendMessage("https://webms.alexandra.moe/#" + a[1]);
		x.close();
	});
}, "w ID", "Create a link to the webm ID.");

module.exports.screenshot = new Command(function(f,a,m){
	var date=new Date();
	var name = "screenshot-" + getDate().replace(" ", "-") + ".png";
	if( a.length < 2 ) m.page.render("stor/" + name);
	else {
		var timeout = 0;
		if( a.length == 3 ){
			if( ! isNaN(parseInt(a[2])) ) timeout = parseInt(a[2]);
		}
		if( new RegExp("^https?:\/\/").test(a[1]) ){
			var x=Page.create();
			x.open(a[1], function(s){
				setTimeout(function(){
					x.render("stor/" + name);
					x.close();
				}, timeout);
			});
		} else {
			return "That isn't a valid URL.";
		}
	}
	return "Page rendered/rendering as https://URL/stor/" + name;
}, "screenshot [URL]", "Take a screenshot of what the bot sees.", true);

write("Reading word database");

nouns = [];
adjectives = [];
verbs = [];

var aspell = fs.read("2of12id.txt").split("\n");
aspell.forEach(function(v,k){
	var word = v.split(" ")[0];
	try {
		var pos = v.split(" ")[1].substring(0,1);
	} catch(e) {
		return;
	}
	if( word[0] == "-" || word[0] == "~" ) word=word.substring(1);
	if( pos == "N" ) nouns.push(word);
	else if( pos == "V" ) verbs.push(word);
	else if( pos == "A" ) adjectives.push(word);
});

write("Done reading. Loaded " + (nouns.length+adjectives.length+verbs.length) + " words.");

module.exports.think = new Command(function(f,a,m){
	// Determine the number of phrases to make
	var times = Math.floor(Math.random()*10)+1;
	var i = 0;
	var ret = "";
	
	while(i<times){
		if( i != 0 ) ret+=" ";
		var adjectiveFirst = Math.round(Math.random()*1)==0;
		if( adjectiveFirst ) ret+=adjectives[Math.floor(Math.random()*adjectives.length)] + " ";
		ret+=nouns[Math.floor(Math.random()*nouns.length)] + " ";
		ret+=verbs[Math.floor(Math.random()*verbs.length)] + " ";
		ret+=adjectives[Math.floor(Math.random()*adjectives.length)] + ".";
		
		i++;
	}
	
	return ret;
}, "think", "See what moe is thinking.");


module.exports["#"] = new Command(function(f,a,m){
	var n = nouns[Math.floor(Math.random()*nouns.length)];
	n=n.charAt(0).toUpperCase() + n.slice(1);
	var a = adjectives[Math.floor(Math.random()*adjectives.length)];
	a=a.charAt(0).toUpperCase() + a.slice(1);
	return "#" + a + n;
}, "#", "Generate a hashtag.");

module.exports.bitly = new Command(function(f,a,m){
	if( a.length < 2 || ! new RegExp("https?:\/\/bit\.ly\/[a-zA-Z0-9]{4,}").test(a[1]) ) return "Please specify a Bitly URL to expand.";
	var x = Page.create();
	x.open(a[1] + "+", function(s){
		if( s != "success" ) return m.sendMessage("Error contacting Bitly. Is that a valid link?");
		
		var obj = x.evaluate(function(){
			var obj = {};
			
			obj.title = document.getElementsByClassName("article-title")[0].innerText.trim();
			obj.longurl = document.getElementById("bitmark_long_url").innerText;
			return obj;
		});

		x.close();

		m.sendMessage("Bitly: link " + a[1] + " expands to " + obj.longurl + " (" + obj.title + ")");

	});
}, "bitly LINK", "Expand a bit.ly link");

module.exports.wiki = new Command(function(f,a,m,n){
	if( a.length < 2 ) return "Please specify an article to look up.";
	var arg=a.slice(1).join("_");
	var x = Page.create();
	x.settings.loadImages = false;
	x.open("https://en.wikipedia.org/wiki/" + arg, function(s){
		try {
		if( s != "success" ) return m.sendMessage("Couldn't get that article.");
		var ret = x.evaluate(function(){
			var txt = document.getElementsByTagName("p")[0].innerText;
			if( txt.length > 400 ) return txt.substring(0,400) + "...";
			else return txt;
		});
		var loc = x.url;
		if( ret == "Other reasons this message may be displayed:" ){
			x.open("https://en.wikipedia.org/w/index.php?search=" + arg.replaceAll("_", "+") + "&title=Special%3ASearch&go=Go", function(){
				var str = x.evaluate(function(){
					var str = "";
					if( document.getElementsByTagName("li").length < 34 ) str="(no results found)";
					else str = document.getElementsByTagName("li")[4].children[0].innerText + " - \"..." + document.getElementsByTagName("li")[4].children[1].innerText + "...\"";
					return str;
				});
				if( str == null ) str = "(no results)";
				return m.sendMessage("Wikipedia search result: " + str);
				x.close();
			});
			return;
		}
		else if( ret.substring(a[1].length) == " may refer to:" ) ret="(disambiguation page)";
		var retn = "Wikipedia: " + ret;
		if( ret == "." ) return;
		if( ! n ) retn+=" " + loc.substring(0, "https://en.wikipedia.org/wiki/".length) + encodeURIComponent(loc.substring("https://en.wikipedia.org/wiki/".length));
		m.sendMessage(retn);
		x.close();
		} catch(e){
			console.log(e);
		}
	});
}, "wiki ARTICLE", "Look up a Wikipedia page.");

//module.exports.unknown = module.exports.wiki;

module.exports.trout = new Command(function(f,a,m){
	if( a.length < 2 ){ res = "I don't know who you want to slap."; }
	else {
		res = m.raw.user.name + " slapped " + a.slice(1).join(" ") + " with a large trout";
		if( a.slice(1).join(" ") == "moe" ){
			res = m.raw.user.name + " slapped themself, because they're an ultra meanie >:(";
		}
	}
	return res;
}, "trout SOMETHING", "Slap someone with a trout.");

module.exports.reload = new Command(function(f,a,m){
	delete require.cache[fs.workingDirectory + '/commands.js'];
	try {
		commands = require("./commands.js");
	} catch(e){
		console.log("Error reloading: " + e);
	}
	return "Reloaded commands and configuration.";
}, "reload", "Reload moe's commands and configuration.", true);

module.exports.medium = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please provide a Medium article to search for.";
	var res = a[1].match(/([a-f0-9]{12})/);
	if( res.length < 1 ) return "That's not a valid Medium article.";
	else {
		var x = Page.create();
		x.open("https://medium.com/a/" + res[0], function(s){
			if( s != "success" ) m.sendMessage("Error getting that page, is it a valid Medium article?");
			var obj = x.evaluate(function(){
				var obj = {};
				obj.title = document.getElementsByTagName("h3")[0].innerText.trim();
				if( document.getElementsByTagName("p")[0].getAttribute("class") != "card-description" ) obj.desc = document.getElementsByTagName("p")[0].innerText.trim();
				else obj.desc = "";
				obj.author = document.getElementsByClassName("postMetaInline-feedSummary")[0].children[0].innerHTML.trim();
				obj.readtime = document.getElementsByClassName("readingTime")[0].innerText;
				return obj;
			});
			x.close();
			
			var orig = "Medium: \"" + obj.title + "\" by " + obj.author + " (" + obj.readtime + "): ";
			
			if( obj.desc > (512-orig.length-33) ) obj.desc=obj.desc.substring(0, 512-orig.length-33) + "...";
			m.sendMessage(orig + obj.desc + " https://medium.com/a/" + res[0]);
		});
	}
}, "medium URL", "View basic info about a Medium article.");

module.exports.suggest = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please provide a suggestion to record.";
	fs.write("requests.txt", a.slice(1).join(" ") + "\n", 'a');
	return "Suggestion recorded!";
}, "suggest WHAT", "Suggest something.");

module.exports.urban = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please provide a term to look up.";
	
	var x = Page.create();
	x.open("http://www.urbandictionary.com/define.php?term=" + a.slice(1).join("+"), function(s){
		if( s != "success" ) m.sendMesage("That's not a valid term.");
		var obj = x.evaluate(function(){
			var obj = {};
			obj.word = document.getElementsByClassName("def-header")[0].children[0].innerText;
			obj.meaning = document.getElementsByClassName("meaning")[0].innerText;
			return obj;
		});
		x.close();
		
		if(obj.meaning.length > 240 ) obj.meaning = obj.meaning.substring(0,240) + "...";
		
		if( udblacklist.indexOf(obj.word.toLowerCase()) > -1 ){
			obj.word = "(blacklisted term)";
			obj.meaning = "The term you searched for has been blacklisted. To see the definition, click here:";
		}
		m.sendMessage("Urban Dictionary: " + obj.word + " - " + obj.meaning + " " + "http://www.urbandictionary.com/define.php?term=" + a.slice(1).join("+"));
	});
}, "urban TERM", "Look up TERM in the Urban Dictionary.");

module.exports.niconico = new Command(function(f,a,m){
	
	if( a.length < 2 || ! (/http:\/\/(www)?\.nicovideo\.jp\/watch\/(s(m|o))?([0-9]*)/.test(a[1])) ) return "Please provide a Niconico video to look up.";
	
	var x = Page.create();
	x.open(a[1], function(s){
		if( s != "success" ) return m.sendMessage("That's not a valid Niconico video.");
		
		var obj = x.evaluate(function(){
			var obj = {};
			obj.title = document.getElementsByClassName("txt-title")[0].innerText;
			obj.views = document.getElementsByClassName("score-item")[0].children[0].innerText;
			obj.comments = document.getElementsByClassName("score-item")[1].children[0].innerText;
			obj.author = document.getElementsByClassName("score-item")[2].children[1].innerText;
			obj.uploaded = document.getElementsByClassName("txt-upload")[0].innerText.split(":").slice(1).join(":").trim();
			return obj;
		});
		
		x.close();
		
		m.sendMessage("Niconico: " + obj.title + " by " + obj.author + " (" + obj.views + " views, " + obj.comments + " comments, uploaded on " + obj.uploaded + ")");
		
	});
}, "niconico URL", "View info about a niconico video.");

module.exports.name = new Command(function(f,a,m){
	if( a.length < 2 ){ return "Please specify a name to change to."; }
	var x = Page.create();
	
	x.open("https://groupees.com/user_walls/THIS WON'T WORK/edit", function(s){
		if( s != "success" ){ return m.sendMessage("Error contacting Groupees."); }
		x.evaluate(function(n){
			document.getElementsByClassName("editable")[0].click();
			setTimeout(function(){
				document.getElementsByClassName("editable-input")[0].children[0].click();
				document.getElementsByClassName("editable-input")[0].children[0].value = n;
				var e = $.Event('keypress');
				e.keyCode = 13;
				$(document.getElementsByClassName("editable-input")[0].children[0]).trigger(e);
			}, 500);
		}, a.slice(1).join(" "));
		setTimeout(function(){
			x.sendEvent("keydown", x.event.key.Enter);
			setTimeout(function(){
				m.sendMessage("Changed name to " + a.slice(1).join(" "));
				botUserName = a.slice(1).join(" ");
				x.close();
			}, 500);
		}, 1000);
	});
}, "name NAME", "Change the bot's name", true);

module.exports.man = new Command(function(f,a,m){
	if( a.length < 2 ) return "Some commands: urban medium suggest wiki w think slap trout niconico bitly hi bye ks abuse help donate about. To view help for a certain command, type %man [command]. To view all commands, please visit https://URL/";
	if( ! commands[a[1]] ) return "Please specify a command to look up in the manual.";
	return commands[a[1]].synopsis + ": " + commands[a[1]].man;
}, "man", "View moe's manual.");

module.exports.help = module.exports.man;

module.exports.shoppasimulator = new Command(function(f,a,m){
	var words = [ "lol", "ur mom", "asshole", "fuck", "me", "I", "twitter followers", "free keys", "developer", "drama", "i'm press", "attention", "please", "i wasn't warned", "cyanic", "help", "cyanic", "cyanic", "cyanic", "have", "amazing", "fantastic", "great", "i don't have fake followers", "whore", "alex wants to suck me", "shoppa", "@7200", "blah", "fatty", "#prostatus", "tinder", "date", "nobody responds to me", "gay", "blahbert's mom", "anal", "ass", "troll", "i am a dumbass", "useless", "can i get unbanned" ];
	
	var number = Math.floor(Math.random()*5)+1;
	
	var sentence = "";
	
	for( var x = 0; x<number; x++ ){
		var word = Math.floor(Math.random()*words.length);
		words.splice(word, 1);
		sentence+=words[word] + " ";
	}
	
	return sentence;
}, "shoppasimulator", "Simulate Shoppa.", true);

var getDate = function(){

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

module.exports.logs = new Command(function(f,a,m){
	return "https://qtpi.club/pickup/groupees-" + getDate().split(" ")[0] + ".log";
}, "logs", "View today's logs.");

module.exports.ban = new Command(function(f,a,m){
	if( a.length < 2 || parseInt(a[1]) == NaN || isSuperAdmin(parseInt(a[1])) ) return "Banning EsKa...";
	blacklist.push(parseInt(a[1]));
	return "Banned " + a[1];
}, "ban id", "Ban a user.", true);

module.exports.unban = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please specify a user to unban.";
	if( blacklist.indexOf(parseInt(a[1])) == -1 ) return "That user wasn't banned.";
	else {
		blacklist.splice(blacklist.indexOf(parseInt(a[1])), 1);
		return "Unbanned " + a[1];
	}
}, "unban [id]", "Unban a user.", true);

module.exports.voldemort = new Command(function(f,a,m){
	return "Shoppa counter is currently at " + messages_shoppa;
}, "voldemort", "See how many times Shoppa has been said.");

module.exports.shoppa = module.exports.voldemort;

module.exports.idiotcull = new Command(function(f,a,m){
	blacklist.push(f);
	return m.raw.user.name + " started the idiot cull! Any other takers?";
}, "idiotcull", "Do not run this command.");

module.exports.ks = module.exports.kickstarter;

function mediaWikiCommand(u,n,h){
	var c = new Command(function(f,a,m){
		if( a.length < 2 ) return "Please specify an article to find.";
		mediaWikiScrape(u + a.slice(1).join("_"), function(s){
			m.sendMessage(s);
		}, c.wiki);
	}, n + " TITLE", "Show a " + h + " article.");
	c.wiki = h;
	return c;
}

module.exports.stardew = mediaWikiCommand("http://stardewvalleywiki.com/", "stardew", "Stardew Valley Wiki");
module.exports.mlp = mediaWikiCommand("http://mlp.wikia.com/wiki/", "mlp", "My Little Pony: Friendship is Magic Fan Wiki");
module.exports.mwiki = mediaWikiCommand("http://minecraft.gamepedia.com/", "mwiki", "Minecraft Wiki");
module.exports.asm = mediaWikiCommand("http://always-sometimes-monsters.wikia.com/wiki/", "asm", "Always Sometimes Monsters Wiki");
module.exports.stardeww = mediaWikiCommand("http://stardewvalley.wikia.com/wiki/", "stardeww", "Stardew Valley Wikia");
module.exports.bulbapedia = mediaWikiCommand("http://bulbapedia.bulbagarden.net/wiki/", "bulbapedia", "Bulbapedia");
module.exports.pokemon = module.exports.bulbapedia;
module.exports.vocaloid = mediaWikiCommand("http://vocaloid.wekia.com/", "vocaloid", "VOCALOID Wiki");
module.exports.miku = module.exports.vocaloid;

module.exports.tldr = new Command(function(f,a,m){
	if( ! isSuperAdmin(f) || a.length < 2 ) return fs.read("tldr-" + getDate().split(" ")[0] + ".txt");
	else {
		fs.write("tldr-" + getDate().split(" ")[0] + ".txt", a.slice(1).join(" "));
		return "Written.";
	}
}, "tldr [today]", "Catch up on all of the latest drama!");

module.exports.lmgtfy = new Command(function(f,a,m){
	if( a.length < 2 ) a="nothing";
	else a=a.slice(1).join("+");
	return "http://lmgtfy.com/?q=" + a;
}, "lmgtfy TERM", "Create a LMGTFY link for TERM.");

/* module.exports.sms = new Command(function(f,a,m){
        if( a.length < 2 ) return "Please provide shit to record.";
        fs.write("sms.txt", a.slice(1).join(" ") + "\n", 'a');
        return "Shit recorded!";
}, "sms WHAT", "Record shit Miller says."); */

module.exports.bork = new Command(function(f,a,m){
	var s = "";
	a.forEach(function(v){ s+="bork "; });
	return s;
}, "bork BORK", "Bork bork bork bork bork. Bork!");

module.exports.e2sc = module.exports.bork;

var moment = require("./moment-timezone.js");

module.exports.time = new Command(function(f,a,m){
	if( a.length < 2 ) a[1] = "America/New_York";
	var x = Page.create();

	a[1] = a[1].toLowerCase();

	if( a[1] == "tokyo" ) a[1] = "asia/tokyo";
	if( a[1] == "new_york" ) a[1] = "america/new_york";
	if( a[1] == "hell" ) a[1] = "america/new_york";
	if( a[1] == "berlin" ) a[1] = "europe/berlin";
	if( a[1] == "australia" ) a[1] = "australia/perth";

	// if( a[1] == "zones" ) return "Some time zones: GMT LosAngeles Minneapolis Indianapolis WashingtonDC Boston Lisbon Barcelona Frankfurt Vienna Minsk Beirut Bangkok Shanghai Sydney"
	try {
		//if( Object.keys(moment.tz._zones).indexOf(a[1].toLowerCase().replace(/\//, "_")) == -1 ) return "Invalid timezone.";
		if( !moment.tz.zone(a[1]) ) return "Invalid timezone.";
		var then = moment().tz(a[1]);
		return "The time in " + a[1] + " is " + then.format("YYYY-MM-DD H:mm:ss z");
	} catch(e){
		console.log(e);
	}
}, "time ZONE", "Show the time for a specific zone.");

module.exports.quote = new Command(function(f,a,m){
	if( a.length < 2 ){
		var quotep = quote[Math.floor(Math.random()*quote.length)];
		return "\"" + quotep.content + "\" -" + quotep.from;
	}

	var has = false;
	quote.forEach(function(v){
		if( v.id == a[1] ) has=true;
	});

	if( has ) return "I already have that saved.";

	//page.onError = console.log;
	var message = page.evaluate(function(x){
		var message = null;
		Array.prototype.slice.call(document.getElementsByClassName("message")).forEach(function(v){
			if( v.getAttribute("data-mid") == x ){
				if( v.getElementsByClassName("content")[0].innerText.substring(0,1) == "%" || v.getElementsByClassName("content")[0].innerText.substring(0,1) == "!" ) return "";
				message = {};
				message.id = v.getAttribute("data-mid");
				message.from = v.getElementsByClassName("name")[0].innerText;
				message.content = v.getElementsByClassName("content")[0].innerText;
				message.time = new Date(v.getElementsByClassName("time")[0].getAttribute("title")).toISOString();
			}
		});
		return message;
	}, a[1]);

	if( message === null || message == "" ) return "That message wasn't found.";
	if( message.from == botUserName ) return "Why would I want to quote myself?";
	quote.push(message);
	return "Saved!";
}, "quote ID", "Save a quote.");

module.exports.ytmnd = new Command(function(f,a,m){

	if( a.length < 2 ) return "Man not found, dog!";

	function callback(o){
		if( o == "Man not found, dog!" ) m.sendMessage("Man not found, dog!");
		var nsfw = "";
		if( o.site.work_safe == "n" ) nsfw = "(nsfw) ";
		if( o.site.description.length > 200 ) o.site.description=o.site.description.substring(0,200);
		m.sendMessage("YTMND - \"" + nsfw + o.site.title + "\" by " + o.site.user.user_name + " was created on " + o.site.created + " and has " + o.site.views.all_time + " views (" + o.site.views.today + " today). \"" + o.site.description + "\" http://" + o.site.domain + ".ytmnd.com/");
	}

        var n = Page.create();

        n.open("http://" + a[1] + ".ytmnd.com/", function(s){
                if( s != "success" || n.url == "http://mannotfounddog.ytmnd.com/" ){
                        n.close();
                        return callback("Man not found, dog!");
                }
                var surl = n.evaluate(function(){
                        return ytmnd.site_data_url;
                });
                n.open("http://x.ytmnd.com" + surl, function(s){
			n.close();
                        return callback(JSON.parse(n.evaluate(function(){
                                return document.getElementsByTagName("pre")[0].innerHTML;
                        })));
                });
        });
}, "ytmnd SITE", "View quick details about a YTMND site.");

module.exports.googl = new Command(function(f,a,m){
	if( a.length < 2 || ! a[1].match(/https?:\/\/goo\.gl\/(\w{1,6})/) ) return "Please enter a URL to expand.";

	var n = Page.create();

	n.open("https://www.googleapis.com/urlshortener/v1/url?shortUrl=" + a[1] + "&key=KEY", function(s){
		try {
			if( s != "success" ) return m.sendMessage("Error contacting Google.");
			var meta = JSON.parse(n.evaluate(function(){
				return document.getElementsByTagName("pre")[0].innerHTML;
			}));
			
			n.close();
			return m.sendMessage("goo.gl - " + meta.id + " expands to " + meta.longUrl);
		} catch(e){
			console.log(e);
		}
	});
}, "googl LINK", "Expand a goo.gl link");

var fx = require("./money.js");

function conv(a,f,t){
	if( ! fx.rates[f] || ! fx.rates[t] ) return "Invalid currencies.";
	return a + " " + f + " is about " + fx(a).from(f).to(t) + " " + t;
}

module.exports.currency = new Command(function(f,a,m){
	if( a.length < 4 || isNaN(parseFloat(a[1])) ) return "Please specify an amount of currency, the currency unit that it's in, and the currency unit that you want to convert to.";
	try {
		if( ! fs.exists("stor/" + getDate().split(" ")[0] + ".oxr") ){
			var n = Page.create();
			n.open("https://openexchangerates.org/api/latest.json?app_id=55acc5a3be264e2fa0e454b2c2c83677", function(s){
				if( ! s ) return m.sendMessage("Error contacting OpenExchangeRates.");
				var oxr = n.evaluate(function(){
					return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML);
				});
				fs.write("stor/" + getDate().split(" ")[0] + ".oxr", JSON.stringify(oxr));
				fx.rates = oxr.rates;
				fx.base = oxr.base;
				var from = a[2].toUpperCase();
				var to = a[3].toUpperCase();
				var cur = parseFloat(a[1]);
				n.close();
				return m.sendMessage(conv(cur, from, to));
			});
		}
		else {
			var oxr = JSON.parse(fs.read("stor/" + getDate().split(" ")[0] + ".oxr"));
			var from = a[2].toUpperCase();
			var to = a[3].toUpperCase();
			var cur = parseFloat(a[1]);
			fx.rates = oxr.rates;
			fx.base = oxr.base;
			return m.sendMessage(conv(cur,from,to));
		}
	} catch(e) {
		console.log(e);
	}

}, "currency AMOUNT FROM TO", "Convert currency.");

module.exports.$ = module.exports.currency;

module.exports.pet = new Command(function(){
	var responses = [ "kittylove:", ":3", "<3", "Hehe... *giggle*", ":P", ":D", ":inlove", ":*", "kitty:", "hug:", ";hypedcat;", "*blushes*" ];
	return responses[Math.floor(Math.random()*responses.length)];
}, "pet", "??");
module.exports.pat = module.exports.pet;

parseConfig();

var cmds = [];
/* 
module.exports.vm = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please provide a command to run.";

	var fs = require("fs");

	function log(d){
		fs.write("stor/vm-log-" + getDate().replace(" ", "-") + ".log", d + "\n", "a");
	}

	function startChildLog(child){
		child.stdout.on("data", log);
		child.stderr.on("data", log);
	}

	function childMonitor(child){
		child.on("exit", function(){
			m.sendMessage(m.page, m.raw.chat_id, "Done! https://URL/" + "stor/vm-log-" + getDate().replace(" ", "-") + ".log");
		});
	}

	if( a[1] == "create" ){
		try {
			var child = spawn("VBoxManage", ["import", "/moedos/moedos.ova"]);
			startChildLog(child);
			childMonitor(child);
		} catch(e){
			console.log(e);
		}
	}
	else if( a[1] == "boot" ){
		var child = spawn("VBoxHeadless", ["--startvm", "DOS clean"]);
		startChildLog(child);
		childMonitor(child);
	}
	else if( a[1] == "kill" ){
		var child = spawn("VBoxManage", ["controlvm", "DOS clean", "poweroff"]);
		startChildLog(child);
		childMonitor(child);
	}
	else if( a[1] == "delete" ){
	}
	else return "Invalid command.";

}, "vm COMMAND [ARGS...]", "Manipulate moedos.", true); */

module.exports.serve = new Command(function(f,a,m){
	var recognizedDrinks = [ "beer", "wine", "vodka", "tequila", "coke", "soda", "pop", "kool-aid", "tea", "coffee", "iced tea"];
	var phrases = [ "Here's your %x, %y!", "Enjoy your %x, %y!", "This %x is on me, %y.", "Thanks, %y! Here's your %x." ];
	var f = m.raw.user.name;
	if( a.length < 2 ) return "What would you like, " + f + "?";
	if( recognizedDrinks.indexOf(a.slice(1).join(" ").toLowerCase()) > -1 ){
		return phrases[Math.floor(Math.random()*phrases.length)].replace("%x", a.slice(1).join(" ").toLowerCase()).replace("%y", f);
	} else return "A " + a.slice(1).join(" ") + "? What's that?";
}, "serve DRINK", "Have moe serve you a drink.");

module.exports.mute = new Command(function(f,a,m){
	if( parseInt(a[1]) == NaN || a.length < 2 || parseInt(a[1]) > 20 || ! isFinite(a[1]) || parseInt(a[1]) < 1 ) return "Please specify a valid number of minutes (from 1-20) for me to be quiet.";

	setTimeout(function(){
		muted = false;
	}, parseInt(a[1])*60000);
	muted=true;

	return "O-ok... I'll take a nap for " + a[1] + " minutes now... Sorry. :(";
}, "nap MINUTES", "Tell moe to be quiet. But don't do it much, you might hurt her feelings. :(", true);

module.exports.nap = module.exports.mute;

module.exports.unmute = new Command(function(f){
	if( ! muted ) return "But I'm already awake!";
	muted = false;
	return "*yawn* What's up?";
}, "wake", "Tell moe to wake up.", true);
module.exports.wake = module.exports.unmute;

module.exports.doyouwanna = new Command(function(){
	return "I don't want to do that.";
}, "doyouwanna SOMETHING", "Ask moe if she wants to do something.");

module.exports.doyouwantto = module.exports.doyouwanna;

module.exports.teenager = new Command(function(){
	if( ! teenager ){
		teenager=true;
		return "UGH! Fine, whatever.";
	} else {
		teenager=false;
		return "I suddenly feel less angsty.";
	}
}, "teenager", "Toggle teenager mode.", true);

module.exports.compare = new Command(function(f,a,m){

	var inf = parseInt("10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

	if( a[1] == "Infinity" ) a[1] = inf;
	else a[1] = parseInt(a[1]);

	if( a[2] == "Infinity") a[2] = inf;
	else a[2] = parseInt(a[2]);

	var ops = [];

	if( a[1] == a[2] ) ops.push("==");
	if( a[1] > a[2] ) ops.push(">");
	if( a[1] < a[2] ) ops.push("<");
	if( a[1] === a[2] ) ops.push("===");

	return a[1] + " " + ops.join(", ") + " " + a[2];

}, "compare X Y", "Because JavaScript comparisons are dumb.");

module.exports.steve = new Command(function(f,a,m){
	return "Hi, it's Steve Ballmer, former CEO of Microsoft and owner of the LA Clippers. I'm currently unavailable as I am programming apps for UWP, but if you are a developer, please leave a message after the beep. If you are from Apple, FUCK OFF. Thank you. ... BEEP";
}, "steve", "See what Steve has to say.");

module.exports.dns = new Command(function(f,a,m){
	if( a.length < 3 ) return "Please specify one of r(esolve), n(s) and a domain.";

	function esc(a){
		var ret = a.replace(/[^\\]'/g, function(m, i, s) {
			return m.slice(0, 1) + '\\\'';
		});
		return ret;
	}
	try {
		a[1]=esc(a[1]).replace(/\;/, "");
		a[2]=esc(a[2]).replace(/\;/, "");
		require("child_process").execFile("node", ["dns.js", a[1], a[2]], null, function(e,o,s){
			if( e ) return console.log(e);
			if( s && s != "" ) m.sendMessage(s.split("\n")[0]);
			m.sendMessage(o);
		});
	} catch(e){
		console.log(e);
	}
}, "dns [n|r] DOMAIN", "Do various DNS operations on DOMAIN.");

module.exports.rip = new Command(function(f,a,m){
	var n = Page.create();
	n.open("https://steamgaug.es/api/v2", function(s){
		if( s != "success" ) return m.sendMessage("Error contacting Steam Gauges.");
		try {
			var x = n.evaluate(function(){
				return JSON.parse(document.getElementsByTagName("pre")[0].innerText);
			});

			var ret = "Steam status: Client ";
	
			if( x.ISteamClient.online != 1 ) ret+="&#10008;";
			else ret+="&#10003;";
	
			ret+="; Community ";
	
			console.log(x["SteamCommunity"]);
	                if( x["SteamCommunity"].online != 1 ) ret+="&#10008; (" + x["SteamCommunity"].error + ")";
	                else ret+="&#10003; (" + x.SteamCommunity.time + " ms)";

			ret+="; Store ";
	
			if( x["SteamStore"].online != 1 ) ret+="&#10008; (" + x["SteamStore"].error + ")";
			else ret+="&#10003; (" + x.SteamStore.time + " ms)";

			ret+="; API ";
			if( x["ISteamUser"].online != 1 ) ret+="&#10008; (" + x["ISteamUser"].error + ")";
			else ret+="&#10003; (" + x.ISteamUser.time + " ms)";

			n.close();

			m.sendMessage(ret);
		} catch(e){
			console.log(e);
		}
	});

}, "steam", "View Steam status.");

module.exports.steam = module.exports.rip;

module.exports.my = new Command(function(f,a,m){

	if( a.length < 2 ) return "You're " + m.raw.user.name + " (groupees:" + f + ")!";

	var validFields = [ "steamid", "command", "clever2" ];

	a[1]=a[1].toLowerCase();
	try {
	if( a.length == 2 ){
		if( me[f] && me[f][a[1]] ) return "Your " + a[1] + " is " + me[f][a[1]];
		else return "I don't know that about you.";
	}
	else {
		if( validFields.indexOf(a[1]) == -1 ) return "TMI! TMI!!";
		else if( donators.indexOf(f) == -1 && ! isSuperAdmin(f) && a[1] == "command" ) return "You require more permissions to set this.";
		else {
			if( ! me[f] ) me[f] = {};
			me[f][a[1]] = a.slice(2).join(" ");
			return "Okay, I'll remember that!";
		}
	}
	} catch(e){
		console.log(e);
	}

}, "my OPTION (ARGS...)", "Tell moe a bit about yourself.");

module.exports.erase = new Command(function(f,a,m){
	if( a.length < 1 ) return "Specify a user to format.";
	me[a[1]] = {};
	return "User " + a[1] + " formatted.";
}, "erase UID", "Erase a user's data.", true);

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

var linux = null;
var busy = false;
var cap = false;
var capped = "";
var capTimeout = null;
module.exports.linux = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please supply a valid operation.";
	if( a[1] == "boot" ){
		if( linux != null ) return "Please shut down the current machine (using %linux shutdown) before starting a new one.";
		linux = Page.create();
		linux.open("https://SOME-SITE/", function(s){
			if( s != "success" ){
				linux.close();
				linux = null;
				return m.sendMessage("Error contacting eeti.me. Please try again later.");
			}

			linux.onConsoleMessage = function(msg){
				if( msg.split(" ")[0] == "001" ){
					return m.sendMessage("Done! To run commands in the emulator, use %linux run [COMMAND]. Please make a habit of chaining commands using &&, or by using PMs. Spammers will be banned.");
				}

				if( cap ){
					clearTimeout(capTimeout);
					capTimeout = setTimeout(function(){
						cap = false;
						busy = false;
						fs.write("stor/" + getDate().replace(" ", "-") + ".log", capped);
						capped = "";
						return m.sendMessage("Done! https://URL/" + getDate().replace(" ", "-") + ".log");
					}, 2000);

					capped=msg;
				}
			}
		});

	}
	else if( a[1] == "run" && a.length > 2 ){
		if( linux == null ) return "Please start a machine (using %linux boot) before running commands.";
		if( busy ) return "Sorry, I'm busy right now. Please try again later.";
		if( a[2][0] == "\\" ) return "Bypassing aliases is not nice.";
		busy = true;
		linux.evaluate(function(c){
			send(c);
		}, htmlDecode(a.splice(2).join(" ")));

		cap = true;

		/* setTimeout(function(){
			// never mind, we're using a serial port, so try to log the output to a file
			//linux.render("stor/linux-" + getDate().replace(" ", "-") + ".png");
			//m.sendMessage(m.page, m.raw.chat_id, "Done! https://URL/stor/linux-" + getDate().replace(" ", "-") + ".png");
			cap = true;
			busy = false;
		}, 3000); */
	}
	else if( a[1] == "shutdown" ){
		if( linux == null ) return "There is currently no machine running.";
		if( busy ) return "Sorry, I'm busy right now. Please try again later.";
		linux.close();
		linux = null;
		busy = false;
		return "Machine shut down.";
	}
	else if( a[1] == "screenshot" ){
		if( linux == null ) return "There is currently no machine running.";
		linux.render("stor/linux-" + getDate().replace(" ", "-") + ".png");
		return "Done! https://URL/stor/linux-" + getDate().replace(" ", "-") + ".png";
	}
	else {
		return "Please supply a valid operation.";
	}

}, "linux OPTION (ARGS...)", "Interact with the Linux emulator.");

try {
	udblacklist;
	udtimeout;
} catch(e){
	udblacklist = [];
	if( fs.exists("udblacklist.json") ) udblacklist=JSON.parse(fs.read("udblacklist.json"));
	udtimeout=setTimeout(function(){
		fs.write("udblacklist.json", JSON.stringify(udblacklist));
	}, 10000);
}

module.exports.udblacklist = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please specify a term to blacklist.";

	var term = a.slice(1).join(" ").toLowerCase();
	if( udblacklist.indexOf(term) > -1 ) return "That term is already blacklisted.";
	else {
		udblacklist.push(term);
		return "Blacklisted '" + term + "'";
	}
}, "udblacklist TERM", "Blacklist an Urban Dictionary term.", true);

module.exports.udunblacklist = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please specify a term to unblacklist.";
	var term = a.slice(1).join(" ").toLowerCase();
	if( udblacklist.indexOf(term) > -1 ){
		udblacklist.splice(udblacklist.indexOf(term), 1);
		return "Unblacklisted '" + term + "'";
	}
	else return "That term isn't blacklisted.";
}, "udunblacklist TERM", "Unblacklist an Urban Dictionary term.", true);

module.exports["~"] = new Command(function(f,a,m){

	if( a.length < 2 ) return "Hello from Automemerator";

	if( a[1] == "sexdungeonon" || a[1] == "dungeonon" ) return "Sex dungeon has been enabled.";
	else if( a[1] == "sexdungeonoff" || a[1] == "dungeonoff" ) return "Sex dungeon has been disabled.";
	else if( a[1] == "sexdungeonclear" || a[1] == "dungeonclear" ) return "Removed all fluids from the sex dungeon.";

	else return "Hello from Automemerator";

}, "~ OPERATION", "Work with the Automemerator.");

try {
	btaTimeout;
} catch(e){
	bta = 999.99;
	btaLast = 999.99;
	if( fs.exists("bta.json") ){
		var tmp = JSON.parse(fs.read("bta.json"));
		bta = tmp.bta;
		btaLast = tmp.btaLast;
	}
	btaTimeout = setInterval(function(){
		fs.write("bta.json", JSON.stringify({bta: bta, btaLast: btaLast, writeTime: Date.now()}));
	}, 10000);
}

module.exports.bta = new Command(function(f,a,m){
	var x = Page.create();
	var slug = "";
	if( a.length > 1 ) slug=a[1];
	x.open("https://humblebundle.com/" + slug, function(s){
		try {
		if( s != "success" ) return m.sendMessage("Error contacting Humble.");

		var retn = x.evaluate(function(){
			var retn = null;
			try {
				retn = document.getElementsByClassName("bta")[0].innerText.split("\n")[0].trim().replace(" also", "").replace("!", "") + " the current Humble bonuses.";
			} catch(e) { }
			return retn;
		});

		if( retn == null ) m.sendMessage("Couldn't get the current BTA price. Is there a bundle going on? (last known: $" + bta + ")");
		else {
			var bl = btaLast;
//			console.log(retn);
			//console.log(retn.match(/Pay more than the average of \$([0-9]{1,3}\.[0-9]{2}) to unlock the current Humble bonuses\./));
			btaLast = parseFloat(retn.match(new RegExp(/Pay more than the average of \$([0-9]{1,3}\.[0-9]{2}) to unlock the current Humble bonuses\./))[1]);
			if( btaLast < bta ) bta = btaLast;
			m.sendMessage(retn + " The lowest recorded price was $" + bta + ", the last was $" + bl + ".");
		}

		x.close();
		} catch(e){
			console.log(e);
		}
	});
}, "bta", "View the current Humble BTA.");

module.exports.btareset = new Command(function(f,a,m){
	bta = 999.99;
	btaLast = 999.99;
	return "BTA reset.";
}, "btareset", "Reset the Humble BTA price.");

module.exports.cowsay = new Command(function(f,a,m){
	if( a.length < 2 ) return "What would you like the cow to say?";
	var append = "";
	//console.log(a[0]);
	if( a[0] != "cowsay" ){
		console.log("q");
		append=a[0].toString().substring(0,a[0].indexOf("cowsay"));
	}
	console.log(append);
	var x = Page.create();
	x.viewportSize.height = 1024;
	x.viewportSize.width = 817;
	x.open("https://SOME-SITE/?" + append, function(s){
		if( s != "success" ) return m.sendMessage("Error contacting eeti.me.");
		x.evaluate(function(str){
			document.getElementById("meme").innerText = str;
		}, htmlDecode(a.slice(1).join(" ")));
		var fn = "cowsay-" + getDate().replace(" ", "-") + ".png";
		x.render("stor/" + fn);
		m.sendMessage("Moo. https://URL/stor/" + fn);
		x.close();
	});
}, "cowsay SOMETHING", "Make a cow say something.");

module.exports.cosmiccowsay = module.exports.cowsay;
module.exports.millercowsay = module.exports.cowsay;

module.exports.pipe = new Command(function(f,a,m){

	if( a.length < 3 ) return "Please specify a command to run.";


	try {
	function commandExecutor(cmd,msg){
		if( cmd[0] == "pipe" ) return m.sendMessage("No infinite loops, pls");
		if( ! commands[cmd[0]] || ! commands[cmd[0]].callback ) cmd.unshift("unknown");
		if( ! isSuperAdmin(m.raw.user.id) && commands[cmd[0]].isRestricted ){
			return msg.sendMessage(msg.page, msg.raw.chat_id, "Sorry, but you can't do that!");
		}
		var res = commands[cmd[0]].callback(f,cmd,msg);
		if( typeof res == 'string' ) return msg.sendMessage(msg.page, msg.raw.chat_id, res);
	}

	var obj = {
		page: m.page,
		raw: m.raw,
		sendMessage: function(page,raw,msg){
			try {
				//m.sendMessage(m.page, m.raw.chat_id, "Running: %" + a.slice(a.length-1) + " " + msg);
				var cmd = a.slice(a.length-1).concat(msg.split(" "));
				//console.log(cmd);
				//setTimeout(function(){
					commandExecutor(cmd, { page: m.page, raw: m.raw, sendMessage: function(p,i,m){
						sendMessage(p,i,m);
					}});
			} catch(e){
				console.log(e);
			}
		}
	};

	commandExecutor(a.slice(1, a.length-1), obj);
	} catch(e){ console.log(e); }

}, "pipe COMMAND1 [ARGUMENTS...] COMMAND2", "Pipe the output of a command to another command.");

module.exports["|"]=module.exports.pipe;

try {
	newchatTimeout;
} catch(e){
	newchatstuff = {};
	if( fs.exists("newchat.json" ) ) newchatstuff=JSON.parse(fs.read("newchat.json"));
	newchatTimeout = setInterval(function(){
		fs.write("newchat.json", JSON.stringify(newchatstuff));
	}, 10000);
}

module.exports.newchat = new Command(function(f,a,m){
	if( a.length < 2 ){
		if( ! newchatstuff[m.raw.user.id] ) return "I don't have any information set for you.";
		else return "Your suggestion: " + newchatstuff[m.raw.user.id];
	}
	else {
		newchatstuff[m.raw.user.id] = a.slice(1).join(" ");
		return "Recorded.";
	}
}, "newchat SUGGESTION", "Write a suggestion for new chat, to be reviewed in a couple of weeks.");

module.exports.dict = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please specify a word or phrase to define.";

	var x = Page.create();
	x.open("http://dictionaryapi.net/api/definition/" + a.slice(1).join(" "), function(s){
		if( s != "success" ) return m.sendMessage("Error contacting the dictionary API.");

		var pre = x.evaluate(function(){
			return JSON.parse(document.getElementsByTagName("pre")[0].innerText);
		});

		if( pre.length < 1 ) return m.sendMessage("Word not found.");

		var def = "CIDE: " + pre[0].Word + " (" + pre[0].PartOfSpeech;

		if( pre[0].Forms.length > 0 ) def+="; see also: " + pre[0].Forms.join(",");

		def+="): " + pre[0].Definitions[0];

		return m.sendMessage(def);

	});
}, "dict WORD", "Look up a word in the dictionary. Uses the DictionaryAPI.net API, which sources from the GNU CIDE.");

module.exports.roulette = new Command(function(f,a,m){
	if( ! me[m.raw.user.id].steamid ) return "Please tell me your SteamID64 first. %my steamid 7656...";
	if( me[m.raw.user.id].steamid.substring(0,3) == "7656" ) return me[m.raw.user.id].steamid + " is an invalid Steam ID. Please set a valid Steam ID. %my steamid 7656...";

	var x = Page.create();
	x.open("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=API-KEY&format=json&steamid=" + me[m.raw.user.id].steamid + "&include_appinfo=1&include_played_free_games=1", function(s){
		if( ! s ) return m.sendMessage("Error contacting Steam.");
		var json = x.evaluate(function(){
			return JSON.parse(document.getElementsByTagName("pre")[0].innerText);
		});

		try{
		//console.log(JSON.stringify(json.response));
		//console.log(json.response.games.length);

		var key = Math.floor(Math.random()*json.response.games.length);
		var game = json.response.games[key].appid + " (" + json.response.games[key].name + ")";

		var responses = [ "Hmm, how about %g?", "I've never heard of %g but it might be good!", "Make sure you play %g.", "Maybe you should try %g!", "%g!"];
		//console.log("sending");

		return m.sendMessage(responses[Math.floor(Math.random()*responses.length)].replace("%g", "https://store.steampowered.com/app/" + game));
		} catch(e){
			return console.log(e);
		}
	});

}, "roulette", "Choose a random game from your library. Your SteamID64 must be set first using %my steamid 7656...")

//module.exports.bundlecomments = new Command(function(f,a,m){

/* module.exports.geocode = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please define a location to geocode.";
	page.evaluate(function(p,c){
		_MOE_GEOCODE(p, function(d){
			c(d);
		});
	}, a.slice(1).join(" "), function(d){
		if( d == null ) return m.sendMessage("Couldn't find what you were talking about.");
		return m.sendMessage("Latitude: " + d.lat + ", longitude: " + d.lng);
	});
}, "geocode", "Find the latitude and longitude of a location."); */

/* try {
	cleverReady;
} catch(e){
	clever = Page.create();
	clever.open("https://cleverbot.com", function(){
		cleverReady = true;
	});
} */

cleverD = "KEY"

function create(c){
	write("Connecting to Cleverbot...");
	var clever = Page.create();
	clever.open("https://cleverbot.io/1.0/create", "post", cleverD, function(s){
		try {
			if( s != "success" ) return console.log("Could not connect to Cleverbot.");
			var stuff = clever.evaluate(function(){
				return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML);
			});
			if( stuff.status != "success" ) return console.log("Could not connect to Cleverbot.io: " + status);
			cleverName = stuff.nick;
			cleverReady = true;
			write("Connected! Assigned: " + cleverName);
			c();
		} catch(e){
			console.log(e);
		}
		clever.close();
	});
}


try {
	cleverReady;
} catch(e){
	create(function(){ });
}

module.exports.flush = new Command(function(f,a,m){
	create(function(){
		return m.sendMessage("Brain flushed.");
	});
}, "flush", "Flush moe's brain.");

module.exports["%"] = new Command(function(f,a,m){
try {
	if( a.length < 2 ) return "moe's cleverness is provided by a third-party service which learns from a variety of sources and its users. Please understand that the 'opinions' of moe are entirely user-generated content and do not necessarily represent the opinions of real people. moe's brain can be flushed at any time by running %flush.";

	if( ! me[m.raw.user.id] || ! me[m.raw.user.id].clever2 ){
		if( ! me[m.raw.user.id] ) me[m.raw.user.id] = {};
		me[m.raw.user.id].clever2 = true;
		console.log("HERE");
		return m.sendMessage("Just a heads-up: data you enter into moe using the %% command may be sent to a third-party service for processing. If you're OK with this, feel free to keep sending commands. Otherwise, use %my clever2 off to opt-out.");
	}

	if( me[m.raw.user.id].clever2 != "on" && me[m.raw.user.id].clever2 !== true ) return m.sendMessage("You've opted out of using %%. To use %% again, type %my clever2 on.");

	try {
		cleverReady;
	} catch(e){
		return "Not ready yet. Please try again in a few minutes.";
	}
	var clever = Page.create();

	clever.open("https://cleverbot.io/1.0/ask", "post", cleverD + "&nick=" + cleverName + "&text=" + a.slice(1).join(" "), function(){
		var stuff = clever.evaluate(function(){
			return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML);
		});

		clever.close();
		if( stuff.status != "success" ) return m.sendMessage("Error: " + stuff.status);
		else return m.sendMessage(stuff.response);
	});

} catch(e){
	console.log(e);
}

}, "% MESSAGE", "Clevermoe. moe's cleverness is provided by a third-party service which learns from a variety of sources and its users. Please understand that the 'opinions' of moe are entirely user-generated content and do not necessarily represent the opinions of real people. moe's brain can be flushed at any time by running %flush.");

/* module.exports._intflush = new Command(function(f,a,m){
	delete me[m.raw.user.id];
	return "Done.";
}, "intflush", "intflush", true) */
/* module.exports.vanity2id = new Command(function(f,a,m){
	if( a.length < 2 ) return false;

	var x = Page.create();

	x.open("http://steamcommunity.com/id/" + a[1] + "/?xml=1", function(s){
		if( s != "success" ) return m.sendMessage(m.page, m.raw.chat_id, "Error contacting Steam. Use %rip to see Steam status.");
		if( document.getElementsByTagName("error").length > 0 ) return m.sendMessage(m.page, m.raw.chat_id, "Invalid profile.");
		console.log(document.documentElement.innerHTML);
		console.log(JSON.stringify(document.getElementsByTagName("steamID")));
		return m.sendMessage(m.page, m.raw.chat_id, document.getElementsByTagName("steamID")[0] + "'s SteamID64 is " + document.getElementsByTagName("steamID64")[0] + ".");
	});
}, "vanity2id", "Convert a Steam vanity URL to a SteamID64."); */

try {
	iownready;
} catch(e){
	iown = [];
	if( fs.exists("iown.json") ) iown=JSON.parse(fs.read("iown.json"));
	if( iown.length == 0 ){
		var x = Page.create();
		x.open("http://api.steampowered.com/ISteamApps/GetAppList/v0001/", function(s){
			if( s != "success" ) return console.log("Error contacting Steam.");

			var apps = x.evaluate(function(){
				return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML).applist.apps.app;
			});

			apps.forEach(function(v){
				iown.push(v.appid);
			});

			console.log(iown);

			iowntimeout=setInterval(function(){
				fs.write("iown.json", JSON.stringify(iown));
			}, 10000);

			iownready=true;
		});
	}
}

module.exports.iownreport = new Command(function(f,a,m){
	//if( a.length < 2 || a[1].substring(0,4) != "7656" ) return "Please provide a valid SteamID64. Vanity URLs (e.g. /id/antigravities) can be converted using %resolvevanity (e.g. %resolvevanity antigravities).";

	if( ! iownready ) return "I'm not ready yet. Please check back in a minute or so.";

	if( a.length < 2 ) return "Current game pool size: " + iown.length + ".";

	var x = Page.create();

	x.open("https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=KEY&steamid=" + a[1] + "&includeappinfo=true&include_played_free_games=false", function(s){
		try {
		if( s != "success" ) return m.sendMessage("Error contacting the Steam Community. Use %rip to see Steam status.");

		// strip game data
		var games = x.evaluate(function(s){
			//if( s != "success" ) return m.sendMessage(m.page, m.raw.chat_id, "Error contacting the Steam Community. Use %rip to see Steam status.");
			return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML).response.games;
		});

		if( games == null ){
			x.render("stor/stuff.png");
			return m.sendMessage("Error contacting the Steam Community. Use %rip to see Steam status.");
		}

		x.close();

		var appids = [];

		games.forEach(function(v){
			appids.push(v.appid);
		});

		//if( iown.length == 0 ) iown=appids;
		//else {

			appids.forEach(function(v, k){
				if( iown.indexOf(v) > -1 ) iown.splice(iown.indexOf(v),1);
			});
		//}

		return m.sendMessage("The pool has been narrowed down to " + iown.length + " games.");
		} catch(e){
			console.log(e);
		}
	});

}, "iownreport STEAMID64", "Try to figure out !iown games. Only add IDs that turned up positive when searching for games. The command finds all games the SteamIDs that were entered have in common. To start over, run %flushiown; to resolve a vanity URL, run %resolvevanity ID (ex. for /id/antigravities, type antigravities).");

module.exports.iownflush = new Command(function(f,a,m){
	iown = [];

		var x = Page.create();

                x.open("http://api.steampowered.com/ISteamApps/GetAppList/v0001/", function(s){
                        if( s != "success" ) return console.log("Error contacting Steam.");

                        var apps = x.evaluate(function(){
                                return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML).applist.apps.app;
                        });

                        apps.forEach(function(v){
                                iown.push(v.appid);
                        });

			x.close();

                        //iowntimeout=setInterval(function(){
                        //        fs.write("iown.json", JSON.stringify(iown));
                        //}, 10000);

                        iownready=true;

			return m.sendMessage("Flushed. The database now has " + iown.length + " games.");
                });

}, "flushiown", "Clear the iown cache. This data cannot be restored!");

module.exports.exportiown = new Command(function(f,a,m){

	var x = Page.create();

	x.open("http://api.steampowered.com/ISteamApps/GetAppList/v0001/", function(s){
		try {
		if( s != "success" ) return m.sendMessage("Error contacting the Steam Community. Use %rip to check Steam status.");

		var games = x.evaluate(function(){
			return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML).applist.apps.app;
		});

		x.close();

		var resp = "";

		games.forEach(function(v){
			if( iown.indexOf(v.appid) > -1 ){
				resp+=v.name + "\thttp://store.steampowered.com/app/" + v.appid + "\n";
			}
		});

		var name = "stor/" + getDate().replace(" ", "-") + ".txt";
		fs.write(name, resp);
		return m.sendMessage("Done! https://URL/" + name);
		} catch(e){
		console.log(e);
		}
	});

	return "Exporting iown database (this may take a moment...)";
});

module.exports.resolvevanity = new Command(function(f,a,m){
	if( a.length < 2 ) return "Please specify an ID to resolve.";

	var x = Page.create();

	x.open("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=KEY&vanityurl=" + a[1], function(s){
		if( s != "success" ) return m.sendMessage("Error contacting the Steam Community. Use %rip to see Steam status.");

		var json = x.evaluate(function(){
			return JSON.parse(document.getElementsByTagName("pre")[0].innerHTML).response;
		});

		x.close();

		if( json.success != 1 ) return m.sendMessage(json.message);
		else return m.sendMessage("/id/" + a[1] + "'s steamid64 is " + json.steamid);
	});

}, "resolvevanity VANITY", "Get a steamid64 from a vanity URL.");

Object.keys(module.exports).sort().forEach(function(v,k){
	if( ! module.exports[v].callback ) return;
	cmds.push({ name: v, synopsis: module.exports[v].synopsis, man: module.exports[v].man });
});

fs.write("html/commands.json", JSON.stringify(cmds));
