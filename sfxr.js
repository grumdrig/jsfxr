
// Wave shapes
var SQUARE = 0;
var SAWTOOTH = 1;
var SINE = 2;
var NOISE = 3;


// Playback volume
var masterVolume = 1.0;


var defaultKnobs = {
  shape: SQUARE, // SQUARE/SAWTOOTH/SINE/NOISE

  attack:  0,   // sec
  sustain: 0.2, // sec
  punch:   0,   // proportion
  decay:   0.2, // sec

  frequency:        1000, // Hz
  frequencyMin:        0, // Hz
  frequencySlide:      0, // 8va/sec
  frequencySlideSlide: 0, // 8va/sec/sec

  vibratoDepth:  0, // proportion
  vibratoRate:  10, // Hz

  arpeggioFactor: 1,   // multiple of frequency
  arpeggioDelay:  0.1, // sec  
  
  dutyCycle:      0.5, // proportion of wavelength
  dutyCycleSweep: 0,   // proportion/second

  retriggerRate: 0, // Hz

  flangerOffset: 0, // sec
  flangerSweep:  0, // offset/sec

  lowPassFrequency: 44100, // Hz
  lowPassSweep:     1,     // ^sec
  lowPassResonance: 0.5,   // proportion

  highPassFrequency: 0, // Hz
  highPassSweep:     0, // ^sec
  
  gain: -10, // dB

  sampleRate: 44100, // Hz
  sampleSize: 8,     // bits per channel
};


function Knobs(settings) {
  settings = settings||{};
  for (var i in defaultKnobs) {
    if (settings.hasOwnProperty(i))
      this[i] = settings[i];
    else
      this[i] = defaultKnobs[i];
  }
}

Knobs.prototype.translate = function (ps) {
  function sqr(x) { return x * x }
  function cube(x) { return x * x * x }
  function sign(x) { return x < 0 ? -1 : 1 }
  function log(x, b) { return Math.log(x) / Math.log(b); }
  var pow = Math.pow;


  this.attack = sqr(ps.p_env_attack) * 100000 / 44100;
  this.sustain = sqr(ps.p_env_sustain) * 100000 / 44100;
  this.punch = ps.p_env_punch;
  this.decay = sqr(ps.p_env_decay) * 100000 / 44100;

  this.frequency = 8 * 441 * (sqr(ps.p_base_freq) + 0.001);
  if (ps.p_freq_limit > 0)
    this.frequencyMin = 8 * 441 * (sqr(ps.p_freq_limit) + 0.001);
  else
    this.frequencyMin = 0;
  this.enableFrequencyCutoff = (ps.p_freq_limit > 0);
  this.frequencySlide = 44100 * log(1 - cube(ps.p_freq_ramp) / 100, 0.5);
  this.frequencySlideSlide = -cube(ps.p_freq_dramp) / 1000000 * 
    44100 * pow(2, 44101/44100);

  this.vibratoRate = 44100 * 10 / 64 * sqr(ps.p_vib_speed) / 100;
  this.vibratoDepth = ps.p_vib_strength / 2;

  this.arpeggioFactor = 1 / ((ps.p_arp_mod >= 0) ? 
                             1.0 - sqr(ps.p_arp_mod) * 0.9 : 
                             1.0 + sqr(ps.p_arp_mod) * 10);
  this.arpeggioDelay = ((ps.p_arp_speed === 1) ? 0 :
                Math.floor(sqr(1 - ps.p_arp_speed) * 20000 + 32) / 44100);

  this.dutyCycle = (1 - ps.p_duty) / 2;
  this.dutyCycleSweep = 8 * 44100 * -ps.p_duty_ramp / 20000;

  this.retriggerRate = 44100 / ((ps.p_repeat_speed === 0) ? 0 :
                       Math.floor(sqr(1 - ps.p_repeat_speed) * 20000) + 32);

  this.flangerOffset = sign(ps.p_pha_offset) * 
    sqr(ps.p_pha_offset) * 1020 / 44100;
  this.flangerSweep = sign(ps.p_pha_ramp) * sqr(ps.p_pha_ramp);

  this.enableLowPassFilter = (ps.p_lpf_freq != 1);
  function flurp(x) { return x / (1-x) }
  this.lowPassFrequency = ps.p_lpf_freq === 1 ? 44100 :
    Math.round(8 * 44100 * flurp(cube(ps.p_lpf_freq) / 10));
  this.lowPassSweep = pow(1 + ps.p_lpf_ramp / 10000, 44100);
  this.lowPassResonance = 1 - (5 / (1 + sqr(ps.p_lpf_resonance) * 20)) / 9;

  this.highPassFrequency = Math.round(8 * 44100 * 
                                      flurp(sqr(ps.p_hpf_freq) / 10));
  this.highPassSweep = pow(1 + ps.p_hpf_ramp * 0.0003, 44100);

  this.gain = 10 * log(sqr(Math.exp(ps.sound_vol) - 1), 10);

  this.sampleRate = ps.sample_rate;
  this.sampleSize = ps.sample_size;

  return this;
}

