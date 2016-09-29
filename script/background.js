var songs = [];
console.log("bg");

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
    console.log(response.farewell);
  });
});

chrome.runtime.onMessage.addListener(
  function(req, sender, sendResponse) {
	  if(req.songs) songs = req.songs;
	  else if(req.getSongs){
		  
	  }
      sendResponse({farewell: "goodbye"});
  });