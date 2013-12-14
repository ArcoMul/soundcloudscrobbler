/**
 * Author
 *  Arco Mul
 *  
 * Copyrights
 *  Dunno, just don't steal my shit and prentend it is your shit. When you
 *  make it better and give credits to me, you are free to use it.
 *
 * Changelog
 *  2.0.5 - 11 November 2013
 *   - Disabled the functionality and shows information about why it doesn't work anymore 
 *  2.0.4 - 23 august 2013
 *   - Add-track label didn't show up when the track was actually recognized as a track 
 *  2.0.3 - 20 august 2013
 *   - Fixed a small bug where the wrong info was shown
 *   - Put in an email adres for bug reporting
 *  2.0.2 - 3 june 2013
 *   - Track and artist are a link to their LastFM page
 *   - Show info icon which displays some information when a track can't be scrobbled
 *   - Bug: no crash when the current playing track is not on the page (might still 
 *     crash because it can't get the duration and seconds played)
 *  2.0.1 - 27 may 2013
 *   - First working version for SoundcloudNext
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

if (typeof SoundCloudScrobblerStarted === 'undefined') {
    SoundCloudScrobblerStarted = false;
}

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
        console.log(data);
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
var Track = function(key)
{
	this.key = key;
	this.title;
	this.artist;
	this.unknown = false;
	this.playing = false;
	this.secondsPlayed = 0;
	this.isScrobbled = false;
	this.startTime;
	this.duration;
	// this.mode = mode || null;
	this.artists = [];
	this.titles = [];
    this.noTrack = false;
	
	/**
	 * Start function of the object
	 */
	this.init = function()
	{
        console.log('New track found:', this.key);
	}
	
	
	this.getDuration = function ()
	{
        var time;

        if(this.playing) {
            time = $('.playing .timeIndicator.playing .timeIndicator__current:visible').next().children().last().html();
            console.log('Time:', time);
            if(!time) {
                console.log('Cant get duration, player not on page (no time indicator)');
                return -1;
            }
            time = time.split(".");
            console.log('Time:', time);
            return (Number(time[0]) * 60 + Number(time[1]));
        } else {
            console.log('Cant get duration, track not playing');
            return -1;
        }
	}
	
	/**
	 * Sets the track as uknown, no artist or title has been found
	 */
	this.setUnknown = function ()
	{
		this.unknown = true;
	}
	
	/**
	 * Sets the track as known, a artist and title has been selected
	 */
	this.setKnown = function ()
	{
		this.unknown = false;
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
	
	this.getSecondsPlayed = function ()
	{
        var time;

        if(this.playing) {
            time = $('.playing .timeIndicator.playing .timeIndicator__current:visible').html();
            if(!time) {
                console.log('Cant get seconds played, player not on page (no time indicator)');
                return -1;
            }
            time = time.split(".");
            return (Number(time[0]) * 60 + Number(time[1]));
        } else {
            console.log('Cant get seconds played, track not playing');
            return -1;
        }
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
            this.duration = this.getDuration();
			lastfm.setPlaying(this);
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
		}
	}
	
	/**
	 * Show all possible artist and title combination when those are not yet on LastFM
	 * (when the track is unkown)
	 */
	this.getPossibilities = function()
	{
        var $html = $('<table cellspacing="0" cellpadding="0"><tr><th>Artist</th><th>Title</th><th><a href="#" class="close">close</a></th></tr></table>');
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
            $html.append('<tr><td>'+posb[i].artist+'</td><td>'+posb[i].title+'</td><td><a href="#" class="select">select</a></td></tr>');
        }
        return $html;
	}
	
    this.getArtistUrl = function () {
        return 'http://www.last.fm/music/' + this.artist;
    }

    this.getTrackUrl = function () {
        return 'http://www.last.fm/music/' + this.artist + '/_/' + this.title; 
    }
	
	this.init();
}

