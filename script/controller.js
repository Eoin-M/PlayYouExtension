window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
 
if (!window.indexedDB) {
   window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

/*String.prototype.levenstein = function(string) {
    var a = this, b = string + "", m = [], i, j, min = Math.min;

    if (!(a && b)) return (b || a).length;

    for (i = 1; i <= b.length; i++) {
		m[i] = [i];
        for (j = 1; j <= a.length; j++) {
			m[0][j] = j;
            m[i][j] = b.charAt(i - 1) == a.charAt(j - 1)
                ? m[i - 1][j - 1]
                : m[i][j] = min(
                    m[i - 1][j - 1] + 1, 
                    min(m[i][j - 1] + 1, m[i - 1 ][j] + 1))
        }
    }

    return m[b.length][a.length];
}*/

angular.module('PlayYouApp', ['autocomplete']).controller('PlayYouController',
	function($scope, $http){
		var host = "http://eoinmaguire.com";
		$scope.newSong = {};
		$scope.user;
		$scope.addResponse;
		$scope.songs = [];
		$scope.songSearch = [];
		var numSongs;
		
		var db;
		var request = indexedDB.open("songs", 3);
		
		request.onupgradeneeded = function(event) {
			console.log("running onupgradeneeded");
			var thisDB = event.target.result;
 
			if(!thisDB.objectStoreNames.contains("song")) {
				//thisDB.deleteObjectStore("song");
				var objStore = thisDB.createObjectStore("song", {autoIncrement: true});
			}
		}
		
		request.onerror = function(event) {
		  //alert("Why didn't you allow my web app to use IndexedDB?!")
		};
		
		request.onsuccess = function(event) {
			db = event.target.result;
			var transaction = db.transaction(["song"]);
			var objectStore = transaction.objectStore("song");
			var getRequest = objectStore.getAll();
			
			getRequest.onerror = function(event) {
			  // Handle errors!
			};
			getRequest.onsuccess = function(event) {
			  // Do something with the getRequest.result!
			  $scope.songs = getRequest.result;
			  numSongs = $scope.songs.length;
			  console.log("NumSongs " + numSongs);
			  $scope.getSongs();
			};
		};
		
		if(Math.random() > 0.95) {
			var req = indexedDB.deleteDatabase("songs");
			req.onsuccess = function () {
				console.log("Deleted database successfully");
			};
			req.onerror = function () {
				console.log("Couldn't delete database");
			};
			req.onblocked = function () {
				console.log("Couldn't delete database due to the operation being blocked");
			};
		}
		
		function dbSongs(songs) {
			console.log("DBsongs " + songs.length);
			if(songs.length <= 0) return;
			var transaction = db.transaction(["song"], "readwrite")
			var store = transaction.objectStore("song");
			var add;
			
			for(var i = 0; i < songs.length; i++){
				add = store.add(songs[i]);
			
				add.onerror = function(e) {
					console.log("Error",e.target.error.name);
					//some type of error handler
				}
				 
				add.onsuccess = function(e) {
				}
			}
		   
		   transaction.onsuccess = function(event) {
			  //alert("Prasad has been added to your database.");
		   };
		   
		   transaction.onerror = function(event) {
			  //alert("Unable to add data\r\nPrasad is already exist in your database! ");
		   }
		}
		
		function url_base64_decode(str) {
		  var output = str.replace(/-/g, '+').replace(/_/g, '/');
		  switch (output.length % 4) {
			case 0:
			  break;
			case 2:
			  output += '==';
			  break;
			case 3:
			  output += '=';
			  break;
			default:
			  throw 'Illegal base64url string!';
		  }
		  var result = window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
		  try{
			return decodeURIComponent(escape(result));
		  } catch (err) {
			return result;
		  }
		}
		
		function decodeToken(str){
			str = str.split('.')[1];
			var json = null, error = null;
			  try {
				json = url_base64_decode(str);
				json = (JSON.parse(decodeURI(json)), undefined, 2);
			  } catch (e) {
				error = e;
			console.log(e);
			  }
			console.log(json);
			$scope.user = json; 
			console.dir($scope.user);
		}
		
		$scope.getSongs = function(){	
			console.log(numSongs);
			$http.post(host + '/api/playyou/getSongsAfter', {after: numSongs})
			.success(function(data){
				$scope.songs = $scope.songs.concat(data.songs);
				console.dir($scope.songs);
				dbSongs(data.songs);
				if($scope.newSong.link) $scope.checkLink($scope.newSong.link);
				$scope.songSearch = [];
				for(var i = 0; i < $scope.songs.length; i++){
					$scope.songSearch.push($scope.songs[i].title + " - " + $scope.songs[i].artist);
				}
				console.dir($scope.songSearch);
			})
			.error(function(data, status){
				alert("Error: " + status);
			});
		}
		
		function PlaylistLink(link){
			for(var i = 0; i < $scope.songs.length; i++){
				if($scope.songs[i].link == link) {
					$scope.correctLink = "That Song Has Already Been Submitted by: " + $scope.songs[i].submitted_by;
					return true;
				}
			}
			console.log('Not Already in Playlist');
			return false;
		}
				
		$scope.login = function(email){
			console.log(email);
			
			$http.post(host + '/api/login', {
			  email: email,
			  password: "pass"
			})
			.success(function(data){
				console.dir(data)
				localStorage.setItem('JWT', data.token);
				decodeToken(data.token);
				getForm();
			})
			.error(function(data){
				$scope.loginError = "No User Found!";
			});
		}
		
		$scope.logout = function(){
			$scope.user = null;
			$scope.songs = [];
			$scope.songSearch = [];
			localStorage.removeItem('JWT');
		}
		
		var token = localStorage.getItem('JWT');
		if(token){
			decodeToken(token);
			getForm();
		}
		
		function getForm(){
			var url;
			chrome.tabs.getSelected(null, function(tab){
				console.dir(tab);
				url = tab.url.split("&")[0];
				if(url.indexOf("www.youtube.com/watch?v=") >= 0){
					console.log("Youtube");
					$scope.newSong.link = url;
					console.log("Check Link");
					var title = tab.title.substring(0, tab.title.length - 10);
					guess = title.split(" - ");
					if(guess.length == 1) guess = title.split(": ");
					if(emptyString($scope.newSong.title) && guess[1]) $scope.newSong.title = guess[1];
					if(emptyString($scope.newSong.artist) && guess[0]) $scope.newSong.artist = guess[0];
					console.log(guess);
					$scope.$apply();
				}
			});
		}
		
		function emptyString(str){
			return (str == "" || str == undefined);
		}
		
		$scope.switch = function(){
			var temp = $scope.newSong.title;
			$scope.newSong.title = $scope.newSong.artist;
			$scope.newSong.artist = temp;
			$scope.checkTitle($scope.newSong.title);
		}
		
		$scope.checkTitle = function(title){
			console.log("Check Title");
			if(emptyString(title)) return;
			
			for(var i = 0; i < $scope.songs.length; i++){
				if(title.toLowerCase() == $scope.songs[i].title.toLowerCase()){
					$scope.correctTitle = "Song Title Already Submitted by: " + $scope.songs[i].submitted_by;
					return;
				} else {
					$scope.correctTitle = null;
				}
			}
		}
		
		$scope.checkLink = function(link){
			console.log(link);
			if(emptyString(link)) { $scope.correctLink = "Please Enter a Correct Link"; $scope.$apply(); return; }
			var correctLength = link.split("&");
			if(correctLength.length > 1) link = correctLength[0];
			var vID = link.split('v=');
			if(vID[1] === null || vID[1] === undefined) { $scope.correctLink = "Youtube VideoID Not Present"; return; }
			vID = vID[1].split("&");
			vID = vID[0];
			$scope.newSong.link = link;
			if(PlaylistLink(link)) { return; }
			else {
				var url = "https://www.googleapis.com/youtube/v3/videos";
				var videoId = "id=" + vID;
				var apiKey = "key=AIzaSyAaSh1l3C8s06zSRyNSh-GUnQr7nhZyHxo";
				var part = "part=snippet";
				var field = "fields=items(snippet(title))";

				$.get(url + "?" + apiKey + "&" + videoId + "&" + field + "&" + part, function(response) {
					console.log(response);
					//if(response.pageInfo.totalResults > 0) {$scope.correctLink = null; $scope.$apply();}
					if(response.items[0]) {
						var guess = response.items[0].snippet.title.split(" - ");
						console.log(guess);
						//if(guess.length > 1){
							if(emptyString($scope.newSong.title) && guess[1]) {
								$scope.newSong.title = guess[1];
								$scope.checkTitle($scope.newSong.title);
							}
							if(emptyString($scope.newSong.artist) && guess[0]) $scope.newSong.artist = guess[0];
						//}
						$scope.correctLink = null;
						$scope.$apply();
					}
					else { $scope.correctLink = "Youtube Link Not Valid"; $scope.$apply();}
				});
			}
		}
		
		$scope.addSong = function(song){
			console.log("Add Song");
			
			$http.post(host + '/api/playyou/addSong', {
				song: song, name: $scope.user.name, _id: $scope.user._id
			}, {
				headers: {
					'authorization': 'Bearer ' + localStorage.getItem('JWT')
				},
			})
			.success(function(data){
				$scope.addResponse = "Success";
			})
			.error(function(data, status){
				//alert('Error: ' + status);
			});
		}
	}
);

$(document).ready(function(){
	$('[data-toggle="tooltip"]').tooltip();
});