angular.module('PlayYouApp', ['autocomplete']).controller('PlayYouController',
	function($scope, $http){
		var danu = "http:danu7.it.nuigalway.ie:8620";
		$scope.newSong = {};
		$scope.user;
		$scope.addResponse;
		$scope.songs = [];
		$scope.songSearch = [];
		console.log(window.location.href );
		
		function b64_to_utf8( str ) {
		  return decodeURIComponent(escape(window.atob( str )));
		}
				
		function decodeToken(token){
			var encodedUser;
			encodedUser = decodeURI(b64_to_utf8(token.split('.')[1]));
			$scope.user = JSON.parse(encodedUser); 
			console.dir($scope.user);
		};
		
		$scope.getSongs = function(){
			$http.get(danu + '/api/playyou/getSongs')
			.success(function(data){
				console.dir(data.songs);
				$scope.songs = data.songs;
				if($scope.newSong.link) $scope.checkLink($scope.newSong.link);
				for(var i = 0; i < $scope.songs.length; i++){
					$scope.songSearch.push($scope.songs[i].title + " - " + $scope.songs[i].artist);
				}
			})
			.error(function(data, status){
				alert("Error: " + status);
			});
		}
		
		$scope.checkLink = function(link){
			console.log(link);
			if(link === undefined || link == "") { $scope.correctLink = "Please Enter a Correct Link"; $scope.$apply(); return; }
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
			
			$http.post(danu + '/api/login', {
			  email: email,
			  password: "pass"
			})
			.success(function(data){
				console.dir(data)
				localStorage.setItem('JWT', data.token);
				decodeToken(data.token);
				getForm();
			})
			.error(function(data){console.dir(data)});
		}
		
		var token = localStorage.getItem('JWT');
		if(token){
			decodeToken(token);
			getForm();
		}
		
		function getForm(){
			var url;
			$scope.getSongs();
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
		
		$scope.checkTitle = function(title){
			console.log("Check Title");
			for(var i = 0; i < $scope.songs.length; i++){
				if(title.toLowerCase() == $scope.songs[i].title.toLowerCase()){
					$scope.correctTitle = "Song Title Already Submitted by: " + $scope.songs[i].submitted_by;
					return;
				} else {
					$scope.correctTitle = null;
				}
			}
		}
		
		$scope.addSong = function(song){
			console.log("Add Song");
			
			$http.post(danu + '/api/playyou/addSong', {song: song, name: $scope.user.name, _id: $scope.user._id})
			.success(function(data){
				$scope.addResponse = "Success";
			})
			.error(function(data, status){
				alert('Error: ' + status);
			});
		}
	}
);