// Sound generation parameters are on [0,1] unless noted SIGNED & thus
// on [-1,1]
function Params() {
  this.oldParams = true;  // Note what structure this is

  // Wave shape
  this.wave_type = SQUARE;

  // Envelope
  this.p_env_attack = 0.0;   // Attack time
  this.p_env_sustain = 0.3;  // Sustain time
  this.p_env_punch = 0.0;    // Sustain punch
  this.p_env_decay = 0.4;    // Decay time

  // Tone
  this.p_base_freq = 0.3;    // Start frequency
  this.p_freq_limit = 0.0;   // Min frequency cutoff
  this.p_freq_ramp = 0.0;    // Slide (SIGNED)
  this.p_freq_dramp = 0.0;   // Delta slide (SIGNED)
  // Vibrato
  this.p_vib_strength = 0.0; // Vibrato depth
  this.p_vib_speed = 0.0;    // Vibrato speed

  // Tonal change
  this.p_arp_mod = 0.0;      // Change amount (SIGNED)
  this.p_arp_speed = 0.0;    // Change speed

  // Square wave duty (proportion of time signal is high vs. low)
  this.p_duty = 0.0;         // Square duty
  this.p_duty_ramp = 0.0;    // Duty sweep (SIGNED)

  // Repeat
  this.p_repeat_speed = 0.0; // Repeat speed

  // Flanger
  this.p_pha_offset = 0.0;   // Flanger offset (SIGNED)
  this.p_pha_ramp = 0.0;     // Flanger sweep (SIGNED)

  // Low-pass filter
  this.p_lpf_freq = 1.0;     // Low-pass filter cutoff
  this.p_lpf_ramp = 0.0;     // Low-pass filter cutoff sweep (SIGNED)
  this.p_lpf_resonance = 0.0;// Low-pass filter resonance
  // High-pass filter
  this.p_hpf_freq = 0.0;     // High-pass filter cutoff
  this.p_hpf_ramp = 0.0;     // High-pass filter cutoff sweep (SIGNED)

  // Sample parameters
  this.sound_vol = 0.5;
  this.sample_rate = 44100;
  this.sample_size = 8;
}


function frnd(range) {
  return Math.random() * range;
}


function rnd(max) {
  return Math.floor(Math.random() * (max + 1));
}


// These functions roll up random sounds appropriate to various
// typical game events:


Params.prototype.pickupCoin = function () {
  this.p_base_freq = 0.4 + frnd(0.5);
  this.p_env_attack = 0.0;
  this.p_env_sustain = frnd(0.1);
  this.p_env_decay = 0.1 + frnd(0.4);
  this.p_env_punch = 0.3 + frnd(0.3);
  if (rnd(1)) {
    this.p_arp_speed = 0.5 + frnd(0.2);
    this.p_arp_mod = 0.2 + frnd(0.4);
  }
  return this;
}


Params.prototype.laserShoot = function () {
  this.wave_type = rnd(2);
  if(this.wave_type === SINE && rnd(1))
    this.wave_type = rnd(1);
  this.p_base_freq = 0.5 + frnd(0.5);
  this.p_freq_limit = this.p_base_freq - 0.2 - frnd(0.6);
  if (this.p_freq_limit < 0.2) this.p_freq_limit = 0.2;
  this.p_freq_ramp = -0.15 - frnd(0.2);
  if (rnd(2) === 0) {
    this.p_base_freq = 0.3 + frnd(0.6);
    this.p_freq_limit = frnd(0.1);
    this.p_freq_ramp = -0.35 - frnd(0.3);
  }
  if (rnd(1)) {
    this.p_duty = frnd(0.5);
    this.p_duty_ramp = frnd(0.2);
  } else {
    this.p_duty = 0.4 + frnd(0.5);
    this.p_duty_ramp = -frnd(0.7);
  }
  this.p_env_attack = 0.0;
  this.p_env_sustain = 0.1 + frnd(0.2);
  this.p_env_decay = frnd(0.4);
  if (rnd(1))
    this.p_env_punch = frnd(0.3);
  if (rnd(2) === 0) {
    this.p_pha_offset = frnd(0.2);
    this.p_pha_ramp = -frnd(0.2);
  }
  if (rnd(1))
    this.p_hpf_freq = frnd(0.3);

  return this;
}


