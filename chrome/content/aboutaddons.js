"use strict";

{
  const ID = "{6c28e999-e900-4635-a39d-b1ec90ba0c0f}";

  // options in dialog window
  function updateShowItemPreferences() {
    const addonCard = window.docShell.chromeEventHandler.contentDocument
      .querySelector(`addon-card[addon-id="${ID}"]`);
    if (addonCard) {
      const optionsButton = addonCard.querySelector(`panel-item[action="preferences"]`).button;
      optionsButton.removeAttribute("action");
      if (!optionsButton._option_command_installed) {
        optionsButton._option_command_installed = true;
        optionsButton.addEventListener("click", event => {
          event.stopPropagation();
          try {
            windowRoot.ownerGlobal.openDialog(addonCard.addon.optionsURL, 'downloadbar-options', 'chrome,centerscreen,toolbar');
          } catch (ex) {
            windowRoot.ownerGlobal.console.log(ex);
          }
        });
      }
    }
  }

  window.addEventListener("load", () => {
    try {
      updateShowItemPreferences();
    } catch (ex) {
      Cu.reportError(ex);
    }
  });

  const targetNode = window.docShell.chromeEventHandler.contentDocument
    .getElementById('content');
  const config = { childList: true, subtree: true };
  const callback = function (mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        if (mutation?.addedNodes[0]?.parentNode?.querySelector(`addon-card[addon-id="${ID}"]`)) try {
          updateShowItemPreferences();
          break;
        } catch (ex) {
          Cu.reportError(ex);
        }
      }
    }
  };
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}