console.log("SoundcloudScrobbler start");

var soundcloudScrobbler = (function(soundcloudScrobbler){
	var app = {};

	app.DEBUG = true;

	app.log = function(message) {
		if(app.DEBUG) console.log(message);
	}

	app.site = {
		loaded: function() {
			return $("#content").length > 0;
		}
	}

	app.Artist = Backbone.Model.extend({
		defaults: {
			name: null,
			lastfmUrl: null,
		}
	});

	app.Track = Backbone.Model.extend({
		defaults: {
			id: null,
	        artist: null,
	        title: null,
	        lastfmUrl: null,
      	}
	});

	app.TrackCollection = Backbone.Collection.extend({
	    model: app.Track,
	    localStorage: new Store("soundcloudScrobbler-TrackCollection")
    });

    app.MainView = Backbone.View.extend({
	    el: 'html',
		initialize: function () {

			app.log("MainView initialize");

			// loop through track elements
			app.tracks = new app.TrackCollection();
			// add to tracks
			$(".sound.single").each(function(){
				var artist = $(this).find(".soundTitle__username").text();
				var track = $(this).find(".soundTitle__title").text();
				app.log("Found track: " + artist + " - " + track);
				app.tracks.create({artist: artist, title: track});
			});
			
		},
    });

    setTimeout(function(){
    	app.log("Loaded: " + app.site.loaded());
    	app.mainView = new app.MainView();
    }, 1000);

	return  app;
})();