Params.prototype.explosion = function () {
  this.wave_type = NOISE;
  if (rnd(1)) {
    this.p_base_freq = 0.1 + frnd(0.4);
    this.p_freq_ramp = -0.1 + frnd(0.4);
  } else {
    this.p_base_freq = 0.2 + frnd(0.7);
    this.p_freq_ramp = -0.2 - frnd(0.2);
  }
  this.p_base_freq *= this.p_base_freq;
  if (rnd(4) === 0)
    this.p_freq_ramp = 0.0;
  if (rnd(2) === 0)
    this.p_repeat_speed = 0.3 + frnd(0.5);
  this.p_env_attack = 0.0;
  this.p_env_sustain = 0.1 + frnd(0.3);
  this.p_env_decay = frnd(0.5);
  if (rnd(1) === 0) {
    this.p_pha_offset = -0.3 + frnd(0.9);
    this.p_pha_ramp = -frnd(0.3);
  }
  this.p_env_punch = 0.2 + frnd(0.6);
  if (rnd(1)) {
    this.p_vib_strength = frnd(0.7);
    this.p_vib_speed = frnd(0.6);
  }
  if (rnd(2) === 0) {
    this.p_arp_speed = 0.6 + frnd(0.3);
    this.p_arp_mod = 0.8 - frnd(1.6);
  }

  return this;
}


Params.prototype.powerUp = function () {
  if (rnd(1)) {
    this.wave_type = SAWTOOTH;
    this.p_duty = 1;
  } else {
    this.p_duty = frnd(0.6);
  }
  if (rnd(1)) {
    this.p_base_freq = 0.2 + frnd(0.3);
    this.p_freq_ramp = 0.1 + frnd(0.4);
    this.p_repeat_speed = 0.4 + frnd(0.4);
  } else {
    this.p_base_freq = 0.2 + frnd(0.3);
    this.p_freq_ramp = 0.05 + frnd(0.2);
    if (rnd(1)) {
      this.p_vib_strength = frnd(0.7);
      this.p_vib_speed = frnd(0.6);
    }
  }
  this.p_env_attack = 0.0;
  this.p_env_sustain = frnd(0.4);
  this.p_env_decay = 0.1 + frnd(0.4);

  return this;
}


Params.prototype.hitHurt = function () {
  this.wave_type = rnd(2);
  if (this.wave_type === SINE)
    this.wave_type = NOISE;
  if (this.wave_type === SQUARE)
    this.p_duty = frnd(0.6);
  this.p_base_freq = 0.2 + frnd(0.6);
  this.p_freq_ramp = -0.3 - frnd(0.4);
  this.p_env_attack = 0.0;
  this.p_env_sustain = frnd(0.1);
  this.p_env_decay = 0.1 + frnd(0.2);
  if (rnd(1))
    this.p_hpf_freq = frnd(0.3);
  return this;
}


Params.prototype.jump = function () {
  this.wave_type = SQUARE;
  this.p_duty = frnd(0.6);
  this.p_base_freq = 0.3 + frnd(0.3);
  this.p_freq_ramp = 0.1 + frnd(0.2);
  this.p_env_attack = 0.0;
  this.p_env_sustain = 0.1 + frnd(0.3);
  this.p_env_decay = 0.1 + frnd(0.2);
  if (rnd(1))
    this.p_hpf_freq = frnd(0.3);
  if (rnd(1))
    this.p_lpf_freq = 1.0 - frnd(0.6);
  return this;
}


Params.prototype.blipSelect = function () {
  this.wave_type = rnd(1);
  if (this.wave_type === SQUARE)
    this.p_duty = frnd(0.6);
  this.p_base_freq = 0.2 + frnd(0.4);
  this.p_env_attack = 0.0;
  this.p_env_sustain = 0.1 + frnd(0.1);
  this.p_env_decay = frnd(0.2);
  this.p_hpf_freq = 0.1;
  return this;
}


