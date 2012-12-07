function openOptionPage(){
    window.open(chrome.extension.getURL("options.html"));
}

// Check if we just installed this extension.
if (localStorage['firstIntall'] == undefined) {
    openOptionPage();
}
localStorage['firstIntall'] = true;

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.method == "getLocalStorage")
      sendResponse({data: localStorage[request.key]});
    else if (request.method == "getUser")
    {
      sendResponse({data: {
      	name: localStorage['userName'],
      	key: localStorage['userKey'],
      	auth: localStorage['userAuth']
      }});
    }
    else
      sendResponse({}); // snub them.
});