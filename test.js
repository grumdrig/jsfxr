// For testing with node.js

var sys = require("util");

var RIFFWAVE = require("./riffwave.js").RIFFWAVE;
var sfxr = require("./sfxr.js");

function dump(that) {
  for (var i in that) 
    if (typeof that[i] !== 'function') 
      console.log(i, that[i]);
}

//var sound = new sfxr.SoundEffectByUI((new sfxr.Params()).tone()).generate();
/*
var knobs = new sfxr.Knobs({
  shape: sfxr.SAWTOOTH,
  attack: 0.1,
  decay: 0.1,
  sustain: 1,
  frequency: 440,
});
var sound = new sfxr.SoundEffect(knobs).generate();
*/
var sound = new sfxr.SoundEffect(new sfxr.Knobs().tone()).generate();

console.log("\nKNOBS TONE\n")
var a, b;
dump(a = new sfxr.SoundEffect(new sfxr.Knobs().tone()))

console.log("\nKNOBS FOR IT\n");
dump(new sfxr.Knobs().tone());

console.log("\nPARAMS TONE\n")
dump(b = new sfxr.SoundEffectByUI(new sfxr.Params().tone()));

console.log("\nPARAMS FOR IT\n")
dump(new sfxr.Params().tone());

function diff(a, b) {
  for (var i in a) {
    if (a.hasOwnProperty(i) && typeof a[i] !== 'function') {
      if (b.hasOwnProperty(i)) {
        if (a[i] !== b[i])
          console.log('%', i, a[i], b[i])
      } else 
        console.log('<', i, a[i]);
    }
  }
  for (var i in b) {
    if (b.hasOwnProperty(i) && !a.hasOwnProperty(i)) {
      console.log('>', i, b[i]);
    }
  }
}

console.log('\nDIFF <knobs >params\n');
diff(a, b)


require("fs").writeFile("./test.wav", new Buffer(sound.wav), 'binary', 
                        function(err) {
                          if(err) {
                            sys.puts(err);
                          } else {
                            sys.puts("The file was saved!");
                          }
                        });
