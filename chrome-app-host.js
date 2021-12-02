chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('index.html', {
      id:"mainWin",
      frame: "none",
      innerBounds: {width: 100, height: 100}
  }, function(win) {
    win.contentWindow.launchData = launchData;
  });
});
