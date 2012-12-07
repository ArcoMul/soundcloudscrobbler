$(window).ready(function(){
                
    var apikey = "fa4fd9860f4323abe636e5d8f22c85c1";
    var secret = "c8d4daf706b407a22e1d0a22534bcd02";
    
    init();
    
    function init(){
    	user = loadUser();
    	
    	url = window.location.href.split("?");
    	if(url.length > 1)
    	{
    		token = url[1];
    		token = token.split("=");
    		
    		tokenKey = token[1];
			apiSig = calcMD5("api_key" + apikey + "methodauth.getSessiontoken" + tokenKey + secret);
    		
    		$.ajax({
				type: "GET",
				url: "http://ws.audioscrobbler.com/2.0/?method=auth.getSession&token=" + tokenKey + "&api_key=" + apikey + "&api_sig=" + apiSig,
				dataType: "xml",
				success: function(xml) {
					user.auth = true;
					user.name = $(xml).find('session name').text();
					user.key = $(xml).find('session key').text();
					saveUser(user);
					showAuthText();
				},
				error: function(jqXHR, textStatus, errorThrown) {
					showText("Error: " + textStatus + "<br />" + errorThrown);
				}
			});
    	}
    	else if (user.auth)
    	{
    		showAuthText();
    	}
    	else
    	{
    		$(".content p").append('<a id="lastFmAcces" href="http://www.last.fm/api/auth/?api_key=' + apikey + '&cb=' + chrome.extension.getURL("options.html") + '">Give Soundcloud Scrobbler acces to your Last.fm data</a>');
    	}
    }
    
    function showAuthText()
    {
    	showText("You are logged in as: " + user.name + " <a id='logout' href='#'>Logout</a>")
    }
    
    function showText(text)
    {
    	$(".content p").html(text);
    }
    
    function saveUser(user)
    {
    	window.localStorage.setItem("userName", user.name);
    	window.localStorage.setItem("userKey", user.key);
    	window.localStorage.setItem("userAuth", user.auth);
    }
    
    function loadUser()
    {
    	var user = {};
    	user.name = window.localStorage.getItem("userName");
    	user.key = window.localStorage.getItem("userKey");
    	user.auth = window.localStorage.getItem("userAuth");
    	return user;
    }
    
    function clearUser()
    {
    	window.localStorage.setItem("userName", null);
    	window.localStorage.setItem("userKey", "");
    	window.localStorage.setItem("userAuth", "");
    }
    
    $('#logout').live('click', function(){
    	clearUser();
    	window.location.href = chrome.extension.getURL("options.html");
    	return false;
    });
    
});