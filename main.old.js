/**
 * Author
 *  Arco Mul
 *  
 * Copyrights
 *  Dunno, just don't steal my shit and prentend it is your shit. When you
 *  make it better and give credits to me, you are free to use it.
 *
 * Changelog
 *  1.0.2 - 2 august 2012
 *   - Bug: And again Chrome seemed to have a problem with me (Manifest version 2)
 *  1.0.1 - 2 august 2012
 *   - Bug: Manifest version 2 doesn't allow inline script, woops! 
 *  1.0 - 2 august 2012
 *   - Added the option to select the artist and title when those are unkown. The
 *     selected artist and title will be scobbled so the next time those will be 
 *     used too
 *   - Switech to manifest version 2, now the extension is only for Chrome 18 and 
 *     higher
 *   - Bug: By mistake not all the possible titles were checked, now they do
 *   - Notice: All the features I wanted are in there now, do you want new features,
 *     leave a message on the Chrome Webstore page
 *  0.1.4 - 19 march 2012
 *   - Marks track as scrobbled when it is scrobbled, no double scrobbles anymore
 *   - Tracks on detail pages are scrobbled as wel now, like: http://soundcloud.com/alexclareofficial/alex-clare-when-doves-cry
 *   - The '&' in titles and artist names should no longer be a problem
 *   - Dashboard can be Scrobbled. When the last song of the dashboard is reached, and
 *     there should be loaded new tracks, those songs will not be scrobbled. However
 *     clicking on the 'more' button reloads the LastFM labels.
 *  0.1.3 - 15 march 2012
 *   - The image of the favicon of LastFM wasn't correct. Added the right one.
 *  0.1.2 - 15 march 2012
 *   - Scrobbling is working!
 *   - When starting a song updates the 'now playing' options on your lastFM page
 *   - When you have played for 30 seconds and the track is stopped or a next track is 
 *     going to play. The track will be marked as scobbled.
 *   - Also added a logo :-)
 *  0.1.1 - 15 march 2012
 * 	 - Rewritten code, added a Track class. Much easier to read now.
 *  0.1.0 - 13 march 2012
 *   - Started to work on the basics of the extension
 * 	 - Label is added next to the Soundclouds track title, showing whether
 * 	   this track is known at last.fm.
 * 
 * Known Bugs
 *  - Dashboard loading more songs will only work by clicking on the 'more' button.
 *    Only than will the tracks be reinitialized.
 *  - You can only scrobble tracks in a 'full player'. Tracks which are part of sets
 *    don't work (yet).
 */

var LastFM = function()
{
	this.setPlaying = function(track)
	{
		data = {
			api_key 	: apikey,
			artist 		: track.artist,
			duration 	: track.duration,
			method		: "track.updateNowPlaying",
			sk			: user.key,
			track 		: track.title
		}
		apiSig = this.createApiSig(data);
        
        this.ajax(data, apiSig, function(xml){
        	//console.log(xml);
        });	
	}
	
	this.scrobble = function(track)
	{
		if(track.secondsPlayed > 0.30 && !track.isScrobbled)
		{
			data = {
				api_key 	: apikey,
				artist 		: track.artist,
				method		: "track.scrobble",
				sk			: user.key,
				timestamp	: track.startTime,
				track 		: track.title
			}
			apiSig = this.createApiSig(data);
	        
	        this.ajax(data, apiSig, function(xml){
	        	track.isScrobbled = true;
	        });
		}
	}
	
	this.ajax = function(params, apiSig, callback)
    {
		params.api_sig = apiSig
	
    	$.ajax({
			type: "POST",
			url: "http://ws.audioscrobbler.com/2.0/",
			data: params,
			dataType: "xml",
			success: function(xml) {
				callback(xml);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				//console.log("Error: " + textStatus + " - " + errorThrown);
			}
		});
    }
	
	this.createApiSig = function(data)
	{
		var sig = "";
		for(var k in data)
		{
			sig = sig + k + data[k];
		}
		sig = sig + secret;
		return calcMD5(sig);
	}
}

/**
 * Track object
 */
