(function main() {
  const audioEl = document.getElementById('file');
  const playbackSpeedEl = document.getElementById('playback-speed');
  const playbackSpeedLbl = document.getElementById('playback-speed-lbl');
  const resetPlaybackSpeedEl = document.getElementById('reset-playback-speed');
  const preservePitchEl = document.getElementById('preserve-pitch');

  const updatePlaybackSpeed = () => {
    audioEl.playbackRate = playbackSpeedEl.value;
    playbackSpeedLbl.textContent = `${(playbackSpeedEl.value ?? 1).toFixed(1)}x`;
  };
  const updatePreservePitch = () => {
    audioEl.preservesPitch = preservePitchEl.checked ?? true;
  };
  playbackSpeedEl.addEventListener('value-changed', updatePlaybackSpeed);
  resetPlaybackSpeedEl.addEventListener('click', () => {
    playbackSpeedEl.value = 1;
    updatePlaybackSpeed();
  });
  preservePitchEl.addEventListener('value-changed', updatePreservePitch);

  audioEl.addEventListener('error', () => {
    if (audioEl.error && audioEl.error.code === 4) {
      location.href = audioEl.src;
    }
  });
})();
