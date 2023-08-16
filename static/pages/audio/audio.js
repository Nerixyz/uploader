// make sure these scripts are loaded before executing
import '/static/controls/audio-control.js';
import '/static/controls/slider-control.js';
import '/static/controls/checkbox-control.js';

function main() {
  const audioEl = document.getElementById('file');

  const volumeEl = document.getElementById('volume');
  const volumeLbl = document.getElementById('volume-lbl');
  const resetVolumeEl = document.getElementById('reset-volume');

  const playbackSpeedEl = document.getElementById('playback-speed');
  const playbackSpeedLbl = document.getElementById('playback-speed-lbl');
  const resetPlaybackSpeedEl = document.getElementById('reset-playback-speed');

  const preservePitchEl = document.getElementById('preserve-pitch');
  const copyURL = document.getElementById('copy-url');
  const download = document.getElementById('download');

  // volume
  const updateVolume = () => {
    audioEl.volume = volumeEl.value;
    volumeLbl.textContent = `${Math.round((volumeEl.value ?? 1) * 100)}%`;
  };
  volumeEl.addEventListener('value-changed', updateVolume);
  resetVolumeEl.addEventListener('click', () => {
    volumeEl.value = 1;
    updateVolume();
  });

  // playback speed
  const updatePlaybackSpeed = () => {
    audioEl.playbackRate = playbackSpeedEl.value;
    playbackSpeedLbl.textContent = `${(playbackSpeedEl.value ?? 1).toFixed(1)}x`;
  };
  playbackSpeedEl.addEventListener('value-changed', updatePlaybackSpeed);
  resetPlaybackSpeedEl.addEventListener('click', () => {
    playbackSpeedEl.value = 1;
    updatePlaybackSpeed();
  });

  // preserve pitch
  const updatePreservePitch = () => {
    audioEl.preservesPitch = preservePitchEl.checked ?? true;
  };
  preservePitchEl.addEventListener('value-changed', updatePreservePitch);

  audioEl.addEventListener('error', () => {
    if (audioEl.error && audioEl.error.code === 4) {
      location.href = audioEl.src;
    }
  });

  download.addEventListener('click', () => downloadUrl(audioEl.getAttribute('src')));

  copyURL.addEventListener('click', () => {
    const url = new URL(location.href);
    url.hash = new URLSearchParams({
      speed: playbackSpeedEl.value.toString(),
      preserve: (preservePitchEl.checked ?? true).toString(),
    }).toString();
    navigator.clipboard
      .writeText(url.toString())
      .then(() =>
        copyURL.animate(
          {
            transform: ['scale(1.05)', 'scale(1)'],
          },
          { duration: 150 },
        ),
      )
      .catch(console.error);
  });

  const updateFromUrl = () => {
    if (location.hash.length > 1) {
      try {
        const params = new URLSearchParams(location.hash.substring(1));
        if (params.has('speed')) {
          playbackSpeedEl.value = Number(params.get('speed'));
          updatePlaybackSpeed();
        }
        if (params.has('preserve')) {
          preservePitchEl.checked = params.get('preserve') !== 'false';
          updatePreservePitch();
        }
      } catch (e) {
        console.warn('cannot parse hash', e);
      }
    }
  };
  addEventListener('hashchange', updateFromUrl);
  updateFromUrl();
}

function downloadUrl(url) {
  const a = document.createElement('a');
  a.download = url;
  a.href = url;
  a.click();
}

if (document.readyState === 'loading') {
  addEventListener('DOMContentLoaded', main);
} else {
  main();
}
