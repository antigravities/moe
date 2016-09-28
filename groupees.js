try {
version = "0.1.0b";

fs = require("fs");

muted = false;
teenager = false;

blacklist = [];

if( fs.exists("blacklist.json") ){
	blacklist = JSON.parse(fs.read("blacklist.json"));
}

setInterval(function(){
	fs.write("blacklist.json", JSON.stringify(blacklist));
}, 10000);

messages_shoppa = 0;

if( fs.exists("usage.json") ){
	var usage = JSON.parse(fs.read("usage.json"));
	messages_seen = usage.seen;
	messages_handled = usage.handled;
	messages_shoppa = usage.shoppa;
}
else {
	messages_seen = 0;
	messages_handled = 0;
}

setInterval(function(){
	fs.write("usage.json", "{ \"seen\": " + messages_seen + ", \"handled\": " + messages_handled + ", \"shoppa\": " + messages_shoppa + " }");
}, 10000);

quote = [];
if( fs.exists("quote.json") ){
	quote = JSON.parse(fs.read("quote.json"));
}
setInterval(function(){
	fs.write("quote.json", JSON.stringify(quote));
}, 10000);

me = {};
if( fs.exists("me.json") ){
	me = JSON.parse(fs.read("me.json"));
}
setInterval(function(){
	fs.write("me.json", JSON.stringify(me));
}, 10000);

var superadmin = [ 328344, 470115 ];

isSuperAdmin = function(x){
	return superadmin.indexOf(x) > -1;
}

startsWith = function(str1, str2){
	return str1.substring(0, str2.length) == str2;
}

page = require("webpage").create();

page.onConsoleMessage = console.log;
/*
        page.includeJs("https://maps.googleapis.com/maps/api/js?sensor=false", function(){
                page.evaluate(function(){
                        window._MOE_GEOCODER = new google.maps.Geocoder();
                        window._MOE_GEOCODE = function(place, callback){
                                window._MOE_GEOCODER({"address": place}, function(r,s){
                                        if( s == google.maps.GeocoderStatus.OK ) callback({ lat: r[0].geometry.location.lat(), lng: r[0].geometry.location.lng() });
                                        else callback(null);
                                });
				//console.log(_MOE_GEOCODER);
                        }
                });
        }); */

TYPE = {};
TYPE.DEBUG = 0;
TYPE.INFO = 1;
TYPE.RESPONSE = 2;

HostMessage = function(message, type, payload){
	this.message = message||"Generic Message";
	this.type = type||TYPE.DEBUG;
	this.payload = payload||{};
	this.from = "phantom-moe-groupees";
}

function hostCommunicator(message){
	console.log(JSON.stringify(message));
}
	write = function(msg){
		return hostCommunicator(new HostMessage(msg));
	}

commands = require("./commands.js");
commands.reload = new Command(function(f,a,m){
        delete require.cache[fs.workingDirectory + '/commands.js'];
        try {
                commands = require("./commands.js");
		commands.reload = this;
		if( Object.keys(commands).length == 1 ) throw "warning: there may have been an error reloading bot configuration.";
        } catch(e){
                write("Error reloading: " + e);
        }
        return "Reloaded commands and configuration.";
}, "reload", "Reload moe's commands and configuration.", true);

page.viewportSize = { width: 1920, height: 1080 };

write("Attempting to log in...");

antiAbuse = {};

setInterval(function(){ antiAbuse = {}; }, 60000);

page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36";

// i'm not giving you this part, figure it out yourself

function logIn(username, password, page, callback){
	phantom.exit();
}

function getTabs(page){
	return page.evaluate(function(){
		var x = [];
		Array.prototype.slice.call(document.getElementsByClassName("tab")).forEach(function(v,k){
			if( v.getAttribute("data-chat-id") == "" || v.getAttribute("data-chat-id") == null ){ return; }
			x.push({ id: v.getAttribute("data-chat-id"), name: v.children[1].innerHTML });
		});
		
		return x;
	});
}

function regexChecker(message){
	if( /https?:\/\/(www)?\.kickstarter\.com\/projects\/([0-9]*)\/(.*)/.test(message) ){
		return function(page, raw){
			commands.kickstarter.callback(raw.user.id, ("kickstarter " + message.match(/https?:\/\/(www)?\.kickstarter\.com\/projects\/([0-9].*)\/(.*)/)[0]).split(" "), { raw: raw, sendMessage: sendMessage, page: page }, true);
		};
	}
	else if( /https?:\/\/bit\.ly\/[a-zA-Z0-9]{4,}/.test(message) ){
		return function(page,raw){
			commands.bitly.callback(raw.user.id, ("bitly " + message.match(new RegExp("https?:\/\/bit\.ly\/[a-zA-Z0-9]{4,}"))).split(" "), {raw: raw, sendMessage: sendMessage, page: page }, true);
		};
	}
	else if( /https?:\/\/medium\.com\/@?(.*)\/(.*)/.test(message) ){
		return function(page,raw){
			commands.medium.callback(raw.user.id, ("medium " + message.match(/https?:\/\/medium\.com\/(@?)(.*)\/(.*)/)).split(" "), {raw: raw, sendMessage: sendMessage, page: page}, true);
		}
	}
	else if( /http:\/\/(www)?\.nicovideo\.jp\/watch\/(sm)?([0-9]*)/.test(message) ){
		return function(page,raw){
			commands.niconico.callback(raw.user.id, ("niconico " + message.match(/http:\/\/(www)?\.nicovideo\.jp\/watch\/(sm)?([0-9]*)/)[0]).split(" "), {raw: raw, sendMessage: sendMessage, page: page}, true);
		}
	}
	else if( /http\:\/\/(\w*).ytmnd.com\//.test(message) ){
		return function(page,raw){
			//console.log("calling you back " +  message.match(/http\:\/\/(\w*).ytmnd.com\//)[1]);
			commands.ytmnd.callback(raw.user.id, ["ytmnd", message.match(/http\:\/\/(\w*).ytmnd.com\//)[1]], {raw: raw, sendMessage: sendMessage, page: page}, true);
		}
	}
	else if( /https?\:\/\/goo\.gl\/(\w{1,6})/.test(message) ){
		return function(page,raw){
			//console.log(message.match(/http\:\/\/goo\.gl\/\w{1,6}/));
			commands.googl.callback(raw.user.id, ["googl", message.match(/https?\:\/\/goo\.gl\/(\w{1,6})/)[0]], {raw: raw, sendMessage: sendMessage, page: page}, true);
		}
	}
	else if( /https?:\/\/en\.wikipedia\.org\/wiki\/(.*)/.test(message) ){
		return function(page,raw){
			commands.wiki.callback(raw.user.id, ["wiki", message.match(/https?:\/\/en\.wikipedia\.org\/wiki\/(.*)/)[1]], {raw: raw, sendMessage: sendMessage, page: page}, true);
		}
	}
	else return null;
}

function refreshTabs(page, callback){
	
	// This will actually scroll past the bottom of the page but works for our purposes
	page.evaluate(function(){
		$(window).scrollTop($(document).height());
	});
	
	// Now, wait for chat to load
	setTimeout(function(){
		var doneTime = page.evaluate(function(){
			Array.prototype.slice.call(document.getElementsByClassName("tab")).forEach(function(v,k){
				setTimeout(function(){
					v.click();
				}, 1000*(k+1));
			});
			
			return document.getElementsByClassName("tab").length*1000;
		});
	
		setTimeout(callback, doneTime);
	}, 2000);
}

sendMessage = function(page, chatId, message){
	if( teenager ){
		var cc = Math.floor(Math.random()*10);
		if( cc == 1 ) message="No, I hate you!";
		else if( cc == 2 ) message="Fine, whatever! " + message;
		else if( cc == 3 ) message="I'll do this for you this time, but I can do ANYTHING I WANT if I really felt like it! " + message;
		else if( cc == 4 ) message="Why do I have to do this for you? Why can't I do anything by MYSELF?! " + message;
	}
	page.evaluate(function(chatId, message){
		//Array.prototype.slice.call(document.getElementsByClassName("chat")).forEach(function(v){
		//	if( v.getAttribute("data-id") == chatId.toString() ){
				// v.children[1].children[1].value=message; - old chat
				// check for bundle stickies
				try {
					var v = document.getElementById("chat-" + chatId);
					if( v.children[1].className.indexOf("form-placeholder") > -1 ){
						v.children[2].children[1].value = message;
						v.children[2].children[4].click();
					}
					else {
						v.children[1].children[1].value=message;
						// v.children[1].children[4].click(); - old chat
						v.children[1].children[4].click();
						//console.log(v.children[1].children[3].click();)
					}
				} catch(e){
					console.log("XError sending message '" + message + " to " + chatId + ": " +e);
				}
		//	}
		//});
	}, chatId, message);
}

function processMessage(page, message, customAdapter){

	write("[" + message.chat_id + "] " + message.user.name + ": " + message.content, TYPE.INFO);

	// block dungeon channel
	if( message.chat_id == 4809 ) return;

	// block jedi mind trick
	//if( message.inverted_chat_powers.length > 0 ){
	//	sendMessage(page, message.chat_id, "Please stop impersonating " + message.user.name + " before running commands.");
	//}

	if( muted && ! isSuperAdmin(message.user.id) ) return;
	
	messages_seen+=1;

	if( message.user.id == 505108 ) return;
	
	if( message.content.toLowerCase().indexOf("shoppa") > -1 && message.user.id != 505108 ) messages_shoppa+=1;

	message.content = message.content.replace("&nbsp", "<blank>");
	message.content = message.content.replace("<blank>;", "<blank>");
	message.content = message.content.trim();

	var func = regexChecker(message.content);
	if( typeof func == 'function' ){
		messages_handled+=1;
		return func(page, message);
	}

	message.content = message.content.split(" ");
	message.content[0] = message.content[0].toLowerCase();
	message.content = message.content.join(" ");

	if( message.content.substring(0,1) == "%" && ! ( message.user.id == 440889 && message.split(" ")[message.split(" ").length-1] != "GMT" ) && blacklist.indexOf(message.user.id)  == -1 ){

		if( antiAbuse[message.user.id] && antiAbuse[message.user.id] > 10 ) return;
		
		if( ! antiAbuse[message.user.id] ) antiAbuse[message.user.id] = 1;
		else antiAbuse[message.user.id]++;
		
		messages_handled+=1;
		
		var msg = message.content.substring(1).split(" ");
		
		if( commands.hasOwnProperty(msg[0]) && commands[msg[0]].callback ){
                        if( message.inverted_chat_powers.length > 0 ){
                                return sendMessage(page, message.chat_id, "Please stop impersonating " + message.user.name + " before running commands.");
                        }
			if(commands[msg[0]].isRestricted ){
				if( ! isSuperAdmin(message.user.id) ) return sendMessage(page, message.chat_id, "Sorry, but you can't do that!");
			}
		}
		else{
			msg.unshift("unknown");
		}

		var obj = {
			raw: message,
			page: page
		}


		var ca = customAdapter||false;
		
		obj.sendMessage = function(s,id){
			var i = id||message.chat_id;
			sendMessage(page,i,s);
		}
		
		
		/*	obj.sendMessage = function(s){
				var i = {};
				i.response = s;
				i.meta = message.meta;
				write("Message Response", TYPE.RESPONSE, i);
			} */
		
		var res = commands[msg[0]].callback(message.user.id, msg, obj);
		if( res != null && typeof res == "string" ) sendMessage(page, "" + message.chat_id, res);
		else if( res != null && typeof res == "boolean" && !res && commands[msg[0]].synopsis ) sendMessage(page, "" + message.chat_id, commands[msg[0]].synopsis);
	}
}

function Message(user, messageid, message, chatid, time){
	this.user = user;
	this.messageid = messageid;
	this.message = message;
	this.chatid = chatid;
	this.time = time;
}

function User(id, name){
	this.id = id;
	this.name = name;
}

botUserName = "";

logIn("username", "password", page, function(e,c){
	if( e ){ return console.log(e); }
	write("Logged in as " + c, TYPE.INFO);
	botUserName=c;
		
		// Open all of the bundle tabs so we get messages from them
		
		write("Loading tabs...");

		refreshTabs(page, function(){
			
			write("Subscribing to Faye...");
			
			page.onConsoleMessage = function(m){
				if( m[0] == "X" ) return write(m.substring(1));
				var k = {};
				try {
					k = JSON.parse(m);
					//console.log(m);
				} catch(e){
					return write("Error parsing message: " + e + "; " + m, TYPE.ERROR);
				}
				processMessage(page, k.message);
			}
			
			page.evaluate(function(){
				
				subFunc = function(message){
					console.log(message);
				}
				
				faye.subscribe("/global", subFunc);
				faye.subscribe("/active_items", subFunc);
				Array.prototype.slice.call(document.getElementsByClassName("tab private")).forEach(function(v,k){
					faye.subscribe("/private_chats/" + v.getAttribute("data-chat-id"), subFunc);
				});
				
				location.reload = undefined;
			});
			//commands.onPageLoad();
			/* console.log("Injecting TZDataJS...");
			page.evaluate(function(){
				var script = document.createElement("script");
				script.setAttribute("src", "http://tzdata-javascript.org/tzdata-javascript.js");
				document.getElementsByTagName("body")[0].appendChild(script);
			}); */

			write("Done and ready.", TYPE.INFO);

			setInterval(function(){
				var newPM = page.evaluate(function(){
					return document.getElementsByClassName("button").length > 0;
				});

				if( newPM ){
					var chatId = page.evaluate(function(){
						var chatId = document.getElementsByClassName("button")[0].getAttribute("href").split("/")[2];
						document.getElementsByClassName("button")[0].click();
						console.log("XA user wants private messaging. Reloading.");
						history.go(0);
						return chatId;
					});
					setTimeout(function(){
						var e = page.evaluate(function(chatId){
							try {
								console.log("X/private_chats/" + chatId);
								faye.subscribe("/private_chats/" + chatId, function(message){
									console.log("X" + message);
									console.log(message);
								}).then(function(){
									console.log("X" + subscribed);
								});
							} catch(e){
								return e;
							}
						}, chatId);
						if( e ) console.log(e);
						sendMessage(page, chatId, "Hello! What can I do for you?");
					}, 2000);
					write(chatId);
				}
			}, 2000);

			/* getTabs(page).forEach(function(v){
				console.log(v.id + " " + v.name);
			}); */
			
			//sendMessage(page, "19", "beep");
		});
});

//var stdin = require("system").stdin;

//var stdin = require("fs").open("/dev/stdin", "r");

/* try {
setInterval(function(){
	try{ 
	console.log("(read)");
	var line = stdin.readLine();
	console.log(line);
	if( line ) write("IPM: " + line);
	} catch(e){ console.log(e); }
}, 100);
} catch(e){
	write(e);
} */

setInterval(function(){

	// Read from the exec.txt file
	var fs = require("fs");

	if( ! fs.exists("exec.txt") ) return;

	var cmd = fs.read("exec.txt");
	fs.remove("exec.txt");

	cmd=cmd.split("\n");
	write(cmd);

}, 100);

} catch(e){
	console.log("Error initializing moe: " + e);
}
