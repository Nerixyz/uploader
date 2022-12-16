const LOCAL_STORAGE_KEY = 'uploader-authorization';

(function main() {
  makeAuthStuff();
  makeUploadStuff();
})();

function makeAuthStuff() {
  const view = document.getElementById('view');
  const saveForm = document.getElementById('set-auth-form');
  const authInput = document.getElementById('auth-input');
  const clearAuth = document.getElementById('clear-auth');

  const updateState = () => {
    if (localStorage.getItem(LOCAL_STORAGE_KEY)) {
      view.classList.add('authenticated');
    } else {
      view.classList.remove('authenticated');
    }
  };
  const setToken = tok => {
    if (tok) {
      localStorage.setItem(LOCAL_STORAGE_KEY, tok);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    updateState();
  };

  saveForm.addEventListener('submit', e => {
    e.preventDefault();
    setToken(authInput.value);
  });
  clearAuth.addEventListener('click', e => {
    e.preventDefault();
    setToken(null);
  });
  updateState();
}

function makeUploadStuff() {
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('upload-file');
  const fileLabelWrap = document.getElementById('file-label');
  const fileText = document.getElementById('filename');
  const fileModeBtn = document.getElementById('file-mode-btn');
  const textModeBtn = document.getElementById('text-mode-btn');
  const view = document.getElementById('view');
  const textInput = document.getElementById('text-input');

  const noFilenameText = fileText.textContent;

  // MODES
  let fileMode = view.classList.contains('file-mode');
  const updateMode = () => {
    if (fileMode) {
      view.classList.add('file-mode');
      view.classList.remove('text-mode');
    } else {
      view.classList.add('text-mode');
      view.classList.remove('file-mode');
    }
  };
  updateMode();

  fileModeBtn.addEventListener('click', () => {
    fileMode = true;
    updateMode();
  });
  textModeBtn.addEventListener('click', () => {
    fileMode = false;
    updateMode();
  });

  // FILE UPLOAD
  /** @type {File | null} */
  let currentFile = null;
  let dragRc = 0;
  let dndDialog = null;
  const clearDialog = () => {
    if (dndDialog) {
      console.trace('xd');
      dndDialog.remove();
      dndDialog = null;
    }
  };

  uploadForm.addEventListener('submit', e => {
    e.preventDefault();
    /** @type {File | Blob | null} */
    let toUpload = null;
    if (fileMode) {
      toUpload = currentFile;
    } else {
      // text mode
      if (textInput.value.length > 0) {
        toUpload = new Blob([textInput.value], { type: 'text/plain' });
      }
    }
    if (toUpload) {
      uploadFile(toUpload).catch(console.error);
    }
  });
  const updateFilename = (fromInput = false) => {
    if (fromInput && fileInput.files?.length) {
      currentFile = fileInput.files[0];
    }

    if (currentFile) {
      fileText.textContent = currentFile.name;
      fileLabelWrap.classList.add('has-file');
    } else {
      fileText.textContent = noFilenameText;
      fileLabelWrap.classList.remove('has-file');
    }
  };
  fileInput.addEventListener('input', () => updateFilename(true));
  updateFilename(true);

  document.body.addEventListener('dragenter', e => {
    e.stopPropagation();
    e.preventDefault();
    dragRc++;
    if (!dndDialog) {
      dndDialog = createOverlay({ title: 'Drop here!' });
    }
  });
  document.body.addEventListener('dragover', e => {
    e.stopPropagation();
    e.preventDefault();
  });
  document.body.addEventListener('drop', e => {
    e.stopPropagation();
    e.preventDefault();
    clearDialog();

    if (e.dataTransfer?.files?.length) {
      currentFile = e.dataTransfer.files[0];
      updateFilename(false);
      fileMode = true;
      updateMode();
    }
  });
  document.body.addEventListener('dragleave', () => {
    dragRc--;
    if (dragRc <= 0) {
      clearDialog();
    }
  });
  document.body.addEventListener('dragend', clearDialog);
}

function createOverlay({ title, content }) {
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');
  document.body.append(overlay);

  const view = document.createElement('div');
  view.classList.add('overlay-view');
  overlay.append(view);

  const titleEl = document.createElement('h1');
  titleEl.textContent = title;
  view.append(titleEl);

  function appendContent(onto, content) {
    if (!content) {
      content = document.createElement('div');
    }
    content.classList.add('overlay-content');
    onto.append(content);

    return content;
  }

  content = appendContent(view, content);

  return {
    overlay,
    view,
    titleEl,
    content,
    update({ title, content }) {
      this.titleEl.textContent = title;
      this.content.remove();
      this.content = appendContent(this.view, content);
    },
    remove() {
      const anim = this.overlay.animate(
        {
          opacity: ['1', '0'],
          'backdrop-filter': ['blur(20px)', 'blur(0)'],
        },
        { duration: 200 },
      );
      anim.addEventListener('finish', () => this.overlay.remove());
      anim.play();
    },
  };
}

function createSuccess({ link, deletionLink }, cb) {
  const wrap = document.createElement('div');
  wrap.classList.add('success');

  const linkInfoEl = document.createElement('div');
  linkInfoEl.classList.add('link-info');

  const linkRow = document.createElement('div');
  linkRow.classList.add('link-row');

  const linkEl = document.createElement('a');
  linkEl.href = link;
  linkEl.textContent = link;
  linkEl.target = '_blank';
  linkRow.append(linkEl);

  const copyButton = document.createElement('button');
  copyButton.classList.add('icon-button');

  copyButton.textContent = 'Copy';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z',
  );
  path.setAttribute('fill', 'currentColor');
  svg.append(path);
  copyButton.append(svg);

  copyButton.addEventListener('click', () => {
    navigator.clipboard
      .writeText(link)
      .then(() =>
        copyButton.animate(
          {
            transform: ['scale(1)', 'scale(1.1)', 'scale(1)'],
          },
          { duration: 150 },
        ),
      )
      .catch(console.error);
  });
  linkRow.append(copyButton);
  linkInfoEl.append(linkRow);

  const copyDeletionButton = document.createElement('button');
  copyDeletionButton.classList.add('icon-button');
  copyDeletionButton.classList.add('no-border');
  copyDeletionButton.textContent = 'Copy Deletion Link';
  copyDeletionButton.append(svg.cloneNode(true));
  copyDeletionButton.addEventListener('click', () => {
    navigator.clipboard
      .writeText(deletionLink)
      .then(() =>
        copyButton.animate(
          {
            transform: ['scale(1)', 'scale(1.1)', 'scale(1)'],
          },
          { duration: 150 },
        ),
      )
      .catch(console.error);
  });
  linkInfoEl.append(copyDeletionButton);

  wrap.append(linkInfoEl);

  const exit = document.createElement('button');
  exit.textContent = 'Ok';
  exit.classList.add('icon-button');
  exit.addEventListener('click', cb);
  requestAnimationFrame(() => copyButton.focus());
  wrap.append(exit);

  return wrap;
}

