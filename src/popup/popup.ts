import { MESSAGE_TYPES } from '../core/ports/message-port';
import { extensionClient } from '../composition/extension-client';

const enabledInput = document.querySelector<HTMLInputElement>('#enabled');
const status = document.querySelector<HTMLParagraphElement>('#status');

if (!enabledInput || !status) {
  throw new Error('Popup markup is missing the required controls.');
}

const statusElement = status;

function showError(): void {
  statusElement.textContent = 'Could not reach the background context.';
  statusElement.classList.add('error');
}

void extensionClient
  .send({ type: MESSAGE_TYPES.getStatus })
  .then((response) => {
    if (response && 'enabled' in response) {
      enabledInput.checked = response.enabled;
    }
  })
  .catch(showError);

enabledInput.addEventListener('change', () => {
  void extensionClient
    .send({ type: MESSAGE_TYPES.setStatus, enabled: enabledInput.checked })
    .then(() => {
      statusElement.textContent = 'Saved';
      window.setTimeout(() => {
        statusElement.textContent = '';
      }, 1500);
    })
    .catch(showError);
});