var SrobbleLabel = function () {
    this.$el;
    this.init = function () {
        var self = this,
            $info,
            infoHeight;

        $('body').append("<div id='soundcloudscrobbler'><div class='top-right'><div class='scrobble-label'><strong>Now Srobbling:</strong><br /><span class='now'><em>Nothing yet</em></span></div></div></div>");
        this.$el = $('#soundcloudscrobbler .scrobble-label');
        this.$el.on('mouseenter mouseleave', 'span.now .info-icon', function (e) {
            if(e.type == 'mouseenter') {
                self.showInfoText($(this).data('info'));
            } else {
                self.hideInfoText();
            }
        });

        this.$el.on('click', 'a.add-track', function (e) {
            e.preventDefault();
            self.showAddTrackSubLabel();
        });

        this.$el.parent().on('click', 'a.select', function (e) {
            e.preventDefault();
            nowPlaying.title = $(this).parent().prev().text();
            nowPlaying.artist = $(this).parent().prev().prev().text();
            nowPlaying.setKnown();
            switchTo(nowPlaying, true);
            self.hideAddTrackSubLabel();
        });

        this.$el.parent().on('click', 'a.close', function (e) {
            e.preventDefault();
            self.hideAddTrackSubLabel();
        });

        this.$el.parent().on('mouseenter mouseleave', 'table tr td', function(e){
            if(e.type == 'mouseenter') {
                $(this).parent().children().css('background-color', '#ddd');
            } else {
                $(this).parent().children().css('background-color', '');
            }
        });

        $info = $("#soundcloudscrobbler .info");
        if(!$info) return;

        infoHeight = $info.height();
        $info.height(9);
        $info.mouseenter(function(){
            $(this).animate({
                height: infoHeight 
            }).css({
                cursor: "default",
                color: "#000"
            });
        }).mouseleave(function(){
            $(this).animate({
                height: 9 
            }).css({
                cursor: "pointer",
                color: "#8B8B8B"
            });
        });
    }
    this.remove = function () {
        $("#soundcloudscrobbler").remove();
    }
    this.showTrack = function (track) {
       this.$el.children('span.now').html('<a target="_blank" href="' + track.getArtistUrl() + '">' + track.artist + '</a> - <a target="_blank" href="' + track.getTrackUrl() + '">' + track.title + '</a>'); 
    }
    this.showUnknown = function (track) {
        this.hideAddTrackSubLabel();
        this.hideInfoText();
        var html;
        if (!track || track.noTrack === true) {
            html = "<em>No track found <span class=\"info-icon\" data-info=\"" +
                "Sorry, but I wasn't able to identify this as a track." +
                "If you are playing a track though, drop an email at: " +
                "soundcloud<br />scrobbler<br />@arcomul.nl with a link to the track you " +
                "were playing. WARNING: 'sets' are not yet working. I might support them in the future." +
                "\"></span></em>";
        } else {
            html = "<em>Unkown track <span class=\"info-icon\" data-info=\"" +
                "The track you are playing right know is not yet added to LastFM." +
                "Use the link below to add this track to LastFM." +
                "\"></span></em>" +
                "<br /><a href='#' class='add-track'>Add this track</a>";
        }
        this.$el.children('span.now').html(html); 
    }
    this.reset = function (track) {
       this.$el.children('span.now').html('<em>Nothing yet <span class="info-icon" data-info="I just tried to determine whether you are playing a track right now, seems not te be so?"></span></em>'); 
    }

    this.showInfoText = function (message) {
        this.hideAddTrackSubLabel();
        this.hideInfoText();
        this.$el.after('<div class="info">' + message + '</div>');
        this.$el.next().width(this.$el.width() - 10);
    }
    this.hideInfoText = function () {
        if(this.$el.parent().children('.info').length > 0) {
            this.$el.parent().children('.info').remove();
        } 
    }

    this.showAddTrackSubLabel = function () {
        this.hideAddTrackSubLabel();
        this.hideInfoText();
        this.$el.after('<div class="scrobble-label sub-label">' + $('<div />').append(nowPlaying.getPossibilities()).html() + '</div>');
    }
    this.hideAddTrackSubLabel = function () {
        if(this.$el.parent().children('.sub-label').length > 0) {
            this.$el.parent().children('.sub-label').remove();
        }
    }

    this.init();
}

/* ------------------------*/
/* --- CODE STARTS HERE	---*/
/* ------------------------*/

console.log('Load Soundcloud Scrobbler');

// Main variables
var tracks = {};
var apikey = "fa4fd9860f4323abe636e5d8f22c85c1";
var secret = "c8d4daf706b407a22e1d0a22534bcd02";
var user = {};
var lastfm = new LastFM();
var UILabel = new SrobbleLabel();
var nowPlaying;

