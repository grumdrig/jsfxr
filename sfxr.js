
// Wave shapes
var SQUARE = 0;
var SAWTOOTH = 1;
var SINE = 2;
var NOISE = 3;


// Playback volume
var masterVolume = 1.0;


// Sound generation parameters are on [0,1] unless noted SIGNED & thus on [-1,1]
function Params() {
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

  // Phaser
  this.p_pha_offset = 0.0;   // Phaser offset (SIGNED)
  this.p_pha_ramp = 0.0;     // Phaser sweep (SIGNED)

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
  if (rnd(1))
    this.wave_type = SAWTOOTH;
  else
    this.p_duty = frnd(0.6);
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
  this.wave_tuype = SINE;
  this.p_base_freq = .35173364;  // 440 Hz
  this.p_env_attack = 0.0;
  this.p_env_sustain = 0.6641;  // 1 sec
  this.p_env_decay = 0;
  this.p_env_punch = 0;
  return this;
}


// Generate audio waveform according to the parameters thereof
var generate = function (ps) {

  //
  // Convert user-facing parameter values to units usable by the sound generator
  //

  var rep_time;
  var fperiod, period, fmaxperiod;
  var fslide, fdslide;
  var square_duty, square_slide;
  var arp_mod, arp_time, arp_limit;

  function repeat() {
    rep_time = 0;

    fperiod = 100.0 / (ps.p_base_freq * ps.p_base_freq + 0.001);
    period = Math.floor(fperiod);
    fmaxperiod = 100.0 / (ps.p_freq_limit * ps.p_freq_limit + 0.001);

    fslide = 1.0 - Math.pow(ps.p_freq_ramp, 3.0) * 0.01;
    fdslide = -Math.pow(ps.p_freq_dramp, 3.0) * 0.000001;

    square_duty = 0.5 - ps.p_duty * 0.5;
    square_slide = -ps.p_duty_ramp * 0.00005;

    if (ps.p_arp_mod >= 0.0)
      arp_mod = 1.0 - Math.pow(ps.p_arp_mod, 2.0) * 0.9;
    else
      arp_mod = 1.0 + Math.pow(ps.p_arp_mod, 2.0) * 10.0;
    arp_time = 0;
    arp_limit = Math.floor(Math.pow(1.0 - ps.p_arp_speed, 2.0) * 20000 + 32);
    if (ps.p_arp_speed === 1.0)
      arp_limit = 0;
  };

  repeat();  // First time through, this is a bit of a misnomer

  // Filter
  var fltp = 0.0;
  var fltdp = 0.0;
  var fltw = Math.pow(ps.p_lpf_freq, 3.0) * 0.1;
  var fltw_d = 1.0 + ps.p_lpf_ramp * 0.0001;
  var fltdmp = 5.0 / (1.0 + Math.pow(ps.p_lpf_resonance, 2.0) * 20.0) *
    (0.01 + fltw);
  if (fltdmp > 0.8) fltdmp=0.8;
  var fltphp = 0.0;
  var flthp = Math.pow(ps.p_hpf_freq, 2.0) * 0.1;
  var flthp_d = 1.0 + ps.p_hpf_ramp * 0.0003;

  // Vibrato
  var vib_phase = 0.0;
  var vib_speed = Math.pow(ps.p_vib_speed, 2.0) * 0.01;
  var vib_amp = ps.p_vib_strength * 0.5;

  // Envelope
  var env_vol = 0.0;
  var env_stage = 0;
  var env_time = 0;
  var env_length = [
    Math.floor(ps.p_env_attack * ps.p_env_attack * 100000.0),
    Math.floor(ps.p_env_sustain * ps.p_env_sustain * 100000.0),
    Math.floor(ps.p_env_decay * ps.p_env_decay * 100000.0)
  ];

  // Phaser
  var phase = 0;
  var fphase = Math.pow(ps.p_pha_offset, 2.0) * 1020.0;
  if (ps.p_pha_offset < 0.0) fphase = -fphase;
  var fdphase = Math.pow(ps.p_pha_ramp, 2.0) * 1.0;
  if (ps.p_pha_ramp < 0.0) fdphase = -fdphase;
  var iphase = Math.abs(Math.floor(fphase));
  var ipp = 0;
  var phaser_buffer = [];
  for (var i = 0; i < 1024; ++i)
    phaser_buffer[i] = 0.0;

  // Noise
  var noise_buffer = [];
  for (var i = 0; i < 32; ++i)
    noise_buffer[i] = Math.random() * 2.0 - 1.0;

  // Repeat
  var rep_limit = Math.floor(Math.pow(1.0 - ps.p_repeat_speed, 2.0) * 20000
                             + 32);
  if (ps.p_repeat_speed === 0.0)
    rep_limit = 0;

  //var gain = 2.0 * Math.log(1 + (Math.E - 1) * ps.sound_vol);
  var gain = 2.0 * ps.sound_vol;
  var gain = Math.exp(ps.sound_vol) - 1;

  var num_clipped = 0;

  //
  // End of parameter conversion. Generate samples.
  //

  var buffer = [];

  var sample_sum = 0;
  var num_summed = 0;
  var summands = Math.floor(44100 / ps.sample_rate);

  for(var t = 0; ; ++t) {

    // Repeats
    if (rep_limit != 0 && ++rep_time >= rep_limit)
      repeat();

    // Arpeggio (single)
    if(arp_limit != 0 && t >= arp_limit) {
      arp_limit = 0;
      fperiod *= arp_mod;
    }

    // Frequency slide, and frequency slide slide!
    fslide += fdslide;
    fperiod *= fslide;
    if(fperiod > fmaxperiod) {
      fperiod = fmaxperiod;
      if (ps.p_freq_limit > 0.0)
        break;
    }

    // Vibrato
    var rfperiod = fperiod;
    if (vib_amp > 0.0) {
      vib_phase += vib_speed;
      rfperiod = fperiod * (1.0 + Math.sin(vib_phase) * vib_amp);
    }
    period = Math.floor(rfperiod);
    if (period < 8) period = 8;

    square_duty += square_slide;
    if (square_duty < 0.0) square_duty = 0.0;
    if (square_duty > 0.5) square_duty = 0.5;

    // Volume envelope
    env_time++;
    if (env_time > env_length[env_stage]) {
      env_time = 0;
      env_stage++;
      if (env_stage === 3)
        break;
    }
    if (env_stage === 0)
      env_vol = env_time / env_length[0];
    else if (env_stage === 1)
      env_vol = 1.0 + Math.pow(1.0 - env_time / env_length[1],
                               1.0) * 2.0 * ps.p_env_punch;
    else  // env_stage === 2
      env_vol = 1.0 - env_time / env_length[2];

    // Phaser step
    fphase += fdphase;
    iphase = Math.abs(Math.floor(fphase));
    if (iphase > 1023) iphase = 1023;

    if (flthp_d != 0.0) {
      flthp *= flthp_d;
      if (flthp < 0.00001)
        flthp = 0.00001;
      if (flthp > 0.1)
        flthp = 0.1;
    }

    // 8x supersampling
    var sample = 0.0;
    for (var si = 0; si < 8; ++si) {
      var sub_sample = 0.0;
      phase++;
      if (phase >= period) {
        phase %= period;
        if (ps.wave_type === NOISE)
          for(var i = 0; i < 32; ++i)
            noise_buffer[i] = Math.random() * 2.0 - 1.0;
      }

      // Base waveform
      var fp = phase / period;
      ps.wave_type = parseInt(ps.wave_type);
      if (ps.wave_type === SQUARE) {
        if (fp < square_duty)
          sub_sample=0.5;
        else
          sub_sample=-0.5;
      } else if (ps.wave_type === SAWTOOTH) {
        sub_sample = 1.0 - fp * 2;
      } else if (ps.wave_type === SINE) {
        sub_sample = Math.sin(fp * 2 * Math.PI);
      } else if (ps.wave_type === NOISE) {
        sub_sample = noise_buffer[Math.floor(phase * 32 / period)];
      } else {
        throw "ERROR: Bad wave type: " + ps.wave_type;
      }

      // Low-pass filter
      var pp = fltp;
      fltw *= fltw_d;
      if (fltw < 0.0) fltw = 0.0;
      if (fltw > 0.1) fltw = 0.1;
      if (ps.p_lpf_freq != 1.0) {
        fltdp += (sub_sample - fltp) * fltw;
        fltdp -= fltdp * fltdmp;
      } else {
        fltp = sub_sample;
        fltdp = 0.0;
      }
      fltp += fltdp;

      // High-pass filter
      fltphp += fltp - pp;
      fltphp -= fltphp * flthp;
      sub_sample = fltphp;

      // Phaser
      phaser_buffer[ipp & 1023] = sub_sample;
      sub_sample += phaser_buffer[(ipp - iphase + 1024) & 1023];
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
    sample *= gain;

    if (ps.sample_size === 8) {
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
  wave.header.sampleRate = ps.sample_rate;
  wave.header.bitsPerSample = ps.sample_size;
  wave.Make(buffer);
  wave.clipping = num_clipped;
  return wave;
}


// For node.js
if (typeof exports !== 'undefined')  {
  var RIFFWAVE = require("./riffwave").RIFFWAVE;
  exports.Params = Params;
  exports.generate = generate;
}
