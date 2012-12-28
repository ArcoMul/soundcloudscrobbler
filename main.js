console.log("SoundcloudScrobbler start");

var soundcloudScrobbler = (function(soundcloudScrobbler){
	var app = {};

	app.DEBUG = true;

	app.log = function() {
		if(app.DEBUG) console.log.apply(console, arguments);
	}

	var apikey = "fa4fd9860f4323abe636e5d8f22c85c1";
	var secret = "c8d4daf706b407a22e1d0a22534bcd02";

	/**
	 * By giving arrays with artists and tracks add a title and artist to the Track,
	 * if found on Last.fm
	 */
	var getLastFMArtistAndTitle = function (artists, titles, callback, result)
	{
		result = result || {};

		app.log(result);
		
		// First round the artists array will have some items
		if(artists.length > 0)
		{
			// Getting the artist from Last.fm, if found
			$.ajax({
				type: "GET",
				url: "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=" + artists[0].replace("&", "%26") + "&api_key=" + apikey,
				dataType: "xml",
				success: function(xml) {
					app.log("Artist found:", artists[0]);
					// If artist excists, add artist name to Track
					result.artist = artists[0]; // TODO: Use XML artist name instead of page artist name
					// Clear the Array so the next loop the track title will be getted
					artists = Array();
					// Recall the function to get the track title
					getLastFMArtistAndTitle(artists, titles, callback, result);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					// Artist does not excists, 400 bad request error
					// Removing the bad result from the array
					artists.splice(0,1)
					
					// When there are still artists to try, try again
					if(artists.length > 0)
					{
						getLastFMArtistAndTitle(artists, titles, callback, result);
					}
					// Else the artist is unknown and the process can be stopped
					else
					{
						callback(null);
					}
				}
			});
		}
		else
		{
			// Trying to get the track title by artist and title
			$.ajax({
				type: "GET",
				url: "http://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=" + apikey + "&artist=" + result.artist.replace("&", "%26") + "&track=" + titles[0].replace("&", "%26"),
				dataType: "xml",
				success: function(xml) {

					// If found add title to Track
					result.title = $(xml).find('track name').first().text();
					
					if(!checkArtistAndTitle(result.artist, result.title)) {
						titles.splice(0, 1);
						if(titles.length > 0)
							getLastFMArtistAndTitle(artists, titles, callback, result);
						else
							callback(null);
					} else {
						app.log("Track found:", result.title);
						callback(result);
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					// If not found try again when there are options left
					titles.splice(0, 1)
					if(titles.length > 0)
						getLastFMArtistAndTitle(artists, titles, callback, result);
					// Else mark the Track as unknown;
					else
						callback(null);
				}
			});
		}
	}
	/**
	 * Check whether this combination of artist and title is OK
	 */
	var checkArtistAndTitle = function(artist, title)
	{
		if(artist.toLowerCase() == title.toLowerCase())
			return false;
		if(title.split("-").length > 1)
			return false;
		return true;
	}

	app.site = {
		loaded: function() {
			return $("#content").length > 0;
		}
	}

	app.Track = Backbone.Model.extend({
		defaults: {
			id: null,
	        artist: null,
	        title: null,
	        lastfmUrl: null,
      	},
	});

	// Task View
	app.TrackView = Backbone.View.extend({
	    tagName: 'div',
	    template: _.template("<%- artist %> - <%- title %>"),
	    render: function(){
	        this.$el.html(this.template(this.model.toJSON()));
	        return this;
	    }
	});

	app.TrackCollection = Backbone.Collection.extend({
	    model: app.Track,
	    localStorage: new Store("soundcloudScrobbler-TrackCollection")
    });

    app.MainView = Backbone.View.extend({
	    el: '#soundcloudScrobbler',
		initialize: function () {

			app.log("MainView initialize");

			// loop through track elements
			app.tracks = new app.TrackCollection();
			app.tracks.on('add', this.renderTrackLabel, this);

			// add to tracks
			var count = $(".sound.single").length, i = 0;
			$(".sound.single").each(function(){
				var artists = [];
				var titles = [];

				var username = _.str.trim($(this).find(".soundTitle__username").text());
				var title = _.str.trim($(this).find(".soundTitle__title").text());

				artists.push(_.str.trim(username));
				titles.push(_.str.trim(title));
				artists.push(_.str.trim(title.split('-')[0]));
				titles.push(_.str.trim(title.split('-')[1]));

				app.log("Possible artists and titles: ", artists, titles);
				getLastFMArtistAndTitle(artists, titles, function(result){
					if(result === null) {
						app.log("Track not found on LastFM");
						return;
					}
					app.log("Track found on LastFM:", result);
					app.tracks.create({artist: result.artist, title: result.track});
					i++;
					if(i == count) {
						app.log('All tracks created');
					}
				});
			});
			
		},

		renderTrackLabel: function(track)
		{
			var view = new app.TrackView({model: track});
        	this.$el.append(view.render().el);
		}
    });

    setTimeout(function(){
    	app.log("Loaded: " + app.site.loaded());
    	$("body").append("<div id='soundcloudScrobbler' />");
    	app.mainView = new app.MainView();
    }, 1000);

	return  app;
})();