Params.prototype.mutate = function () {
  if (rnd(1)) this.p_base_freq += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_freq_ramp += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_freq_dramp += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_duty += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_duty_ramp += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_vib_strength += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_vib_speed += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_vib_delay += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_env_attack += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_env_sustain += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_env_decay += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_env_punch += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_lpf_resonance += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_lpf_freq += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_lpf_ramp += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_hpf_freq += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_hpf_ramp += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_pha_offset += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_pha_ramp += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_repeat_speed += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_arp_speed += frnd(0.1) - 0.05;
  if (rnd(1)) this.p_arp_mod += frnd(0.1) - 0.05;
}


Params.prototype.random = function () {
  this.p_base_freq = Math.pow(frnd(2.0) - 1.0, 2.0);
  if (rnd(1))
    this.p_base_freq = Math.pow(frnd(2.0) - 1.0, 3.0) + 0.5;
  this.p_freq_limit = 0.0;
  this.p_freq_ramp = Math.pow(frnd(2.0) - 1.0, 5.0);
  if (this.p_base_freq > 0.7 && this.p_freq_ramp > 0.2)
    this.p_freq_ramp = -this.p_freq_ramp;
  if (this.p_base_freq < 0.2 && this.p_freq_ramp < -0.05)
    this.p_freq_ramp = -this.p_freq_ramp;
  this.p_freq_dramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  this.p_duty = frnd(2.0) - 1.0;
  this.p_duty_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  this.p_vib_strength = Math.pow(frnd(2.0) - 1.0, 3.0);
  this.p_vib_speed = frnd(2.0) - 1.0;
  this.p_env_attack = Math.pow(frnd(2.0) - 1.0, 3.0);
  this.p_env_sustain = Math.pow(frnd(2.0) - 1.0, 2.0);
  this.p_env_decay = frnd(2.0) - 1.0;
  this.p_env_punch = Math.pow(frnd(0.8), 2.0);
  if (this.p_env_attack + this.p_env_sustain + this.p_env_decay < 0.2) {
    this.p_env_sustain += 0.2 + frnd(0.3);
    this.p_env_decay += 0.2 + frnd(0.3);
  }
  this.p_lpf_resonance = frnd(2.0) - 1.0;
  this.p_lpf_freq = 1.0 - Math.pow(frnd(1.0), 3.0);
  this.p_lpf_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  if (this.p_lpf_freq < 0.1 && this.p_lpf_ramp < -0.05)
    this.p_lpf_ramp = -this.p_lpf_ramp;
  this.p_hpf_freq = Math.pow(frnd(1.0), 5.0);
  this.p_hpf_ramp = Math.pow(frnd(2.0) - 1.0, 5.0);
  this.p_pha_offset = Math.pow(frnd(2.0) - 1.0, 3.0);
  this.p_pha_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  this.p_repeat_speed = frnd(2.0) - 1.0;
  this.p_arp_speed = frnd(2.0) - 1.0;
  this.p_arp_mod = frnd(2.0) - 1.0;
  return this;
}


Params.prototype.tone = function () {
  this.wave_type = SINE;
  this.p_base_freq = 0.35173364; // 440 Hz
  this.p_env_attack = 0;
  this.p_env_sustain = 0.6641; // 1 sec
  this.p_env_decay = 0;
  this.p_env_punch = 0;
  return this;
}



