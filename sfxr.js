
var SQUARE = "square";
var SAWTOOTH = "sawtooth";
var SINE = "sine";
var NOISE = "noise";

var ps = {
  p_base_freq: 0,
  p_freq_limit: 0,
  p_freq_ramp: 0,
  p_freq_dramp: 0,
  p_duty: 0,
  p_duty_ramp: 0,
  p_arp_mod: 0,
  p_arp_speed: 0,
  p_lpf_freq: 0,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  p_vib_speed: 0,
  p_vib_strength: 0,
  p_env_attack: 0,
  p_env_sustain: 0,
  p_env_decay: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_repeat_speed: 0,
  p_env_punch: 0,
  p_wave_type: SQUARE,
};

var masterVolume = 1.0;


var generate = function (ps) {
  var fperiod, period, fmaxperiod;
  var fslide, fdslide;
  var square_duty, square_slide;
  var arp_mod, arp_time, arp_limit;;

  var restart = function () {
    // restart for looping

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
    if (ps.p_arp_speed == 1.0)
      arp_limit = 0;
  };

  restart();

  // Filter
  var fltp = 0.0;
  var fltdp = 0.0;
  var fltw = Math.pow(ps.p_lpf_freq, 3.0) * 0.1;
  var fltw_d = 1.0 + ps.p_lpf_ramp * 0.0001;
  var fltdmp = 5.0 / (1.0 + Math.pow(ps.p_lpf_resonance, 2.0) * 20.0) * (0.01 + fltw);
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
  var rep_time = 0;
  var rep_limit = Math.floor(Math.pow(1.0 - ps.p_repeat_speed, 2.0) * 20000 + 32);
  if (ps.p_repeat_speed == 0.0)
    rep_limit=0;


  // ...end of initialization


  var buffer = [];

  for(var t = 0; ; ++t) {

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
      rfperiod = fperiod * (1.0 + sin(vib_phase) * vib_amp);
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
      if (env_stage == 3)
        break;
    }
    if (env_stage == 0)
      env_vol = env_time / env_length[0];
    if (env_stage == 1)
      env_vol = 1.0 + Math.pow(1.0 - env_time / env_length[1], 1.0) * 2.0 * ps.p_env_punch;
    if (env_stage == 2)
      env_vol = 1.0 - env_time / env_length[2];

    // Phaser step
    fphase += fdphase;
    iphase = Math.abs(Math.floor(fphase));
    if (iphase > 1023) iphase = 1023;

    if (flthp_d != 0.0) {
      flthp *= flthp_d;
      if (flthp < 0.00001)
        flthp = 0.00001;
      if (flthp>0.1)
        flthp = 0.1;
    }

    // 8x supersampling
    var sample = 0.0;
    for (var si = 0; si < 8; ++si) {
      var sub_sample = 0.0;
      phase++;
      if (phase >= period) {
        phase %= period;
        if (ps.wave_type == 3)
          for(var i = 0; i < 32; ++i)
            noise_buffer[i] = Math.random() * 2.0 - 1.0;
      }
      // base waveform
      var fp = phase / period;
      if (ps.wave_type == SQUARE) {
        if (fp < square_duty)
          sub_sample=0.5;
        else
          sub_sample=-0.5;
      } else if (ps.wave_type == SAWTOOTH) {
        sub_sample = 1.0 - fp * 2;
      } else if (ps.wave_type == SINE) {
        sub_sample = Math.sin(fp * 2 * Math.PI);
      } else if (ps.wave_type == NOISE) {
        sub_sample = noise_buffer[phase*32 / period];
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
    sample = sample / 8 * masterVolume;

    sample *= 2.0 * ps.sound_vol;

    if (sample > 1.0) sample = 1.0;
    if (sample < -1.0) sample = -1.0;
    buffer.push(sample);

    /*
    if (file != NULL) {
      // quantize depending on format
      // accumulate/count to accomodate variable sample rate?
      sample *= 4.0;  // arbitrary gain to get reasonable output volume...
      // Clip
      if(sample > 1.0) sample = 1.0;
      if(sample < -1.0) sample = -1.0;
      filesample += sample;
      fileacc++;
      if(ps.wav_freq==44100 || fileacc==2) {
        filesample /= fileacc;
        fileacc = 0;
        if (ps.wav_bits == 16) {
          var isample = Math.floor(filesample * 32000);
          fwrite(&isample, 1, 2, file);
        }

        {
          unsigned char isample=(unsigned char)(filesample*127+128);
          fwrite(&isample, 1, 1, file);
        }
        filesample = 0.0;
      }
      ++file_sampleswritten;
    }
     */
  }

  return new RIFFWAVE(buffer);
};

if (typeof require != "undefined")
  var RIFFWAVE = require("./riffwave.js").RIFFWAVE;

var sound = generate(ps);

if (typeof require != "undefined") {
  require("fs").writeFile("./test.wav", sound.wav, function(err) {
    var sys = require("sys");
    if(err) {
      sys.puts(err);
    } else {
      sys.puts("The file was saved!");
    }
  });
}
