// For testing with node.js

var sys = require("sys");

var RIFFWAVE = require("./riffwave.js").RIFFWAVE;
var sfxr = require("./sfxr.js");

var sound = sfxr.generate((new sfxr.Params()).pickupCoin());

require("fs").writeFile("./test.wav", sound.wav, function(err) {
  if(err) {
    sys.puts(err);
  } else {
    sys.puts("The file was saved!");
  }
});
