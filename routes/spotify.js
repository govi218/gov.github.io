var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');

var client_id = 'be5ad7e81b4e4d91a5fad7f9073eaa5b'; // Your client id
var client_secret = 'a07bda05b7084226b2a7ee59f124beb7'; // Your secret
var redirect_uri = 'http://localhost:' + (process.env.PORT || 5000) + '/callback'; // Your redirect uri

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // application requests authorization
  var scope = 'user-read-private user-read-email user-library-read' + 
  ' user-follow-read user-read-recently-played user-read-currently-playing' + 
  ' user-top-read playlist-modify-public playlist-read-private playlist-modify-private';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var exec = require('child_process').exec;

        var spotifyApi = new SpotifyWebApi({
          clientId : 'fcecfc72172e4cd267473117a17cbd4d',
          clientSecret : 'a6338157c9bb5ac9c71924cb2940e1a7',
          redirectUri : 'http://www.example.com/callback'
        });
        
        spotifyApi.setAccessToken(access_token);
/**     
        // uncomment to see top artists
        spotifyApi.getMyTopArtists(options)
        .then(function(data) {
            console.log('artists:\n');
            for(i = 0; i < data.body.items.length; i++){
                console.log(i + data.body.items[i].uri);
            }
        
        }, function(err){
            console.log('Something went wrong!', err)
        });
**/   

        // for storing intermediate promise results
        var results = {};

        // start by getting user
        spotifyApi.getMe()
        .then(function(data) {
          return data.body.id;
        })
        .then(function(id) {
          // create a new playlist and store id
          results.me = id;
          return spotifyApi.createPlaylist(id, 'Top Tracks This Month', {'public': true});
        })
        .then(function(data){
          // get top tracks and store created playlist id
          results.playlistId = data.body.id;
          var options = {time_range: 'short_term', limit : 30};
          return spotifyApi.getMyTopTracks(options);
          
        })
        .then(function(data){
          // compile songs
          var songs = [];
           for(i = 0; i < data.body.items.length; i++){
             songs.push(data.body.items[i].uri);
           }
          return Promise.all(songs);
        })
        .then(function(songs){
          // populate playlist
          return spotifyApi.addTracksToPlaylist(results.me, results.playlistId, songs);
        })
        .then(function(data){
          // exit
          process.exit(0);
        })
        .catch(function () {
          // handle rejection
          console.log("Promise Rejected");
        });

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});


/** Stuff from Spotify API documentation */

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
