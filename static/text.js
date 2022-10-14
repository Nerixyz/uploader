function getFilename() {
  const idx = location.pathname.lastIndexOf('/');
  if (idx === -1) {
    return null;
  }
  return location.pathname.substring(idx);
}

(async function main() {
  // starts with '/'
  const file = getFilename();
  const notFound = () => {
    location.href = location.origin + '/static/404.html';
  };
  if (!file || file.length < 2) {
    notFound();
    return;
  }
  const res = await fetch(file);
  if (!res.ok) {
    notFound();
    return;
  }
  const text = await res.text();
  const textView = document.getElementById('text-view');
  textView.textContent = text;

  const copyBtn = document.getElementById('copy');
  const downloadBtn = document.getElementById('download');

  copyBtn.addEventListener('click', () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        copyBtn.animate(
          {
            transform: ['scale(1)', 'scale(1.1)', 'scale(1)'],
          },
          { duration: 150 },
        );
      })
      .catch(console.error);
  });

  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text]));
    a.download = file.substring(1);
    a.click();
  });
  document.getElementById('view').classList.remove('loading');
})();