var Track = function(id, playerElm, mode)
{
	this.id = id;
	this.playerElm = playerElm;
	this.title;
	this.artist;
	this.unknown = false;
	this.playing = false;
	this.secondsPlayed = 0;
	this.isScrobbled = false;
	this.startTime;
	this.duration;
	this.mode = mode;
	this.artists = [];
	this.titles = [];
	
	/**
	 * Start function of the object
	 */
	this.init = function()
	{
		this.playerElm.data('SLSid', this.id);
		this.buildLabel();
		this.duration = this.getDuration();
	}
	
	/**
	 * Returns the element of the page which holds the Soundcloud username
	 */
	this.getPlayerUser = function()
	{
		if(this.mode == playermode.MEDIUM)
			return this.playerElm.children('.info-header').children('.subtitle').children('.user').children('a').text();
		else if (this.mode == playermode.LARGE)
			return this.playerElm.children('.info-header').children('h2').children('.user').children('a').text();
	}
	
	/**
	 * Return the element of the page which holds the title of the Soundcloud track
	 */
	this.getPlayerTitle = function()
	{
		if(this.mode == playermode.MEDIUM)
			return this.playerElm.children('.info-header').children('h3').children('span').children('a').text();
		else if (this.mode == playermode.LARGE)
			return this.playerElm.children('.info-header').children('h1').children('span').children('em').text();
	}
	
	/**
	 * Return the labal which has been made by creating this object
	 */
	this.getLabel = function()
	{
		if(this.mode == playermode.MEDIUM)
			return this.playerElm.children('.info-header').children('h3').children('span').children('.SLSholder').children();
		else if (this.mode == playermode.LARGE)
			return this.playerElm.children('.info-header').children('h1').children('span').children('.SLSholder').children();
	}
	
	this.removeLabelSpan = function()
	{
		this.getLabel().parent().parent().children("a, em").unwrap();
	}
	
	/**
	 * Makes the label, called in the init function
	 */
	this.buildLabel = function()
	{
		if(this.mode == playermode.MEDIUM)
			var aElm = this.playerElm.children('.info-header').children('h3').children('a');
		else if (this.mode == playermode.LARGE)
			var aElm = this.playerElm.children('.info-header').children('h1').children('em');
			
		aElm.wrap('<span>');
    	aElm.parent().append("<div class='SLSholder'><div class='tag'><img src='"+ chrome.extension.getURL("LastFMfavicon.png") +"' /><p> ... </p></div></div>");
	}
	
	this.getDuration = function ()
	{
		var time = this.playerElm.find(".timecodes .duration").html();
		time = time.split(".");
		return (Number(time[0]) * 60 + Number(time[1]));
	}
	
	/**
	 * Sets the track as uknown, no artist or title has been found
	 */
	this.setUnknown = function ()
	{
		this.unknown = true;
		this.displayText();
		this.getLabel().addClass('unknown');
	}
	
	/**
	 * Sets the track as known, a artist and title has been selected
	 */
	this.setKnown = function ()
	{
		this.unknown = false;
		this.displayText();
		this.getLabel().removeClass('unknown');
	}
	
	/**
	 * Check whether this combination of artist and title is OK
	 */
	this.checkArtistAndTitle = function(artist, title)
	{
		if(artist.toLowerCase() == title.toLowerCase())
			return false;
		if(title.split("-").length > 1)
			return false;
		return true;
	}
	
	/**
	 * Displays the text in the label
	 */
	this.displayText = function()
	{
		if(!this.unknown)
		{
			if(this.artist.toLowerCase() == this.title.toLowerCase()) {
				this.setUnknown();
				this.displayText();
				return false;
			}
			
			displayText = '<a target="_blank" href="http://www.last.fm/music/' + this.artist + '">' + this.artist + '</a> - <a href="http://www.last.fm/music/' + this.artist + '/_/' + this.title + '">';
			
			if(this.title.length > 30)
				displayText = displayText + this.title.substr(0, 30) + '...';
			else
				displayText = displayText + this.title;
			
			displayText =  displayText + '</a>';
		}
		else
		{
			displayText =  '<span>Unknown</span> <a class="add" href="#">add</a>';
		}
		
		this.getLabel().children('p').html(displayText);
	}
	
	this.getSecondsPlayed = function ()
	{
		return Number(this.playerElm.find(".timecodes .editable").html());
	}
	
	this.updateSecondsPlayed = function ()
	{
		var secondsOnPlayer = this.getSecondsPlayed();
		this.secondsPlayed = secondsOnPlayer > this.secondsPlayed ? secondsOnPlayer : this.secondsPlayed;
	}
	
	/**
	 * Set this track as playing
	 */
	this.play = function ()
	{
		if(!this.unknown && !this.playing)
		{
			if(this.startTime == undefined)
				this.startTime = Math.round((new Date()).getTime() / 1000);
			this.playing = true;
			lastfm.setPlaying(this);
			this.getLabel().children('p').html('▶ ' + this.getLabel().children('p').html());
		}
		else if (this.playing)
		{
			this.updateSecondsPlayed();
		}
	}
	
	/**
	 * Stops the track from playing
	 */
	this.stop = function ()
	{
		if(!this.unknown && this.playing)
		{
			this.playing = false;
			lastfm.scrobble(this);
			this.getLabel().children('p').html(this.getLabel().children('p').html().replace('▶ ', ''));
		}
	}
	
	/**
	 * Show all possible artist and title combination when those are not yet on LastFM
	 * (when the track is unkown)
	 */
	this.showPossibilities = function()
	{
		var label = this.getLabel();
		if(label.next('.arrow').length == 0)
		{
			console.log("DO IT!");
			label.after('<div class="arrow" style="background-image:url('+chrome.extension.getURL("sprite.png")+')"></div><div class="cloud"><table cellspacing="0" cellpadding="0"><tr><th>Artist</th><th>Title</th><th><div class="close-cloud" style="background-image:url('+chrome.extension.getURL("sprite.png")+')"></div></th></tr></table></div>');
			var cloud = label.next().next().children('table');
			var posb = [];
			for(var i = 0; i < this.artists.length; i++)
			{
				for(var j = 0; j < this.titles.length; j++)
				{
					if(this.checkArtistAndTitle(this.artists[i], this.titles[j]))
						posb.push({artist: this.artists[i], title: this.titles[j]});
				}
			}
			for(i = 0; i < posb.length; i++){
				cloud.append('<tr><td>'+posb[i].artist+'</td><td>'+posb[i].title+'</td><td><a href="#" class="select">select</a></td></tr>');
			}
		}
		else
		{
			label.next().show().next().show();
		}
	}
	
	/**
	 * Hide the possibilities cloud
	 */
	this.hidePossibilities = function()
	{
		var label = this.getLabel();
		label.next().hide().next().hide();
	}
	
	this.init();
}

