(function main() {
  const audioEl = document.getElementById('file');
  const playbackSpeedEl = document.getElementById('playback-speed');
  const playbackSpeedLbl = document.getElementById('playback-speed-lbl');
  const resetPlaybackSpeedEl = document.getElementById('reset-playback-speed');
  const preservePitchEl = document.getElementById('preserve-pitch');

  const updatePlaybackSpeed = () => {
    audioEl.playbackRate = playbackSpeedEl.value;
    playbackSpeedLbl.textContent = `${playbackSpeedEl.value.toFixed(1)}x`;
  };
  const updatePreservePitch = () => {
    audioEl.preservesPitch = preservePitchEl.checked;
  };
  playbackSpeedEl.addEventListener('value-changed', updatePlaybackSpeed);
  resetPlaybackSpeedEl.addEventListener('click', () => {
    playbackSpeedEl.value = 1;
    updatePlaybackSpeed();
  });
  preservePitchEl.addEventListener('input', updatePreservePitch);

  // the browser might have set some defualt values
  updatePlaybackSpeed();
  updatePreservePitch();

  audioEl.addEventListener('error', () => {
    if (audioEl.error && audioEl.error.code === 4) {
      location.href = audioEl.src;
    }
  });
})();