function SoundEffectByUI(ps) {

  //
  // Convert user-facing parameter values to units usable by the sound
  // generator
  //

  this.initForRepeat = function() {
    this.elapsedSinceRepeat = 0;

    this.period = 100 / (ps.p_base_freq * ps.p_base_freq + 0.001);
    this.periodMax = 100 / (ps.p_freq_limit * ps.p_freq_limit + 0.001);
    this.enableFrequencyCutoff = (ps.p_freq_limit > 0);
    this.periodMult = 1 - Math.pow(ps.p_freq_ramp, 3) * 0.01;
    this.periodMultSlide = -Math.pow(ps.p_freq_dramp, 3) * 0.000001;

    this.dutyCycle = 0.5 - ps.p_duty * 0.5;
    this.dutyCycleSlide = -ps.p_duty_ramp * 0.00005;

    if (ps.p_arp_mod >= 0.0)
      this.arpeggioMultiplier = 1 - Math.pow(ps.p_arp_mod, 2.0) * .9;
    else
      this.arpeggioMultiplier = 1 + Math.pow(ps.p_arp_mod, 2.0) * 10;
    this.arpeggioTime = Math.floor(Math.pow(1.0 - ps.p_arp_speed, 2.0) * 20000 + 32);
    if (ps.p_arp_speed === 1.0)
      this.arpeggioTime = 0;
  }

  this.initForRepeat();  // First time through, this is a bit of a misnomer

  // Waveform shape
  this.waveShape = parseInt(ps.wave_type);

  // Filter
  this.fltw = Math.pow(ps.p_lpf_freq, 3.0) * 0.1;
  this.enableLowPassFilter = (ps.p_lpf_freq != 1);
  this.fltw_d = 1.0 + ps.p_lpf_ramp * 0.0001;
  this.fltdmp = 5.0 / (1.0 + Math.pow(ps.p_lpf_resonance, 2.0) * 20.0) *
    (0.01 + this.fltw);
  if (this.fltdmp > 0.8) this.fltdmp=0.8;
  this.flthp = Math.pow(ps.p_hpf_freq, 2.0) * 0.1;
  this.flthp_d = 1.0 + ps.p_hpf_ramp * 0.0003;

  // Vibrato
  this.vibratoSpeed = Math.pow(ps.p_vib_speed, 2.0) * 0.01;
  this.vibratoAmplitude = ps.p_vib_strength * 0.5;

  // Envelope
  this.envelopeLength = [
    Math.floor(ps.p_env_attack * ps.p_env_attack * 100000.0),
    Math.floor(ps.p_env_sustain * ps.p_env_sustain * 100000.0),
    Math.floor(ps.p_env_decay * ps.p_env_decay * 100000.0)
  ];
  this.envelopePunch = ps.p_env_punch;

  // Flanger
  this.flangerOffset = Math.pow(ps.p_pha_offset, 2.0) * 1020.0;
  if (ps.p_pha_offset < 0.0) this.flangerOffset = -this.flangerOffset;
  this.flangerOffsetSlide = Math.pow(ps.p_pha_ramp, 2.0) * 1.0;
  if (ps.p_pha_ramp < 0.0) this.flangerOffsetSlide = -this.flangerOffsetSlide;

  // Repeat
  this.repeatTime = Math.floor(Math.pow(1.0 - ps.p_repeat_speed, 2.0) * 20000
                               + 32);
  if (ps.p_repeat_speed === 0.0)
    this.repeatTime = 0;

  this.gain = Math.exp(ps.sound_vol) - 1;

  this.sampleRate = ps.sample_rate;
  this.bitsPerChannel = ps.sample_size;

  for (var i in this) if (typeof this[i] !== 'function') console.log(i, this[i]);
}



function SoundEffect(ps) {

  //
  // Convert user-facing parameter values to units usable by the sound
  // generator
  //

  this.initForRepeat = function() {
    this.elapsedSinceRepeat = 0;

    this.period = 8 * 44100 / ps.frequency;
    this.periodMax = 8 * 44100 / ps.frequencyMin;
    this.enableFrequencyCutoff = (ps.frequencyMin > 0);
    this.periodMult = Math.pow(.5, ps.frequencySlide / 44100);
    this.periodMultSlide = ps.frequencySlideSlide * Math.pow(2, -44101/44100)
      / 44100;

    this.dutyCycle = ps.dutyCycle;
    this.dutyCycleSlide = ps.dutyCycleSweep / (8 * 44100);

    this.arpeggioMultiplier = 1 / ps.arpeggioFactor;
    this.arpeggioTime = ps.arpeggioDelay * 44100;
  }
  this.initForRepeat();  // First time through, this is a bit of a misnomer

  // Waveform shape
  this.waveShape = ps.shape;

  // Low pass filter
  this.fltw = ps.lowPassFrequency / (8 * 44100 + ps.lowPassFrequency);
  this.enableLowPassFilter = ps.lowPassFrequency < 44100;
  this.fltw_d = Math.pow(ps.lowPassSweep, 1/44100);
  this.fltdmp = (1 - ps.lowPassResonance) * 9 * (.01 + this.fltw);

  // High pass filter
  this.flthp = ps.highPassFrequency / (8 * 44100 + ps.highPassFrequency);
  this.flthp_d = Math.pow(ps.highPassSweep, 1/44100);

  // Vibrato
  this.vibratoSpeed = ps.vibratoRate * 64 / 44100 / 10;
  this.vibratoAmplitude = ps.vibratoDepth;

  // Envelope
  this.envelopeLength = [
    Math.floor(ps.attack * 44100),
    Math.floor(ps.sustain * 44100),
    Math.floor(ps.decay * 44100)
  ];
  this.envelopePunch = ps.punch;

  // Flanger
  this.flangerOffset = ps.flangerOffset * 44100;
  this.flangerOffsetSlide = ps.flangerSweep;

  // Repeat
  this.repeatTime = ps.retriggerRate ? 1 / (44100 * ps.retriggerRate) : 0;

  // Gain
  this.gain = Math.sqrt(Math.pow(10, ps.gain/10));

  this.sampleRate = ps.sampleRate;
  this.bitsPerChannel = ps.sampleSize;
}


