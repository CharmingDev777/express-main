/*
* This is an unminified version of the giftcard.min.js file used by your theme.
* If you want to use this file, you will need to change the script reference in your theme
* Change <script src="{{ 'giftcard.min.js' | asset_url }}"> to:
* <script src="{{ 'giftcard.js' | asset_url }}">
*/
(function () {
window.addEventListener('DOMContentLoaded', function () {
  const qrCode = document.querySelector('[data-qr-code]');

  // eslint-disable-next-line no-new
  new QRCode(qrCode, {
    text: qrCode.dataset.identifier,
    width: 120,
    height: 120,
    imageAltText: theme.strings.qrImageAlt,
  });

  document
    .querySelector('[data-gift-card-code]')
    .addEventListener('focus', (event) => {
      event.target.select();
    });
});

}());
