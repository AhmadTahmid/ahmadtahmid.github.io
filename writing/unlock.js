(() => {
  const payload = JSON.parse(document.querySelector('#sealed').textContent);
  const form = document.querySelector('#unlock-form');
  const input = document.querySelector('#passphrase');
  const message = document.querySelector('#message');
  const bytes = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
  async function unlock(passphrase) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(payload.salt), iterations: 310000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(payload.iv) }, key, bytes(payload.data));
    return JSON.parse(new TextDecoder().decode(clear));
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = 'Listening…';
    form.querySelector('button').disabled = true;
    try {
      const essay = await unlock(input.value);
      document.querySelector('#essay-title').innerHTML = essay.title;
      document.querySelector('#essay-body').innerHTML = essay.body;
      document.title = document.querySelector('#essay-title').textContent + ' - Ahmad Tahmid';
      document.querySelector('#gate').hidden = true;
      document.querySelector('#essay').hidden = false;
      input.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      message.textContent = 'The page stays quiet.';
      input.select();
    } finally { form.querySelector('button').disabled = false; }
  });
})();
