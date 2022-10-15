(function main() {
  const view = document.getElementById('view');
  const btnNo = document.getElementById('btn-no');
  const btnYes = document.getElementById('btn-yes');
  const errorMessageEl = document.getElementById('error-message');

  btnNo.addEventListener('click', () => window.close());

  const clearView = () => {
    view.classList.remove('stage-prompt');
    view.classList.remove('stage-loading');
    view.classList.remove('stage-error');
    view.classList.remove('stage-deleted');
  };

  btnYes.addEventListener('click', async () => {
    const toError = message => {
      errorMessageEl.textContent = message;
      clearView();
      view.classList.add('stage-error');
    };

    clearView();
    view.classList.add('stage-loading');

    try {
      const res = await fetch(location.href, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        toError(`${res.status} - ${json?.error ?? json?.message ?? JSON.stringify(json)}`);
        return;
      }
      clearView();
      view.classList.add('stage-deleted');
    } catch (e) {
      toError(e?.message ?? e);
    }
  });
})();