function createError(text, cb) {
  const wrap = document.createElement('div');
  wrap.classList.add('error');

  const textEl = document.createElement('h4');
  textEl.textContent = text;
  wrap.append(textEl);

  const exit = document.createElement('button');
  exit.textContent = 'Ok';
  exit.classList.add('icon-button');
  exit.addEventListener('click', cb);
  requestAnimationFrame(() => exit.focus());
  wrap.append(exit);

  return wrap;
}

function createUploading() {
  const wrap = document.createElement('div');
  wrap.classList.add('uploading');

  const progress = document.createElement('div');
  progress.classList.add('loader');
  wrap.append(progress);

  const text = document.createElement('p');
  text.textContent = '0%';

  let reportedProgress = false;
  return [
    wrap,
    n => {
      if (!reportedProgress) {
        wrap.append(text);
        progress.classList.remove('loader');
        progress.classList.add('progress');
      }
      n = Math.max(0, Math.min(1, n)) * 100;
      progress.style.setProperty('--progress', `${n}%`);
      text.textContent = `${n.toFixed(0)}%`;
    },
  ];
}

/**
 * @param {File | Blob} file
 * @return {Promise<void>}
 */
async function uploadFile(file) {
  const [content, progressCb] = createUploading();
  const overlay = createOverlay({ title: 'Uploading...', content });
  try {
    const links = await upload(file, progressCb);
    overlay.update({ title: 'Done', content: createSuccess(links, () => overlay.remove()) });
  } catch (e) {
    overlay.update({ title: 'Error', content: createError(e.toString(), () => overlay.remove()) });
  }
}

/**
 *
 * @param {File | Blob} file
 * @param progressCb
 * @return {Promise<{link: string, deletionLink: string}>}
 */
function upload(file, progressCb) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('progress', ({ loaded, total }) => {
      progressCb(loaded / total);
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { link, deletion_link } = JSON.parse(xhr.responseText);
          if (!link || !deletion_link) {
            throw new Error('No links in response');
          }
          resolve({ link, deletionLink: deletion_link });
        } catch (e) {
          reject(e);
        }
      } else {
        reject(tryJsonErrorXhr(xhr));
      }
    });
    xhr.addEventListener('error', () => {
      reject(new Error('Request failed'));
    });
    xhr.addEventListener('abort', () => {
      reject(new Error('Aborted'));
    });
    xhr.open('POST', '/upload');
    xhr.setRequestHeader('Authorization', localStorage.getItem(LOCAL_STORAGE_KEY));
    if (file instanceof File) {
      xhr.setRequestHeader('X-Upload-Filename', file.name);
    }
    xhr.send(file);
  });
}

function tryJsonErrorXhr(xhr) {
  const json = xhr.getResponseHeader('content-type').startsWith('application/json')
    ? JSON.parse(xhr.responseText)
    : xhr.responseText;
  return new Error(
    `${xhr.status} ${xhr.statusText} - ${
      typeof json === 'string' ? json : json?.message ?? json?.error ?? JSON.stringify(json)
    }`,
  );
}
