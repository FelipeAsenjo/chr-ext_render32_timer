import { MESSAGE_TYPES } from '../core/ports/message-port';
import { extensionClient } from '../composition/extension-client';

const enabledInput = document.querySelector<HTMLInputElement>('#enabled');
const status = document.querySelector<HTMLParagraphElement>('#status');

if (!enabledInput || !status) {
  throw new Error('Options markup is missing the required controls.');
}

void extensionClient
  .send({ type: MESSAGE_TYPES.getStatus })
  .then((response) => {
    if (response && 'enabled' in response) {
      enabledInput.checked = response.enabled;
    }
  })
  .catch(() => {
    status.textContent = 'Could not load settings.';
  });

enabledInput.addEventListener('change', () => {
  void extensionClient
    .send({ type: MESSAGE_TYPES.setStatus, enabled: enabledInput.checked })
    .then(() => {
      status.textContent = 'Saved.';
    })
    .catch(() => {
      status.textContent = 'Could not save settings.';
    });
});
