const AUTO_HIGHLIGHT_KEY = 'uploader-autohighlight';

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
  const view = document.getElementById('view');
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
  view.classList.remove('loading');

  document.getElementById('highlight-btn').addEventListener('click', () => {
    highlightText({ textView, view });
  });

  const autoHighlightOpt = document.getElementById('auto-highlight');
  autoHighlightOpt.addEventListener('input', () => {
    localStorage.setItem(AUTO_HIGHLIGHT_KEY, autoHighlightOpt.checked.toString());
  });

  if (localStorage.getItem(AUTO_HIGHLIGHT_KEY) === 'true') {
    autoHighlightOpt.checked = true;
    highlightText({ textView, view });
  }
})();

async function highlightText({ textView, view }) {
  const STYLESHEET_URL = '/static/lib/hljs-github-dark.min.css';
  try {
    view.classList.add('highlighting');

    {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = STYLESHEET_URL;
      document.head.append(link);
    }

    const { default: hljs } = await import('/static/lib/highlight.min.js');
    hljs.highlightElement(textView);

    view.classList.add('highlighted');
  } catch (e) {
    console.warn('Failed to highlight text', e);
  } finally {
    view.classList.remove('highlighting');
  }
}
