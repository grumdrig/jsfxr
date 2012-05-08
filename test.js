// For testing with node.js

var sys = require("util");

var RIFFWAVE = require("./riffwave.js").RIFFWAVE;
var sfxr = require("./sfxr.js");

//var sound = new sfxr.SoundEffectByUI((new sfxr.Params()).tone()).generate();

var knobs = sfxr.Knobs();
knobs.decay = 0;
knobs.sustain = 1;
knobs.vibratoRate = 0;
var sound = new sfxr.SoundEffect(knobs).generate();

require("fs").writeFile("./test.wav", new Buffer(sound.wav), 'binary', 
                        function(err) {
                          if(err) {
                            sys.puts(err);
                          } else {
                            sys.puts("The file was saved!");
                          }
                        });
