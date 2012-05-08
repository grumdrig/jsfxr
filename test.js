// For testing with node.js

var sys = require("util");

var RIFFWAVE = require("./riffwave.js").RIFFWAVE;
var sfxr = require("./sfxr.js");

//var sound = new sfxr.SoundEffectByUI((new sfxr.Params()).tone()).generate();

var knobs = new sfxr.Knobs({
  shape: sfxr.SAWTOOTH,
  attack: 0.1,
  decay: 0.1,
  sustain: 1,
  frequency: 440,
});
var sound = new sfxr.SoundEffect(knobs).generate();

require("fs").writeFile("./test.wav", new Buffer(sound.wav), 'binary', 
                        function(err) {
                          if(err) {
                            sys.puts(err);
                          } else {
                            sys.puts("The file was saved!");
                          }
                        });