SoundEffectByUI.prototype.generate =
    SoundEffect.prototype.generate = function () {
  var fltp = 0.0;
  var fltdp = 0.0;
  var fltphp = 0.0;

  var noise_buffer = Array(32);
  for (var i = 0; i < 32; ++i)
    noise_buffer[i] = Math.random() * 2.0 - 1.0;

  var envelopeStage = 0;
  var envelopeElapsed = 0;

  var vibratoPhase = 0.0;

  var phase = 0;
  var ipp = 0;
  var flanger_buffer = Array(1024);
  for (var i = 0; i < 1024; ++i)
    flanger_buffer[i] = 0.0;

  var num_clipped = 0;

  var buffer = [];

  var sample_sum = 0;
  var num_summed = 0;
  var summands = Math.floor(44100 / this.sampleRate);

  for(var t = 0; ; ++t) {

    // Repeats
    if (this.repeatTime != 0 && ++this.elapsedSinceRepeat >= this.repeatTime)
      this.initForRepeat();

    // Arpeggio (single)
    if(this.arpeggioTime != 0 && t >= this.arpeggioTime) {
      this.arpeggioTime = 0;
      this.period *= this.arpeggioMultiplier;
    }

    // Frequency slide, and frequency slide slide!
    this.periodMult += this.periodMultSlide;
    this.period *= this.periodMult;
    if(this.period > this.periodMax) {
      this.period = this.periodMax;
      if (this.enableFrequencyCutoff)
        break;
    }

    // Vibrato
    var rfperiod = this.period;
    if (this.vibratoAmplitude > 0.0) {
      vibratoPhase += this.vibratoSpeed;
      rfperiod = this.period * (1.0 + Math.sin(vibratoPhase) * this.vibratoAmplitude);
    }
    var iperiod = Math.floor(rfperiod);
    if (iperiod < 8) iperiod = 8;

    // Square wave duty cycle
    this.dutyCycle += this.dutyCycleSlide;
    if (this.dutyCycle < 0.0) this.dutyCycle = 0.0;
    if (this.dutyCycle > 0.5) this.dutyCycle = 0.5;

    // Volume envelope
    if (++envelopeElapsed > this.envelopeLength[envelopeStage]) {
      envelopeElapsed = 0;
      if (++envelopeStage > 2)
        break;
    }
    var env_vol;
    if (envelopeStage === 0) {
      // Attack
      env_vol = envelopeElapsed / this.envelopeLength[0];
    } else if (envelopeStage === 1) {
      // Sustain
      env_vol = 1.0 + Math.pow(1.0 - envelopeElapsed / this.envelopeLength[1],
                               1.0) * 2.0 * this.envelopePunch;
    } else {
      // Decay
      env_vol = 1.0 - envelopeElapsed / this.envelopeLength[2];
    }

    // Flanger step
    this.flangerOffset += this.flangerOffsetSlide;
    var iphase = Math.abs(Math.floor(this.flangerOffset));
    if (iphase > 1023) iphase = 1023;

    if (this.flthp_d != 0.0) {
      this.flthp *= this.flthp_d;
      if (this.flthp < 0.00001)
        this.flthp = 0.00001;
      if (this.flthp > 0.1)
        this.flthp = 0.1;
    }

    // 8x oversampling
    var sample = 0;
    for (var si = 0; si < 8; ++si) {
      var sub_sample = 0;
      phase++;
      if (phase >= iperiod) {
        phase %= iperiod;
        if (this.waveShape === NOISE)
          for(var i = 0; i < 32; ++i)
            noise_buffer[i] = Math.random() * 2.0 - 1.0;
      }

      // Base waveform
      var fp = phase / iperiod;
      if (this.waveShape === SQUARE) {
        if (fp < this.dutyCycle)
          sub_sample=0.5;
        else
          sub_sample=-0.5;
      } else if (this.waveShape === SAWTOOTH) {
        if (fp < this.dutyCycle)
          sub_sample = -1 + 2 * fp/this.dutyCycle;
        else
          sub_sample = 1 - 2 * (fp-this.dutyCycle)/(1-this.dutyCycle);
      } else if (this.waveShape === SINE) {
        sub_sample = Math.sin(fp * 2 * Math.PI);
      } else if (this.waveShape === NOISE) {
        sub_sample = noise_buffer[Math.floor(phase * 32 / iperiod)];
      } else {
        throw "ERROR: Bad wave type: " + this.waveShape;
      }

      // Low-pass filter
      var pp = fltp;
      this.fltw *= this.fltw_d;
      if (this.fltw < 0.0) this.fltw = 0.0;
      if (this.fltw > 0.1) this.fltw = 0.1;
      if (this.enableLowPassFilter) {
        fltdp += (sub_sample - fltp) * this.fltw;
        fltdp -= fltdp * this.fltdmp;
      } else {
        fltp = sub_sample;
        fltdp = 0.0;
      }
      fltp += fltdp;

      // High-pass filter
      fltphp += fltp - pp;
      fltphp -= fltphp * this.flthp;
      sub_sample = fltphp;

      // Flanger
      flanger_buffer[ipp & 1023] = sub_sample;
      sub_sample += flanger_buffer[(ipp - iphase + 1024) & 1023];
      ipp = (ipp + 1) & 1023;

      // final accumulation and envelope application
      sample += sub_sample * env_vol;
    }

    // Accumulate samples appropriately for sample rate
    sample_sum += sample;
    if (++num_summed >= summands) {
      num_summed = 0;
      sample = sample_sum / summands;
      sample_sum = 0;
    } else {
      continue;
    }

    sample = sample / 8 * masterVolume;
    sample *= this.gain;

    if (this.bitsPerChannel === 8) {
      // Rescale [-1.0, 1.0) to [0, 256)
      sample = Math.floor((sample + 1) * 128);
      if (sample > 255) {
        sample = 255;
        ++num_clipped;
      } else if (sample < 0) {
        sample = 0;
        ++num_clipped;
      }
      buffer.push(sample);
    } else {
      // Rescale [-1.0, 1.0) to [-32768, 32768)
      sample = Math.floor(sample * (1<<15));
      if (sample >= (1<<15)) {
        sample = (1 << 15)-1;
        ++num_clipped;
      } else if (sample < -(1<<15)) {
        sample = -(1 << 15);
        ++num_clipped;
      }
      buffer.push(sample & 0xFF);
      buffer.push((sample >> 8) & 0xFF);
    }
  }

  var wave = new RIFFWAVE();
  wave.header.sampleRate = this.sampleRate;
  wave.header.bitsPerSample = this.bitsPerChannel;
  wave.Make(buffer);
  wave.clipping = num_clipped;
  return wave;
}


Knobs.prototype.tone = function () {
  this.shape = SINE;
  this.frequency = 440;
  this.attack = 0;
  this.sustain = 1;
  this.decay = 0;
  return this;
}


var genners = 'pickupCoin,laserShoot,explosion,powerUp,hitHurt,jump,blipSelect,random,tone'.split(',');
for (var i = 0; i < genners.length; ++i) {
  (function (g) {
    if (!Knobs.prototype[g])
      Knobs.prototype[g] = function () {
        return this.translate(new Params()[g]());
      }
  })(genners[i]);
}



// For node.js
if (typeof exports !== 'undefined')  {
  var RIFFWAVE = require("./riffwave").RIFFWAVE;
  exports.Params = Params;
  exports.Knobs = Knobs;
  exports.SoundEffect = SoundEffect;
  exports.SoundEffectByUI = SoundEffectByUI;
  exports.SQUARE = SQUARE;
  exports.SAWTOOTH = SAWTOOTH;
  exports.SINE = SINE;
  exports.NOISE = NOISE;
}
