// For testing with node.js

var sys = require("util");

var RIFFWAVE = require("./riffwave.js").RIFFWAVE;
var sfxr = require("./sfxr.js");

var sound = new sfxr.SoundEffectByUI((new sfxr.Params()).pickupCoin()).generate();

require("fs").writeFile("./test.wav", new Buffer(sound.wav), 'binary', 
                        function(err) {
                          if(err) {
                            sys.puts(err);
                          } else {
                            sys.puts("The file was saved!");
                          }
                        });