/* ------------------------*/
/* --- CODE STARTS HERE	---*/
/* ------------------------*/

// Main variables
var tracks = Array();
var apikey = "xxx";
var secret = "xxx";
var user = {};
var lastfm = new LastFM();

var playermode = {
	LARGE: 1,
	MEDIUM: 2
}

// Start function
loadUser(init);
setInterval(playing, 1000);

function init () {
	if($("body").attr("id") == "dashboard" && $("div.medium.player").length == 0)
	{
		setTimeout(init, 500);
		return false;
	}
		
	$("div.medium.player").each(function(){
		console.log('medium');
		var track = new Track(tracks.length, $(this), playermode.MEDIUM);
		initTrack(track);
	});
	
	$("div.large.player").each(function(){
		console.log('large');
		var track = new Track(tracks.length, $(this), playermode.LARGE);
		initTrack(track);
	});
    
}

/**
 * Fills the track with the informatie it needs
 */
function initTrack(track)
{
	var titles = Array();
	var artists = Array()
	
	// Getting the first or last part of the track title (only when there is a '-')
	var splitArray = track.getPlayerTitle().split('-');
	if(splitArray.length > 1)
	{
		artists.push($.trim(splitArray[0]));
		artists.push($.trim(splitArray[1]));
		
		titles.push($.trim(splitArray[1]));
		titles.push($.trim(splitArray[0]));
	}
	
	// Putting the full Soundcloud track title in the tracks array
	titles.push(track.getPlayerTitle());
	
	// Putting the Soundcloud user in the artists array
	artists.push(track.getPlayerUser());
	
	// Adds the Track to the Tracks array
	tracks.push(track);
	
	// Adding the artist and title to the track
	addArtistAndTrackToTrack(tracks[track.id], artists, titles);
};

/**
 * By giving arrays with artists and tracks add a title and artist to the Track,
 * if found on Last.fm
 */
