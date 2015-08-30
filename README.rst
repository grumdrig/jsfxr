jsfxr
=====

Quick 'n' easy game sound effects generator.

A port of sfxr: http://www.drpetter.se/project_sfxr.html to HTML5.

.. image:: screenshot.png

use
===

You can use the sounds you make with sfxr in your game code.

Once you find a nice sound, click the Serialize button and copy the JSON code for the sound::

        var sound = {
          "oldParams": true,
          "wave_type": 1,
          "p_env_attack": 0,
          "p_env_sustain": 0.31718502829007483,
          "p_env_punch": 0,
          "p_env_decay": 0.2718540993592685,
          "p_base_freq": 0.26126191208337196,
          "p_freq_limit": 0,
          "p_freq_ramp": 0.43787689856926615,
          "p_freq_dramp": 0,
          "p_vib_strength": 0,
          "p_vib_speed": 0,
          "p_arp_mod": 0,
          "p_arp_speed": 0,
          "p_duty": 1,
          "p_duty_ramp": 0,
          "p_repeat_speed": 0.7558565452384385,
          "p_pha_offset": 0,
          "p_pha_ramp": 0,
          "p_lpf_freq": 1,
          "p_lpf_ramp": 0,
          "p_lpf_resonance": 0,
          "p_hpf_freq": 0,
          "p_hpf_ramp": 0,
          "sound_vol": 0.25,
          "sample_rate": 44100,
          "sample_size": 8
        };
        
        var a = new Audio();
        var s = new SoundEffect(sound);
        // returns a webaudio object if supported, or an Audio object
        s.getAudio.play();

You can also access an array of samples if you want to use the WebAudio API to play the sound::

        console.log(s.buffer)

There is example code for using the WebAudio API on lines 55_ and 81_ of the index.html_ file.

.. _55: https://github.com/chr15m/jsfxr/blob/master/index.html#L55
.. _81: https://github.com/chr15m/jsfxr/blob/master/index.html#L81
.. _index.html: https://github.com/chr15m/jsfxr/blob/master/index.html

Links
-----

Application:  http://github.grumdrig.com/jsfxr/

Source code:  https://github.com/grumdrig/jsfxr/


Thanks
------

 riffwave.js: http://www.codebase.es/riffwave/

 jquery-ui:   http://jqueryui.com/