var playermode = {
	LARGE: 1,
	MEDIUM: 2
}

// Start function
loadUser(init);
// setInterval(playing, 1000);

function init () {

    if (!SoundCloudScrobblerStarted) {
        console.log('Start Soundcloud Scrobbler' + SoundCloudScrobblerStarted);
        SoundCloudScrobblerStarted = true;
    } else {
        return console.log('Soundcloud Scrobbler already started, ignore');
    }
    
    UILabel.showInfoText ("Sorry, because of changes in Soundcloud the scrobbler doesn't work at the moment. <a href='http://arcomul.nl/blog/2013-11-11/soundcloudscrobbler-not-working' target='_blank'>Click here to read more</a>.");

    setTimeout (function () {
        UILabel.remove();   
    }, 5000);

    return;

    setInterval(function(){
        // 'play' to update the seconds counter
        if(nowPlaying && !nowPlaying.unkown) {
            nowPlaying.play();
        }
        
        // 'watch' for new track
        var title = document.getElementsByTagName('title')[0].innerHTML;
        if(!title) return;
        if(tracks[title]) {
            if(tracks[title] !== nowPlaying && !tracks[title].noTrack) {
                switchTo(tracks[title]);
            } else {
                return;
            }
        } else { 
            if(title.substr(0, 11) === "Your stream") {
                return UILabel.reset();
            }
            tracks[title] = new Track(title);   
            initTrack(tracks[title]);
        }
    }, 2000);
}

/**
 * Fills the track with the informatie it needs
 */
function initTrack(track)
{
	var titles = Array();
	var artists = Array()

    var title = track.key.substr(2).split('by')[0];
    var username = track.key.substr(2).split('by')[1];
    console.log('Title', title, 'Username', username);

    if(!username) {
        track.noTrack = true;
        UILabel.showUnknown(track);
        console.log('Not a track');
        return;
    }
	
	// Getting the first or last part of the track title (only when there is a '-')
	var splitArray = title.split('-');
	if(splitArray.length > 1)
	{
		artists.push($.trim(splitArray[0]));
		artists.push($.trim(splitArray[1]));
		
		titles.push($.trim(splitArray[1]));
		titles.push($.trim(splitArray[0]));
	}
	
	// Putting the full Soundcloud track title in the tracks array
	titles.push(title);
	
	// Putting the Soundcloud user in the artists array
	artists.push(username);
	
	// Adding the artist and title to the track
	addArtistAndTrackToTrack(tracks[track.key], artists, titles, function(track, title, artist) {
        console.log('Track initialized', track, title, artist); 
        switchTo(track);
    });
};

/**
 * By giving arrays with artists and tracks add a title and artist to the Track,
 * if found on Last.fm
 */
function addArtistAndTrackToTrack(track, artists, titles, callback)
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
				addArtistAndTrackToTrack(track, artists, titles, callback);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// Artist does not excists, 400 bad request error
				// Removing the bad result from the array
				artists.splice(0,1)
				
				// When there are still artists to try, try again
				if(artists.length > 0)
				{
					addArtistAndTrackToTrack(track, artists, titles, callback);
				}
				// Else the artist is unknown and the process can be stopped
				else
				{
					track.setUnknown();
                    callback(track);
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
						addArtistAndTrackToTrack(track, artists, titles, callback);
					else {
						track.setUnknown();
                        callback(track);
                    }
				} else {
                    callback(track, track.title, track.artist);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// If not found try again when there are options left
				titles.splice(0, 1)
				if(titles.length > 0)
					addArtistAndTrackToTrack(track, artists, titles, callback);
				// Else mark the Track as unknown;
				else {
					track.setUnknown();
                    callback(track);
                }
			}
		});
	}
}

var switchTo = function (track) {
    UILabel.hideAddTrackSubLabel();
    if(track.unknown) {
        console.log('Unkown track'); 
        UILabel.showUnknown(track);
        nowPlaying = track;
    }
    else {
        if(nowPlaying) {
            nowPlaying.stop();
        }
        nowPlaying = track;
        nowPlaying.play();
        UILabel.showTrack(nowPlaying);
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