function addArtistAndTrackToTrack(track, artists, titles)
{
	// Making copies of the arrays by using slice, and save them in the track for later use
	track.titles = track.titles.length == 0 ? titles.slice(0) : track.titles;
	track.artists = track.artists.length == 0 ? artists.slice(0) : track.artists;
	
	// First round the artists array will have some items
	if(artists.length > 0)
	{
		// Getting the artist from Last.fm, if found
		$.ajax({
			type: "GET",
			url: "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=" + artists[0].replace("&", "%26") + "&api_key=" + apikey,
			dataType: "xml",
			success: function(xml) {
				// If artist excists, add artist name to Track
				track.artist = artists[0]; // TODO: Use XML artist name instead of page artist name
				// Clear the Array so the next loop the track title will be getted
				artists = Array();
				// Recall the function to get the track title
				addArtistAndTrackToTrack(track, artists, titles);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// Artist does not excists, 400 bad request error
				// Removing the bad result from the array
				artists.splice(0,1)
				
				// When there are still artists to try, try again
				if(artists.length > 0)
				{
					addArtistAndTrackToTrack(track, artists, titles);
				}
				// Else the artist is unknown and the process can be stopped
				else
				{
					track.setUnknown();
				}
			}
		});
	}
	else
	{
		// Trying to get the track title by artist and title
		$.ajax({
			type: "GET",
			url: "http://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=" + apikey + "&artist=" + track.artist.replace("&", "%26") + "&track=" + titles[0].replace("&", "%26"),
			dataType: "xml",
			success: function(xml) {
				// If found add title to Track
				track.title = $(xml).find('track name').first().text();
				if(!track.checkArtistAndTitle(track.artist, track.title)) {
					titles.splice(0, 1);
					if(titles.length > 0)
						addArtistAndTrackToTrack(track, artists, titles);
					else
						track.setUnknown();
				} else {
					track.displayText();
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// If not found try again when there are options left
				titles.splice(0, 1)
				if(titles.length > 0)
					addArtistAndTrackToTrack(track, artists, titles);
				// Else mark the Track as unknown;
				else
					track.setUnknown();
			}
		});
	}
}

/**
 * Checks whether there is a Track playing, or not
 */
function playing ()
{
	if($(".playing").length > 0)
	{
		track = getTrackFromPlaying($(".playing"));
		track.play();
		checkForTrackStop(track.id);
	}
	else
	{
		stopAllTracks();
	}
	
}

/**
 * Returns by giving the .playing class the Track which is playing
 */
function getTrackFromPlaying(playingElm)
{
	return tracks[playingElm.parent().data('SLSid')];
}

/**
 * Check whether there are playing multiple tracks, if so stop the 
 * not current playing track from playing
 */
function checkForTrackStop(currentPlaying)
{
	playingCount = 0;
	for(var i = 0; i < tracks.length; i++)
	{
		if(i != currentPlaying && tracks[i].playing == true)
			tracks[i].stop();	
	}
}

/**
 * Stops all the tracks from playing
 */
function stopAllTracks()
{
	for(var i = 0; i < tracks.length; i++)
	{
		if(tracks[i].playing == true)
			tracks[i].stop();
	}
}

/**
 * Loads the user
 */
function loadUser(callback)
{
    chrome.extension.sendRequest({method: "getUser"}, function(response) {
        user.name = response.data.name;
        user.key = response.data.key;
        user.auth = response.data.auth;
        callback();
    });
}

function restart()
{
	for(var i = 0; i < tracks.length; i++)
	{
		tracks[i].removeLabelSpan();
	}
	$(".SLSholder").remove();
	tracks = Array();
	setTimeout(init, 1000);
}


// Events:

//When the user click on the load more button (re-initialize everything)
$("#dashboard .show-more").live('click', function(){
	restart();
});

// When the user clicks on the label to show possible combinations
$(".SLSholder .add").live("click", function(e){
	e.preventDefault();
	var track = tracks[$(this).parents(".player").data("SLSid")];
	console.log('click', track);
	track.showPossibilities();
});

// Give the table of the possibilities cloud a darker color by hovering
$(".SLSholder .cloud table tr td").live("mouseenter", function(){
	$(this).parent().children().css('background-color', '#ddd');
}).live('mouseleave', function(){
	$(this).parent().children().css('background-color', '');
});

// The button to select a combination from the possibilities
$(".SLSholder .select").live("click", function(e){
	e.preventDefault();
	var track = tracks[$(this).parents(".player").data("SLSid")];
	track.title = $(this).parent().prev().text();
	track.artist = $(this).parent().prev().prev().text();
	track.setKnown();
});

// Close the possibilities cloud
$(".SLSholder .close-cloud").live("click", function(e){
	e.preventDefault();
	var track = tracks[$(this).parents(".player").data("SLSid")];
	track.hidePossibilities();
});