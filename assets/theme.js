/*
* This is an unminified version of the theme.min.js file used by your theme.
* If you want to use this file, you will need to change the script reference in your theme
* Change <script src="{{ 'theme.min.js' | asset_url }}"> to:
* <script src="{{ 'theme.js' | asset_url }}">
*/
(function (sections,_shopify_themeA11y) {
sections = 'default' in sections ? sections['default'] : sections;

const keyCodes = {
  TAB: 'tab',
  ENTER: 'enter',
  ESC: 'escape',
  SPACE: ' ',
  END: 'end',
  HOME: 'home',
  LEFT: 'arrowleft',
  UP: 'arrowup',
  RIGHT: 'arrowright',
  DOWN: 'arrowdown',
};

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    // eslint-disable-next-line babel/no-invalid-this
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* eslint-disable babel/no-invalid-this */
function promiseStylesheet(stylesheet) {
  const stylesheetUrl = stylesheet || theme.stylesheet;

  if (typeof this.stylesheetPromise === 'undefined') {
    this.stylesheetPromise = new Promise((resolve) => {
      const link = document.querySelector(`link[href="${stylesheetUrl}"]`);

      if (link.loaded) {
        resolve();
      }

      window.onloadCSS(link, function () {
        // Global onloadCSS function injected by load-css.liquid
        resolve();
      });
    });
  }

  return this.stylesheetPromise;
}
/* eslint-enable babel/no-invalid-this */

function promiseTransitionEnd(element) {
  const events = [
    'webkitTransitionEnd',
    'otransitionend',
    'oTransitionEnd',
    'msTransitionEnd',
    'transitionend',
  ];

  const properties = [
    'WebkitTransition',
    'MozTransition',
    'OTransition',
    'msTransition',
    'transition',
  ];

  let duration = 0;
  let promise = Promise.resolve();

  properties.forEach(() => {
    /* eslint-disable-next-line */
    duration ||
      (duration = parseFloat(
        window.getComputedStyle(element).transitionDuration
      ));
  });

  if (duration > 0) {
    promise = new Promise((resolve) => {
      const handlers = events.map((event) => {
        element.addEventListener(event, handler);
        return {
          event,
          handler,
        };
      });

      function handler(event) {
        if (event.target !== element) return;

        // eslint-disable-next-line no-shadow
        handlers.forEach(({ event, handler }) => {
          element.removeEventListener(event, handler);
        });

        resolve();
      }
    });
  }

  return promise;
}

function cookiesEnabled() {
  let cookieEnabled = window.navigator.cookieEnabled;

  if (!cookieEnabled) {
    document.cookie = 'testcookie';
    cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
  }
  return cookieEnabled;
}

function resizeSelectInput(selectInput) {
  const arrowWidth = 50;

  const test = document.createElement('span');
  test.innerHTML = selectInput.selectedOptions[0].label;

  document.querySelector('.footer').appendChild(test);

  const width = test.offsetWidth;
  test.remove();

  selectInput.style.width = `${width + arrowWidth}px`;
}

function isIntersectionObserverAvailable() {
  if (
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype
  ) {
    return true;
  }
  return false;
}

function getMediaQueryString(width, limit = 'min') {
  const mediaQueries = {
    medium: '46.85em',
    large: '61.85em',
    widescreen: '87.5em',
  };

  return `(${limit}-width: ${mediaQueries[width]})`;
}

const selectors = {
  stage: 'data-popup-stage',
  popup: 'data-popup',
  open: 'data-popup-open',
  close: 'data-popup-close',
  focus: 'data-popup-focus',
};

const classes = {
  open: 'is-open',
  transitionReady: 'transition-ready',
  preventScrolling: 'prevent-scrolling',
};

class Popup {
  constructor(popup) {
    this.name = popup;
  }

  init() {
    this.elements = this._getElements();
    this._bindEvents();
    this.keyUpHandler = this._onKeyUp.bind(this);
    this.scrollPosition = window.pageYOffset;
  }

  openPopup(event) {
    if (event.preventDefault) event.preventDefault();
    this._prepareAnimation();
    this.elements.stage.classList.add(classes.open);
    this._sleepAnimation();

    if (this.elements.focus) {
      _shopify_themeA11y.trapFocus(this.elements.popup, { elementToFocus: this.elements.focus });
    } else {
      _shopify_themeA11y.trapFocus(this.elements.popup);
    }

    this.elements.triggerNode = event.currentTarget;
    this.elements.triggerNode.setAttribute('aria-expanded', true);
    this._enableScrollLock();

    document.addEventListener('keyup', this.keyUpHandler);
  }

  closePopup(removeFocus = true) {
    this._prepareAnimation();
    this.elements.stage.classList.remove(classes.open);
    this._sleepAnimation();

    if (removeFocus) {
      _shopify_themeA11y.removeTrapFocus();
      this.elements.triggerNode.focus();
      document.removeEventListener('keyup', this.keyUpHandler);
    }

    this.elements.triggerNode.setAttribute('aria-expanded', false);
    this._disableScrollLock();

    this.elements.triggerNode.dispatchEvent(
      new window.CustomEvent('popup_closed')
    );
  }

  getElements() {
    return this.elements;
  }

  resetContainerFocus() {
    _shopify_themeA11y.removeTrapFocus();

    if (this.elements.focus) {
      _shopify_themeA11y.trapFocus(this.elements.popup, { elementToFocus: this.elements.focus });
    } else {
      _shopify_themeA11y.trapFocus(this.elements.popup);
    }
  }

  _prepareAnimation() {
    this.elements.stage.classList.add(classes.transitionReady);
  }

  _sleepAnimation() {
    return promiseTransitionEnd(this.elements.popup).then(() => {
      this.elements.stage.classList.remove(classes.transitionReady);
    });
  }

  _getElements() {
    return {
      stage: document.querySelector(`[${selectors.stage}=${this.name}]`),
      popup: document.querySelector(`[${selectors.popup}=${this.name}]`),
      open: document.querySelectorAll(`[${selectors.open}=${this.name}]`),
      close: document.querySelectorAll(`[${selectors.close}=${this.name}]`),
      focus: document.querySelector(`[${selectors.focus}=${this.name}]`),
    };
  }

  _bindEvents() {
    this.elements.open.forEach((openButton) => {
      openButton.addEventListener('click', (event) => this.openPopup(event));
    });

    this.elements.close.forEach((closeButton) => {
      closeButton.addEventListener('click', () => this.closePopup());
    });
  }

  _enableScrollLock() {
    this.scrollPosition = window.pageYOffset;
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.classList.add(classes.preventScrolling);
  }

  _disableScrollLock() {
    document.body.classList.remove(classes.preventScrolling);
    document.body.style.removeProperty('top');
    window.scrollTo(0, this.scrollPosition);
  }

  _onKeyUp(event) {
    if (event.key.toLowerCase() === keyCodes.ESC) this.closePopup();
  }
}

function getDefaultRequestConfig() {
  return JSON.parse(
    JSON.stringify({
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json;'
      }
    })
  );
}

function fetchJSON(url, config) {
  return fetch(url, config).then(function(response) {
    if (!response.ok) {
      throw response;
    }
    return response.json();
  });
}

function cart() {
  return fetchJSON('/cart.js', getDefaultRequestConfig());
}



function cartAddFromForm(formData) {
  var config = getDefaultRequestConfig();
  delete config.headers['Content-Type'];

  config.method = 'POST';
  config.body = formData;

  return fetchJSON('/cart/add.js', config);
}

function cartChange(line, options) {
  var config = getDefaultRequestConfig();

  options = options || {};

  config.method = 'POST';
  config.body = JSON.stringify({
    line: line,
    quantity: options.quantity,
    properties: options.properties
  });

  return fetchJSON('/cart/change.js', config);
}



function cartUpdate(body) {
  var config = getDefaultRequestConfig();

  config.method = 'POST';
  config.body = JSON.stringify(body);

  return fetchJSON('/cart/update.js', config);
}

function key(key) {
  if (typeof key !== 'string' || key.split(':').length !== 2) {
    throw new TypeError(
      'Theme Cart: Provided key value is not a string with the format xxx:xxx'
    );
  }
}

function quantity(quantity) {
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    throw new TypeError(
      'Theme Cart: An object which specifies a quantity or properties value is required'
    );
  }
}

function id(id) {
  if (typeof id !== 'number' || isNaN(id)) {
    throw new TypeError('Theme Cart: Variant ID must be a number');
  }
}

function properties(properties) {
  if (typeof properties !== 'object') {
    throw new TypeError('Theme Cart: Properties must be an object');
  }
}

function form(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw new TypeError('Theme Cart: Form must be an instance of HTMLFormElement');
  }
}

function options(options) {
  if (typeof options !== 'object') {
    throw new TypeError('Theme Cart: Options must be an object');
  }

  if (
    typeof options.quantity === 'undefined' &&
    typeof options.properties === 'undefined'
  ) {
    throw new Error(
      'Theme Cart: You muse define a value for quantity or properties'
    );
  }

  if (typeof options.quantity !== 'undefined') {
    quantity(options.quantity);
  }

  if (typeof options.properties !== 'undefined') {
    properties(options.properties);
  }
}

/**
 * Cart Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Cart template.
 *
 * @namespace cart
 */

/**
 * Returns the state object of the cart
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */
function getState() {
  return cart();
}

/**
 * Returns the index of the cart line item
 * @param {string} key The unique key of the line item
 * @returns {Promise} Resolves with the index number of the line item
 */
function getItemIndex(key$$1) {
  key(key$$1);

  return cart().then(function(state) {
    var index = -1;

    state.items.forEach(function(item, i) {
      index = item.key === key$$1 ? i + 1 : index;
    });

    if (index === -1) {
      return Promise.reject(
        new Error('Theme Cart: Unable to match line item with provided key')
      );
    }

    return index;
  });
}

/**
 * Fetches the line item object
 * @param {string} key The unique key of the line item
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */


/**
 * Add a new line item to the cart
 * @param {number} id The variant's unique ID
 * @param {object} options Optional values to pass to /cart/add.js
 * @param {number} options.quantity The quantity of items to be added to the cart
 * @param {object} options.properties Line item property key/values (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-properties)
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */


/**
 * Add a new line item to the cart from a product form
 * @param {object} form DOM element which is equal to the <form> node
 * @returns {Promise} Resolves with the line item object (See response of cart/add.js https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#add-to-cart)
 */
function addItemFromForm(form$$1) {
  form(form$$1);

  var formData = new FormData(form$$1);
  id(parseInt(formData.get('id'), 10));

  return cartAddFromForm(formData);
}

/**
 * Changes the quantity and/or properties of an existing line item.
 * @param {string} key The unique key of the line item (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-key)
 * @param {object} options Optional values to pass to /cart/add.js
 * @param {number} options.quantity The quantity of items to be added to the cart
 * @param {object} options.properties Line item property key/values (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-properties)
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */
function updateItem(key$$1, options$$1) {
  key(key$$1);
  options(options$$1);

  return getItemIndex(key$$1).then(function(line) {
    return cartChange(line, options$$1);
  });
}

/**
 * Removes a line item from the cart
 * @param {string} key The unique key of the line item (https://help.shopify.com/en/themes/liquid/objects/line_item#line_item-key)
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */


/**
 * Sets all quantities of all line items in the cart to zero. This does not remove cart attributes nor the cart note.
 * @returns {Promise} Resolves with the state object of the cart (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-cart)
 */


/**
 * Gets all cart attributes
 * @returns {Promise} Resolves with the cart attributes object
 */


/**
 * Sets all cart attributes
 * @returns {Promise} Resolves with the cart state object
 */


/**
 * Clears all cart attributes
 * @returns {Promise} Resolves with the cart state object
 */


/**
 * Gets cart note
 * @returns {Promise} Resolves with the cart note string
 */


/**
 * Sets cart note
 * @returns {Promise} Resolves with the cart state object
 */
function updateNote(note) {
  return cartUpdate({ note: note });
}

/**
 * Clears cart note
 * @returns {Promise} Resolves with the cart state object
 */
function clearNote() {
  return cartUpdate({ note: '' });
}

/**
 * Get estimated shipping rates.
 * @returns {Promise} Resolves with response of /cart/shipping_rates.json (https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#get-shipping-rates)
 */

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var currency_cjs = createCommonjsModule(function (module, exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatMoney = formatMoney;
/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 */

var moneyFormat = '${{amount}}';

/**
 * Format money values based on your shop currency settings
 * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
 * or 3.00 dollars
 * @param  {String} format - shop money_format setting
 * @return {String} value - formatted value
 */
function formatMoney(cents, format) {
  if (typeof cents === 'string') {
    cents = cents.replace('.', '');
  }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || moneyFormat;

  function formatWithDelimiters(number) {
    var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
    var thousands = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ',';
    var decimal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '.';

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.');
    var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    var centsAmount = parts[1] ? decimal + parts[1] : '';

    return dollarsAmount + centsAmount;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}
});

var formatMoney = currency_cjs.formatMoney;

const selectors$1 = {
  cartItemsWrapper: '[data-cart-items]',
  cartItem: 'data-cart-item',
  quantityInput: '[data-cart-item-quantity]',
  remove: '[data-remove]',
  cartCountBubble: '[data-cart-count-bubble]',
  cartCount: '[data-cart-count]',
  cartNote: '[data-cart-note]',
  cartPrice: '[data-cart-price]',
  priceLiveRegion: '[data-price-live-region]',
  checkoutButton: '[data-checkout-button]',
  cartItemError: '[data-cart-item-error]',
  closeButton: '[data-cart-close]',
  emptyText: '[data-cart-empty-text]',
  discounts: '[data-discounts]',
};

const classes$1 = {
  hidden: 'hidden',
  isEmpty: 'is-empty',
  cookiesDisabled: 'cookies-disabled',
  hasError: 'has-error',
};

class Cart {
  constructor(cartElement) {
    this.elements = {
      cart: cartElement,
    };
  }

  init() {
    if (!cookiesEnabled()) {
      this.elements.cart.classList.add(classes$1.cookiesDisabled);
      return;
    }

    Object.assign(
      this.elements,
      this.getCartElements(),
      this.getItemElements()
    );

    this.bindContextOfThis();

    this.debouncedOnCartItemInput = debounce((event, lineItem) => {
      this.onCartItemInput(event, lineItem);
    }, 300);

    this.addCartEvents();
    this.addItemEvents();
  }

  bindContextOfThis() {
    this.onCartItemInput = this.onCartItemInput.bind(this);
    this.onCartItemClick = this.onCartItemClick.bind(this);
    this.updateCartNote = this.updateCartNote.bind(this);
  }

  getItemElements() {
    return {
      cartItems: this.elements.cart.querySelectorAll(`[${selectors$1.cartItem}]`),
    };
  }

  getCartElements() {
    return {
      cartNote: this.elements.cart.querySelector(selectors$1.cartNote),
    };
  }

  addItemEvents() {
    this.elements.cartItems.forEach((cartItem) => {
      cartItem.addEventListener('change', (event) => {
        this.debouncedOnCartItemInput(event, event.currentTarget);
      });
      cartItem.addEventListener('click', this.onCartItemClick);
    });
  }

  addCartEvents() {
    if (this.elements.cartNote) {
      this.elements.cartNote.addEventListener('input', this.updateCartNote);
    }
  }

  onCartItemInput(event, lineItem) {
    event.preventDefault();
    const quantityInput = lineItem.querySelector(selectors$1.quantityInput);

    if (event.target === quantityInput) {
      return this.updateQuantity(event, lineItem);
    }

    return false;
  }

  onCartItemClick(event) {
    const remove = event.currentTarget.querySelector(selectors$1.remove);

    if (event.target === remove) {
      event.preventDefault();
      event.target.disabled = true;
      this.removeItem(event);
    }
  }

  updateQuantity(event, lineItem) {
    const key = lineItem.dataset.cartItem;
    const productId = lineItem.dataset.cartItemProductId;
    const [variantId] = key.split(':');
    const quantityInput = event.target;
    const quantityInputValue = quantityInput.value || 1;

    const newQuantity = parseInt(quantityInputValue, 10);
    this.removeLineItemError(lineItem);

    return updateItem(key, { quantity: newQuantity })
      .then((state) => {
        this.renderCart(state, productId);
        theme.cartQuantity.updateQuantityInputElements(key, newQuantity);

        if (!state.item_count) {
          this.renderEmptyCart();
          return false;
        }

        return this.renderCartItems(state);
      })
      .then((state) => {
        if (!state) return;

        const updatedItem = state.items.find((item) => item.key === key);

        const totalQuantity = state.items.reduce((total, currentItem) => {
          return currentItem.id === Number(variantId)
            ? total + currentItem.quantity
            : total;
        }, 0);

        const currentLineItem = this.elements.cart.querySelector(
          `[${selectors$1.cartItem}="${key}"]`
        );

        if (currentLineItem) {
          currentLineItem.querySelector(selectors$1.quantityInput).focus();
        }

        if (newQuantity <= totalQuantity) return;

        const lineItemError = currentLineItem.querySelector(
          selectors$1.cartItemError
        );

        this.updateLineItemError(lineItemError, updatedItem);
      });
  }

  updateCartNote() {
    const note = this.elements.cartNote.value;

    if (note) {
      updateNote(note);
      return;
    }

    clearNote();
  }

  removeItem(event) {
    const lineItem = event.currentTarget;
    const key = lineItem.dataset.cartItem;
    const productId = lineItem.dataset.cartItemProductId;

    return updateItem(key, { quantity: 0 }).then((state) => {
      this.renderCart(state, productId);
      theme.cartQuantity.updateQuantityInputElements(key, 0);

      if (!state.item_count) {
        this.renderEmptyCart();
        return;
      }

      this.renderCartItems();

      this.elements.closeButton =
        this.elements.closeButton ||
        this.elements.cart.querySelector(selectors$1.closeButton);

      this.elements.closeButton.focus();
    });
  }

  updateLineItemError(lineItemError, item) {
    let errorMessage = theme.strings.quantityError;

    errorMessage = errorMessage
      .replace('[quantity]', item.quantity)
      .replace('[title]', item.title);

    lineItemError.innerHTML = errorMessage;
    lineItemError.classList.add(classes$1.hasError);
  }

  removeLineItemError(lineItem) {
    const lineItemError = lineItem.querySelector(selectors$1.cartItemError);
    lineItemError.classList.remove(classes$1.hasError);
    lineItemError.textContent = '';
  }

  changeCheckoutButtonState(shouldDisable) {
    this.elements.checkoutButton =
      this.elements.checkoutButton ||
      this.elements.cart.querySelector(selectors$1.checkoutButton);

    this.elements.checkoutButton.disabled = shouldDisable;
  }

  onCartUpdated(updatedItem) {
    this.renderCartItems();

    return getState().then((state) => {
      this.renderCart(state, updatedItem);
    });
  }

  renderCartItems(state) {
    return fetch(`${theme.rootUrl}?section_id=cart-items`)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        this.elements.cartItemsWrapper =
          this.elements.cartItemsWrapper ||
          this.elements.cart.querySelector(selectors$1.cartItemsWrapper);

        this.elements.cartItemsWrapper.innerHTML = html;
        Object.assign(this.elements, this.getItemElements());
        this.addItemEvents();
        return state;
      });
  }

  renderCart(state, updatedItem) {
    this.renderSubtotalPrice(state.total_price);
    this.renderCartCountBubble(state.item_count);
    this.renderPriceLiveRegion(state);
    this.renderCartLevelDiscounts();
    theme.cartQuantity.updateLocalCartState(state, updatedItem);

    if (state.item_count) {
      this.elements.cart.classList.remove(classes$1.isEmpty);
      this.changeCheckoutButtonState(false);
    }
  }

  renderEmptyCart() {
    this.elements.cart.classList.add(classes$1.isEmpty);
    this.changeCheckoutButtonState(true);

    this.elements.cartEmptyText =
      this.elements.cartEmptyText ||
      this.elements.cart.querySelector(selectors$1.emptyText);

    this.elements.cartEmptyText.setAttribute('tabindex', '-1');
    this.elements.cartEmptyText.focus();
  }

  renderCartLevelDiscounts() {
    return fetch(`${theme.rootUrl}?section_id=cart-discounts`)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        this.elements.discounts =
          this.elements.discounts ||
          this.elements.cart.querySelector(selectors$1.discounts);

        this.elements.discounts.innerHTML = html;
      });
  }

  renderSubtotalPrice(subtotal) {
    const formattedCartPrice = formatMoney(subtotal, theme.moneyFormat);

    this.elements.cartPrice =
      this.elements.cartPrice ||
      document.body.querySelectorAll(selectors$1.cartPrice);

    this.elements.cartPrice.forEach((cartPrice) => {
      cartPrice.innerHTML = formattedCartPrice;
    });
  }

  renderCartCountBubble(itemCount) {
    const cartCountBubbles = document.querySelectorAll(
      selectors$1.cartCountBubble
    );
    const cartCounts = document.querySelectorAll(selectors$1.cartCount);

    cartCounts.forEach(
      (cartCount) => (cartCount.innerText = itemCount > 99 ? '99+' : itemCount)
    );
    cartCountBubbles.forEach((countBubble) =>
      countBubble.classList.toggle(classes$1.hidden, itemCount === 0)
    );
  }

  renderPriceLiveRegion(state) {
    const subtotal = state.total_price;

    this.elements.priceLiveRegion =
      this.elements.priceLiveRegion ||
      this.elements.cart.querySelector(selectors$1.priceLiveRegion);

    const priceLiveRegionText = this.formatPriceLiveRegionText(subtotal);

    this.elements.priceLiveRegion.textContent = priceLiveRegionText;
    this.elements.priceLiveRegion.setAttribute('aria-hidden', false);

    window.setTimeout(() => {
      this.elements.priceLiveRegion.setAttribute('aria-hidden', true);
    }, 1000);
  }

  formatPriceLiveRegionText(subtotal) {
    const formattedSubtotal = formatMoney(subtotal, theme.moneyFormat);
    return `${theme.strings.subtotal}: ${formattedSubtotal}`;
  }

  getItemFromState(key, state) {
    return state.items.find((item) => item.key === key);
  }
}

const selectors$2 = {
  quantityIndicatorId: (id) => `[data-quantity-indicator="${id}"]`,
  quantityInputKey: (key) => `[data-quantity-input-key="${key}"]`,
  quantityNumber: '[data-quantity-number]',
  quantityLabel: '[data-quantity-label]',
};

const classes$2 = {
  inCart: 'in-cart',
  isVisible: 'is-visible',
  updated: 'updated',
};

class CartQuantity {
  constructor() {
    this.cartState = {};
  }

  updateLocalCartState(newState, updatedItem) {
    if (newState) {
      this.cartState = this._convertToLocalCartState(newState);
      this.updateQuantityIndicatorElements([updatedItem]);
    } else {
      getState().then((state) => {
        this.cartState = this._convertToLocalCartState(state);
        this.updateQuantityIndicatorElements();
      });
    }
  }

  updateQuantityInputElements(key, quantity) {
    const quantityInputs = document.querySelectorAll(
      selectors$2.quantityInputKey(key)
    );

    quantityInputs.forEach((quantityInput) => {
      quantityInput.dataset.quantityInCart = quantity;
      quantityInput.value = quantity;

      if (quantity) return;
      quantityInput.dispatchEvent(new window.CustomEvent('removedFromCart'));
    });
  }

  updateQuantityIndicatorElements(updatedIds, context = document, newElements) {
    const updatedProductIds = updatedIds || Object.keys(this.cartState);

    updatedProductIds.forEach((productId) => {
      const quantity = this.cartState[productId];

      if (!quantity && newElements) return;

      const quantityIndicators = context.querySelectorAll(
        selectors$2.quantityIndicatorId(productId)
      );

      quantityIndicators.forEach((quantityIndicator) => {
        this._setQuantityIndicator(quantityIndicator, quantity);
      });
    });
  }

  _convertToLocalCartState(state) {
    const localCartState = {};

    state.items.forEach((item) => {
      if (!localCartState[item.product_id]) localCartState[item.product_id] = 0;

      localCartState[item.product_id] += item.quantity;
    });

    return localCartState;
  }

  _setQuantityIndicator(quantityIndicator, quantity) {
    const quantityNumber = quantityIndicator.querySelector(
      selectors$2.quantityNumber
    );
    const currentQuantity = parseInt(quantityNumber.dataset.quantity, 10);
    const newQuantity = quantity ? quantity : 0;

    if (currentQuantity === newQuantity) return;

    if (quantityIndicator.classList.contains(classes$2.isVisible) && quantity) {
      this._animateUpdate(quantityIndicator);
    } else {
      this._animateShowOrHide(quantityIndicator, newQuantity);
    }

    quantityNumber.dataset.quantity = newQuantity;

    const quantityText = newQuantity < 100 ? newQuantity : '99+';
    quantityNumber.textContent = quantityText;

    const ariaLabel =
      quantity === 1
        ? quantityIndicator.dataset.labelSingle
        : quantityIndicator.dataset.labelMulti.replace(
            '[quantity]',
            newQuantity
          );

    const quantityLabel = quantityIndicator.querySelector(
      selectors$2.quantityLabel
    );
    quantityLabel.textContent = ariaLabel;
  }

  _animateShowOrHide(quantityIndicator, visible) {
    quantityIndicator.classList.toggle(classes$2.inCart, visible);

    if (visible) {
      quantityIndicator.classList.add(classes$2.isVisible);
      return;
    }

    promiseTransitionEnd(quantityIndicator).then(() => {
      quantityIndicator.classList.remove(classes$2.isVisible);
    });
  }

  _animateUpdate(quantityIndicator) {
    quantityIndicator.classList.add(classes$2.updated);

    promiseTransitionEnd(quantityIndicator).then(() => {
      quantityIndicator.classList.remove(classes$2.updated);
    });
  }
}

const selectors$3 = {
  form: '[data-form]',
  formInputWrapper: '[data-form-input-wrapper]',
  formStatus: '[data-form-status]',
};

const classes$3 = {
  floatingLabel: 'form__input-wrapper--floating-label',
};

class Form {
  constructor() {
    const forms = document.querySelectorAll(selectors$3.form);

    forms.forEach((form) => {
      this._focusFormStatus(form);
      this._handleFormInputLabels(form);
    });
  }

  /**
   * If there are elements that contain '[data-form-status]' after submitting a form, focus to that element.
   */
  _focusFormStatus(form) {
    const formStatus = form.querySelector(selectors$3.formStatus);

    if (!formStatus) return;

    formStatus.focus();

    formStatus.addEventListener('blur', () => {
      formStatus.removeAttribute('tabindex');
    });
  }

  _handleFormInputLabels(form) {
    const inputWrappers = form.querySelectorAll(selectors$3.formInputWrapper);

    if (!inputWrappers) return;

    inputWrappers.forEach((inputWrapper) => {
      inputWrapper.addEventListener('focusin', () => {
        inputWrapper.classList.add(classes$3.floatingLabel);
      });

      inputWrapper.addEventListener('focusout', (event) => {
        const input = event.target;

        if (input.value !== '') return;

        inputWrapper.classList.remove(classes$3.floatingLabel);
      });
    });
  }
}

const classes$4 = {
  cookiesDisabled: 'cookies-disabled',
};

class CartTemplate {
  constructor(cartElement) {
    this.elements = {
      cart: cartElement,
    };
  }

  init() {
    if (!cookiesEnabled()) {
      this.elements.cart.classList.add(classes$4.cookiesDisabled);
    }
  }
}

const selectors$4 = {
  arrow: '[data-scroller-arrow]',
  menu: '[data-scroller-content]',
  wrapper: '[data-scroller-wrapper]',
};

const classes$5 = {
  noTransition: 'scroller-content--no-transition',
  wrapper: 'scroller-wrapper',
};

const config = {
  offset: 150,
};

class Scroller {
  constructor(container) {
    this.container = container;
  }

  init() {
    this.wrapper = this.container.querySelector(selectors$4.wrapper);
    if (!this.wrapper) return;

    this.initialized = true;
    this.menu = this.wrapper.querySelector(selectors$4.menu);
    this.arrows = this.container.querySelectorAll(selectors$4.arrow);
    this.isTransitioning = false;

    this._setupEventHandlers();

    promiseStylesheet().then(() => {
      this._recalculateOverflow();
    });
  }

  makeElementVisible(element) {
    if (this.overflowValue === 'none' || !this.initialized) return;

    let elementVisible = true;
    const offset = config.offset / 2;
    const elementRect = element.getBoundingClientRect();
    const elementLeft = Math.floor(elementRect.left) - offset;
    const elementRight = Math.floor(elementRect.right) + offset;

    if (!this.wrapperRect) this._recalculateOverflow();

    if (elementRight > this.wrapperRect.right) {
      this.direction = 'next';
      elementVisible = false;
    } else if (elementLeft < this.wrapperRect.left) {
      this.direction = 'previous';
      elementVisible = false;
    }

    if (elementVisible || this.isTransitioning) return;

    this.isTransitioning = true;
    const distance = this._getDistanceToElement(
      elementRight,
      element.offsetLeft,
      offset
    );
    this._setMenuTranslateX(distance);
  }

  destroy() {
    if (!this.initialized) return;
    this.wrapper.removeEventListener(
      'scroll',
      this.eventHandlers.recalculateOverflow,
      { passive: true }
    );

    window.removeEventListener('resize', this.eventHandlers.debounceScroller);

    this.arrows.forEach((arrow) => {
      arrow.removeEventListener('click', this.eventHandlers.onArrowClick);
    });
  }

  _recalculateOverflow() {
    const overflowValue = this._getOverflowValue();
    this._setOverflowClass(overflowValue);
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();
    this.wrapper.addEventListener(
      'scroll',
      this.eventHandlers.recalculateOverflow,
      { passive: true }
    );

    window.addEventListener('resize', this.eventHandlers.debounceScroller);

    this.arrows.forEach((arrow) => {
      arrow.addEventListener('click', this.eventHandlers.onArrowClick);
    });
  }

  _getEventHandlers() {
    return {
      recalculateOverflow: this._recalculateOverflow.bind(this),
      onArrowClick: this._onArrowClick.bind(this),
      debounceScroller: debounce(() => {
        this._recalculateOverflow();
      }, 250),
    };
  }

  _getOverflowValue() {
    this._getSelectorsDomRect();
    const wrapperLeft = Math.floor(this.wrapperRect.left);
    const wrapperRight = Math.floor(this.wrapperRect.right);
    const menuLeft = Math.floor(this.menuRect.left);
    const menuRight = Math.floor(this.menuRect.right);

    const leftOverflow = menuLeft < wrapperLeft;
    const rightOverflow = menuRight > wrapperRight;

    let overflowValue = 'none';
    if (leftOverflow && rightOverflow) {
      overflowValue = 'both';
    } else if (leftOverflow) {
      overflowValue = 'left';
    } else if (rightOverflow) {
      overflowValue = 'right';
    }

    return overflowValue;
  }

  _getSelectorsDomRect() {
    this.wrapperRect = this.wrapper.getBoundingClientRect();
    this.menuRect = this.menu.getBoundingClientRect();
  }

  _setOverflowClass(overflowValue) {
    if (this.overflowValue === overflowValue) return;

    this.wrapper.classList.remove(`${classes$5.wrapper}--${this.overflowValue}`);

    window.requestAnimationFrame(() => {
      this.wrapper.classList.add(`${classes$5.wrapper}--${overflowValue}`);
      this.overflowValue = overflowValue;
    });
  }

  _onArrowClick(event) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.direction = event.currentTarget.dataset.scrollerArrowDirection;

    const offset = config.offset;
    let distance = this._getDistanceToNextPosition();
    distance = distance < offset * 2 ? distance : offset;
    this._setMenuTranslateX(distance);
  }

  _getDistanceToNextPosition() {
    if (this.direction === 'next') {
      return Math.round(this.menuRect.right - this.wrapperRect.right);
    }

    return this.wrapper.scrollLeft;
  }

  _getDistanceToElement(elementRight, elementLeft, offset) {
    if (this.direction === 'next') {
      const maxDistance = Math.ceil(
        this.menuRect.width - this.wrapperRect.width - this.wrapper.scrollLeft
      );

      let distance = Math.round(elementRight - this.wrapperRect.right) + offset;
      distance = distance < maxDistance ? distance : maxDistance;
      return distance;
    }

    let distance = this.wrapper.scrollLeft - elementLeft + offset;
    distance =
      distance < this.wrapper.scrollLeft ? distance : this.wrapper.scrollLeft;
    return distance;
  }

  _setMenuTranslateX(distance) {
    const translateValue = this.direction === 'next' ? -distance : distance;

    this.menu.style.transform = `translateX(${translateValue}px)`;
    this.translatedValue = translateValue;
    this.menu.classList.remove(classes$5.noTransition);

    promiseTransitionEnd(this.menu).then(() => {
      this._setWrapperScrollLeft();
      this.isTransitioning = false;
    });
  }

  _setWrapperScrollLeft() {
    const translatedValue = Math.abs(this.translatedValue);

    this.menu.style.transform = 'none';
    this.menu.classList.add(classes$5.noTransition);

    if (this.direction === 'previous') {
      this.wrapper.scrollLeft -= translatedValue;
    } else {
      this.wrapper.scrollLeft += translatedValue;
    }
  }
}

const selectors$6 = {
  disclosure: '[data-disclosure]',
  disclosureList: '[data-disclosure-list]',
  disclosureToggle: '[data-disclosure-toggle]',
  disclosureInput: '[data-disclosure-input]',
  disclosureOptions: '[data-disclosure-option]',
};

const classes$6 = {
  listVisible: 'disclosure-list--visible',
};

class Disclosure {
  constructor(container) {
    this.disclosureForm = container;
    this.disclosure = container.querySelector(selectors$6.disclosure);
    this.disclosureList = container.querySelector(selectors$6.disclosureList);
    this.disclosureToggle = container.querySelector(selectors$6.disclosureToggle);
    this.disclosureInput = container.querySelector(selectors$6.disclosureInput);
    this.disclosureOptions = container.querySelectorAll(
      selectors$6.disclosureOptions
    );

    this._setupListeners();
  }

  destroy() {
    this.disclosureToggle.removeEventListener(
      'click',
      this.eventHandlers.toggleList
    );

    this.disclosureOptions.forEach((disclosureOption) =>
      disclosureOption.removeEventListener(
        'click',
        this.eventHandlers.connectOptions
      )
    );

    this.disclosure.removeEventListener(
      'keyup',
      this.eventHandlers.onDisclosureKeyUp
    );

    this.disclosureList.removeEventListener(
      'focusout',
      this.eventHandlers.onDisclosureListFocusOut
    );

    this.disclosureToggle.removeEventListener(
      'focusout',
      this.eventHandlers.onDisclosureToggleFocusOut
    );

    document.body.removeEventListener('click', this.eventHandlers.onBodyClick);
  }

  _setupListeners() {
    this.eventHandlers = this._setupEventHandlers();

    this.disclosureToggle.addEventListener(
      'click',
      this.eventHandlers.toggleList
    );

    this.disclosureOptions.forEach((disclosureOption) => {
      disclosureOption.addEventListener(
        'click',
        this.eventHandlers.connectOptions
      );
    });

    this.disclosure.addEventListener(
      'keyup',
      this.eventHandlers.onDisclosureKeyUp
    );

    this.disclosureList.addEventListener(
      'focusout',
      this.eventHandlers.onDisclosureListFocusOut
    );

    this.disclosureToggle.addEventListener(
      'focusout',
      this.eventHandlers.onDisclosureToggleFocusOut
    );

    document.body.addEventListener('click', this.eventHandlers.onBodyClick);
  }

  _setupEventHandlers() {
    return {
      connectOptions: this._connectOptions.bind(this),
      toggleList: this._toggleList.bind(this),
      onBodyClick: this._onBodyClick.bind(this),
      onDisclosureKeyUp: this._onDisclosureKeyUp.bind(this),
      onDisclosureListFocusOut: this._onDisclosureListFocusOut.bind(this),
      onDisclosureToggleFocusOut: this._onDisclosureToggleFocusOut.bind(this),
    };
  }

  _connectOptions(event) {
    event.preventDefault();

    this._submitForm(event.currentTarget.dataset.value);
  }

  _onDisclosureToggleFocusOut(event) {
    const disclosureLostFocus =
      this.disclosure.contains(event.relatedTarget) === false;

    if (!disclosureLostFocus) return;

    this._toggleList();
  }

  _onDisclosureListFocusOut(event) {
    const childInFocus = event.currentTarget.contains(event.relatedTarget);

    const isVisible = this.disclosureList.classList.contains(
      classes$6.listVisible
    );

    if (isVisible && !childInFocus) {
      this._toggleList();
    }
  }

  _onDisclosureKeyUp(event) {
    if (event.key.toLowerCase() !== keyCodes.ESC) return;
    this._toggleList();
    this.disclosureToggle.focus();
  }

  _onBodyClick(event) {
    const isOption = this.disclosure.contains(event.target);
    const isVisible = this.disclosureList.classList.contains(
      classes$6.listVisible
    );

    if (isVisible && !isOption) {
      this._toggleList();
    }
  }

  _submitForm(value) {
    this.disclosureInput.value = value;
    this.disclosureForm.submit();
  }

  _toggleList() {
    const ariaExpanded =
      this.disclosureToggle.getAttribute('aria-expanded') === 'true';

    this.disclosureList.classList.toggle(classes$6.listVisible);
    this.disclosureToggle.setAttribute('aria-expanded', !ariaExpanded);
  }
}

const selectors$5 = {
  disclosureForm: '[data-disclosure-form]',
};

sections.register('footer', {
  onLoad() {
    const disclosureForms = Array.from(
      this.container.querySelectorAll(selectors$5.disclosureForm)
    );

    this.disclosures = disclosureForms.map((disclosureForm) => {
      return new Disclosure(disclosureForm);
    });
  },

  onUnload() {
    this.disclosures.forEach((disclosure) => disclosure.destroy());
  },
});

const selectors$7 = {
  dropdownMenu: '[data-dropdown-menu]',
  dropdownParent: '[data-dropdown-parent]',
  dropdownParentType: (type) => `[data-dropdown-parent-type="${type}"]`,
  headerIcon: '[data-header-icon]',
  menuNavigation: '[data-menu-navigation]',
  menuNavigationItem: '[data-menu-navigation-item]',
  menuNavigationLastItem: '[data-menu-navigation-last-item]',
  menuNavigationType: (menuType) => `[data-menu-navigation-type="${menuType}"]`,
  mobileNavigationToggle: '[data-mobile-navigation-toggle]',
  mobileNavigationContainer: '[data-mobile-navigation-container]',
  mobileNavigationDrawer: '[data-mobile-navigation-drawer]',
  header: '[data-header]',
  stickySentinelHeader: '[data-sticky-sentinel-header]',
  stickyCollectionHeader: '[data-sticky-element]',
  logoImage: '[data-logo-image]',
  announcementBar: '[data-announcement-bar]',
  mainContent: '[data-main-content]',
};

const classes$7 = {
  menuNavigationItemIsExpanded: 'menu-navigation__item--is-expanded',
  menuDropdownItemIsExpanded: 'menu-dropdown__item--is-expanded',
  menuNavigationHidden: 'menu-navigation-wrapper--hidden',
  headerWrapperFixed: 'header-wrapper--fixed',
  headerWrapperHidden: 'header-wrapper--hidden',
  bodyWithStickyHeader: 'body-with-sticky-header',
};

const attributes = {
  headerLogo: 'data-header-logo',
  headerIcon: 'data-header-icon',
  popupOpen: 'data-popup-open',
  menuNavigationToggle: 'data-mobile-navigation-toggle',
  searchToggle: 'data-search-toggle',
};

const popups = {
  cart: 'cart',
  menuNavigation: 'menu-navigation',
  search: 'search',
};

sections.register('header', {
  onLoad() {
    this.elements = this._getElements();
    if (isIntersectionObserverAvailable()) {
      this._prepareStickyHeader();
    }

    this._reloadHeaderPopups();

    this.mqlLarge = window.matchMedia(getMediaQueryString('large'));
    this.mqlSmall = window.matchMedia(getMediaQueryString('medium', 'max'));

    this.drawerMenuIsActive = !this.mqlLarge.matches;

    if (this.elements.menuNavigation) this._handleMenuNavigationWidth();
    this._setupEventHandlers();
  },

  _reloadHeaderPopups() {
    if (!window.popups) return;

    if (
      !window.popups.find((popup) => popup.name === popups.menuNavigation) &&
      this.elements.menuNavigation
    ) {
      window.popups.push(new Popup(popups.menuNavigation));
    }

    Object.values(popups).forEach((popupType) => {
      const targetPopup = window.popups.find(
        (popup) => popup.name === popupType
      );

      if (!targetPopup) return;

      targetPopup.init();
    });
  },

  _getElements() {
    return {
      announcementBar: this.container.querySelector(selectors$7.announcementBar),
      cartPriceBubbleContainers: this.container.querySelectorAll(
        selectors$7.cartPriceBubbleContainer
      ),
      desktopNavigation: this.container.querySelector(
        selectors$7.menuNavigationType('desktop')
      ),
      dropdownParents: this.container.querySelectorAll(
        selectors$7.dropdownParent
      ),
      header: this.container.querySelector(selectors$7.header),
      headerIcons: Array.from(
        this.container.querySelectorAll(selectors$7.headerIcon)
      ),
      headerLogo: this.container.querySelector(selectors$7.logoImage),
      headerSentinel: document.querySelector(selectors$7.stickySentinelHeader),
      headerWrapper: this.container,
      menuNavigation: this.container.querySelector(selectors$7.menuNavigation),
      menuNavigationItems: this.container.querySelectorAll(
        selectors$7.menuNavigationItem
      ),
      mobileNavigationToggle: this.container.querySelector(
        selectors$7.mobileNavigationToggle
      ),
    };
  },

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    if (isIntersectionObserverAvailable()) {
      window.addEventListener('scroll', this.eventHandlers.toggleHeaderSticky, {
        passive: true,
      });

      document.addEventListener(
        'productAddedToCart',
        this.eventHandlers.productAddedToCart
      );

      document.addEventListener(
        'featuredCollectionTabClicked',
        this.eventHandlers.preventHeaderSlideIn
      );

      document.addEventListener(
        'elementSticky',
        this.eventHandlers.featuredCollectionSticky
      );
    }

    if (this.elements.menuNavigation) {
      this.elements.dropdownParents.forEach((parent) =>
        parent.addEventListener(
          'click',
          this.eventHandlers.onDropdownParentClick
        )
      );

      window.addEventListener('resize', this.eventHandlers.onWindowResize);

      this.elements.mobileNavigationToggle.addEventListener(
        'click',
        this.eventHandlers.handleMobileNavigation
      );
    }
  },

  _getEventHandlers() {
    return {
      handleMultiplePopups: this._handleMultiplePopups.bind(this),
      onBodyClick: this._onBodyClick.bind(this),
      onDrawerNavigationKeyup: this._onDrawerNavigationKeyup.bind(this),
      onDropdownFocusOut: this._onDropdownFocusOut.bind(this),
      onDropdownKeyup: this._onDropdownKeyup.bind(this),
      onDropdownParentClick: this._onDropdownParentClick.bind(this),
      onWindowResize: debounce(() => this._onWindowResize(), 250),
      handleMobileNavigation: this._handleMobileNavigation.bind(this),
      toggleHeaderSticky: debounce(() => this._toggleHeaderPosition(), 100),
      featuredCollectionSticky: this._featuredCollectionSticky.bind(this),
      productAddedToCart: this._productAddedToCart.bind(this),
      preventHeaderSlideIn: this._preventHeaderSlideIn.bind(this),
    };
  },

  _onWindowResize() {
    const activeParentDropdown = this._getDesktopActiveParentDropdown();
    const isDrawerNavigationOpen =
      this.elements.mobileNavigationToggle.getAttribute('aria-expanded') ===
      'true';

    if (this.scrolledPastHeader) return;

    this._handleMenuNavigationWidth();

    if (this.drawerMenuIsActive && activeParentDropdown) {
      this._closeActiveDropdown();
    } else if (!this.drawerMenuIsActive && activeParentDropdown) {
      this.elements.menuNavigation.style.overflow = 'initial';
    } else if (isDrawerNavigationOpen && !this.drawerMenuIsActive) {
      this._closeMobileNavigation();
    } else if (isDrawerNavigationOpen && this.drawerMenuIsActive) {
      this._toggleHeaderIcons(true);
    }
  },

  _handleMenuNavigationWidth() {
    if (!this.mqlLarge.matches) {
      this.drawerMenuIsActive = true;
      return;
    }

    this.elements.menuNavigation.style.overflow = 'hidden';

    const menuPositionRight = this.elements.menuNavigation.getBoundingClientRect()
      .right;
    const lastMenuItemPositionRight = this.elements.menuNavigation
      .querySelector(selectors$7.menuNavigationLastItem)
      .getBoundingClientRect().right;

    if (menuPositionRight >= lastMenuItemPositionRight) {
      this.elements.menuNavigation.classList.remove(
        classes$7.menuNavigationHidden
      );

      this.drawerMenuIsActive = false;
    } else {
      this.elements.menuNavigation.classList.add(classes$7.menuNavigationHidden);
      this.drawerMenuIsActive = true;
    }
  },

  _onDropdownFocusOut(event) {
    event.preventDefault();

    if (event.currentTarget.contains(event.relatedTarget)) return;

    const dropdownParent = event.currentTarget.previousElementSibling;

    this._toggleMenuDropdown(dropdownParent);
  },

  _closeActiveDropdown() {
    const activeParent = this._getDesktopActiveParentDropdown();

    if (!activeParent) return;

    this._animateDropdownClosed(
      activeParent.nextElementSibling,
      activeParent,
      false
    );
  },

  _getDesktopActiveParentDropdown() {
    return this.elements.desktopNavigation.querySelector(
      `${selectors$7.dropdownParent}${selectors$7.dropdownParentType(
        'main'
      )}[aria-expanded="true"]`
    );
  },

  _onDropdownParentClick(event) {
    const parent = event.currentTarget;

    if (
      parent.dataset.dropdownParentType === 'main' &&
      parent.closest(selectors$7.menuNavigationType('desktop'))
    ) {
      event.stopImmediatePropagation();
      this._onBodyClick();
    }

    const dropdowns = parent.parentElement.querySelectorAll(
      selectors$7.dropdownMenu
    );

    this._setupDropdowns(dropdowns);
    this._toggleMenuDropdown(parent);
  },

  _setupDropdowns(dropdownMenus) {
    dropdownMenus.forEach((dropdown, index) => {
      if (dropdown.dataset.maxHeight) return;

      if (
        index === 0 &&
        dropdown.closest(selectors$7.menuNavigationType('desktop'))
      ) {
        this._setupMainLevelDropdown(dropdown);
      } else {
        this._setupChildAndMobileDropdown(dropdown);
      }
    });
  },

  _setupMainLevelDropdown(dropdown) {
    dropdown.style.whiteSpace = 'nowrap';

    const { width, height } = dropdown.getBoundingClientRect();

    dropdown.dataset.width = `${width}px`;
    dropdown.style.width = width < 260 ? `${width}px` : '26rem';
    dropdown.style.removeProperty('white-space');
    dropdown.dataset.maxHeight =
      width < 260
        ? `${height}px`
        : `${dropdown.getBoundingClientRect().height}px`;
    dropdown.style.maxHeight = '0px';
  },

  _setupChildAndMobileDropdown(dropdown) {
    dropdown.dataset.maxHeight = `${dropdown.getBoundingClientRect().height}px`;
    dropdown.style.maxHeight = '0px';
  },

  _toggleMenuDropdown(parent) {
    const isExpanded = parent.getAttribute('aria-expanded') === 'true';
    const dropdown = parent.nextElementSibling;

    if (isExpanded) {
      this._animateDropdownClosed(dropdown, parent);
    } else {
      this._animateDropdownOpen(dropdown, parent);
    }
  },

  _animateDropdownClosed(dropdown, parent, animate = true) {
    const isSecondLevelDropdown = parent.dataset.dropdownParentType === 'main';

    if (isSecondLevelDropdown) {
      parent.classList.remove(classes$7.menuNavigationItemIsExpanded);

      if (dropdown.closest(selectors$7.menuNavigationType('desktop')))
        dropdown.removeEventListener(
          'focusout',
          this.eventHandlers.onDropdownFocusOut
        );
    } else {
      parent.classList.remove(classes$7.menuDropdownItemIsExpanded);
    }

    dropdown.style.maxHeight = '0px';
    dropdown.style.opacity = 0;

    if (animate) {
      promiseTransitionEnd(dropdown).then(() => {
        this._closeDropdown(parent, dropdown, isSecondLevelDropdown);
      });
    } else {
      this._closeDropdown(parent, dropdown, isSecondLevelDropdown);
    }
  },

  _closeDropdown(parent, dropdown, isSecondLevelDropdown) {
    parent.setAttribute('aria-expanded', 'false');

    if (
      !isSecondLevelDropdown ||
      !dropdown.closest(selectors$7.menuNavigationType('desktop'))
    )
      return;

    if (!this._getDesktopActiveParentDropdown()) {
      this.elements.menuNavigation.style.overflow = 'hidden';
    }

    document.body.removeEventListener('click', this.eventHandlers.onBodyClick);

    dropdown.removeEventListener('click', this._preventDropdownClick);

    parent.parentNode.removeEventListener(
      'keyup',
      this.eventHandlers.onDropdownKeyup
    );
  },

  _animateDropdownOpen(dropdown, parent) {
    const isSecondLevelDropdown = parent.dataset.dropdownParentType === 'main';
    const isDesktopNavigation = parent.closest(
      selectors$7.menuNavigationType('desktop')
    );

    if (isSecondLevelDropdown) {
      if (isDesktopNavigation)
        this.elements.menuNavigation.style.overflow = 'initial';
      parent.classList.add(classes$7.menuNavigationItemIsExpanded);

      if (isDesktopNavigation)
        dropdown.addEventListener(
          'focusout',
          this.eventHandlers.onDropdownFocusOut
        );
    } else {
      parent.classList.add(classes$7.menuDropdownItemIsExpanded);
    }

    parent.setAttribute('aria-expanded', 'true');
    dropdown.style.maxHeight = `${dropdown.dataset.maxHeight}`;
    dropdown.style.opacity = 1;

    if (!isDesktopNavigation || !isSecondLevelDropdown) return;

    promiseTransitionEnd(dropdown).then(() => {
      document.body.addEventListener('click', this.eventHandlers.onBodyClick);

      dropdown.addEventListener('click', this._preventDropdownClick);

      parent.parentNode.addEventListener(
        'keyup',
        this.eventHandlers.onDropdownKeyup
      );
    });
  },

  _onDropdownKeyup(event) {
    if (event.key.toLowerCase() !== keyCodes.ESC) return;

    const listItem = event.currentTarget;
    const parent = listItem.querySelector(selectors$7.dropdownParentType('main'));
    const dropdown = parent.nextElementSibling;

    this._animateDropdownClosed(dropdown, parent);
    parent.focus();
  },

  _preventDropdownClick(event) {
    event.stopImmediatePropagation();
  },

  _onBodyClick() {
    const expandedParentDropdown = this._getDesktopActiveParentDropdown();

    if (!expandedParentDropdown) return;
    const expandedDropdown = expandedParentDropdown.nextElementSibling;

    this._animateDropdownClosed(expandedDropdown, expandedParentDropdown);
  },

  _handleMobileNavigation(event) {
    const toggle = event.currentTarget;
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      this._closeMobileNavigation();
    } else {
      this._openMobileNavigation(toggle);
      if (this.stickyHeaderTimeout) clearTimeout(this.stickyHeaderTimeout);
      this.lastScrollDirection = 'none';
    }
  },

  _closeMobileNavigation() {
    this._toggleHeaderIcons();

    if (this.elements.headerButtons.length) {
      this.elements.headerButtons.forEach((button) =>
        button.removeEventListener(
          'click',
          this.eventHandlers.handleMultiplePopups
        )
      );
    }

    document.removeEventListener(
      'keyup',
      this.eventHandlers.onDrawerNavigationKeyup
    );

    document.removeEventListener('focusin', this._onBodyFocusIn);

    this.elements.drawerNavigationPopup.closePopup(false);
  },

  _openMobileNavigation(toggle) {
    this.elements.drawerNavigationPopup =
      this.elements.drawerNavigationPopup ||
      window.popups.find((popup) => popup.name === popups.menuNavigation);

    this.elements.headerButtons =
      this.elements.headerButtons ||
      this.elements.headerIcons.filter((icon) =>
        icon.hasAttribute(attributes.popupOpen)
      );

    this._setupMobileNavigationDropdowns();
    this._setMobileDrawerHeight();
    this._toggleHeaderIcons(true);

    if (this.elements.headerButtons.length) {
      this.elements.headerButtons.forEach((button) =>
        button.addEventListener(
          'click',
          this.eventHandlers.handleMultiplePopups
        )
      );
    }

    document.addEventListener(
      'keyup',
      this.eventHandlers.onDrawerNavigationKeyup
    );

    // to prevent menu drawer close button from displaying when
    // clicking focusable elements in the heading
    document.addEventListener('focusin', this._onBodyFocusIn);

    this.elements.drawerNavigationPopup.openPopup({ currentTarget: toggle });
  },

  _onBodyFocusIn(event) {
    const target = event.target;
    if (
      target.hasAttribute(attributes.headerIcon) ||
      target.hasAttribute(attributes.menuNavigationToggle) ||
      target.hasAttribute(attributes.headerLogo)
    )
      event.stopImmediatePropagation();
  },

  _setupMobileNavigationDropdowns() {
    if (this.elements.mobileNavigation) return;

    this.elements.mobileNavigation = this.elements.headerWrapper.querySelector(
      selectors$7.menuNavigationType('mobile')
    );

    this.elements.mobileMenuParents = this.elements.mobileNavigation.querySelectorAll(
      selectors$7.dropdownParent
    );

    this.elements.mobileMenuParents.forEach((parent) =>
      this._setupDropdowns(
        parent.parentElement.querySelectorAll(selectors$7.dropdownMenu)
      )
    );
  },

  _setMobileDrawerHeight() {
    this.elements.mobileNavigationContainer =
      this.elements.mobileNavigationContainer ||
      this.elements.headerWrapper.querySelector(
        selectors$7.mobileNavigationContainer
      );

    this.elements.mobileNavigationDrawer =
      this.elements.mobileNavigationDrawer ||
      this.elements.headerWrapper.querySelector(
        selectors$7.mobileNavigationDrawer
      );

    const headerHeight = this.elements.headerWrapper.getBoundingClientRect()
      .height;
    const scrollPosition = window.pageYOffset;

    const heightDifference = headerHeight - scrollPosition;
    this.elements.mobileNavigationDrawer.style.top = `${headerHeight}px`;
    this.elements.mobileNavigationContainer.style.height = `calc(100vh - ${heightDifference}px)`;
  },

  _toggleHeaderIcons(isDrawerNavigationOpen = false) {
    const setHidden = this.mqlSmall.matches && isDrawerNavigationOpen;

    this.elements.headerIcons.forEach((toggle) => {
      if (setHidden) {
        toggle.setAttribute('hidden', true);
      } else {
        toggle.removeAttribute('hidden');
      }
    });
  },

  _handleMultiplePopups(event) {
    this.elements.popups = this.elements.popups || {};

    const popupType = event.currentTarget.hasAttribute(attributes.searchToggle)
      ? popups.search
      : popups.cart;

    this.elements.popups[popupType] =
      this.elements.popups[popupType] ||
      window.popups.find((popup) => popup.name === popupType);

    const popupElements = this.elements.popups[popupType].getElements();

    if (popupType === popups.search) {
      this._closeMobileNavigation();
    } else {
      promiseTransitionEnd(popupElements.popup).then(() => {
        this._closeMobileNavigation();
      });
    }
  },

  _onDrawerNavigationKeyup(event) {
    if (event.key.toLowerCase() !== keyCodes.ESC) return;

    this._toggleHeaderIcons();
    document.removeEventListener(
      'keyup',
      this.eventHandlers.onDrawerNavigationKeyup
    );
  },

  // Start of the code for sticky Nav
  _prepareStickyHeader() {
    this.featuredCollections = {};
    this.previousScrollPosition = window.pageYOffset;
    this.headerWrapperHeight = this.elements.headerWrapper.offsetHeight;
    this.originalHeaderHeight = this.elements.header.offsetHeight;

    this._setupHeaderObserver();
    this.headerObserver.observe(this.elements.headerSentinel);

    this.elements.headerWrapper.style.position = 'fixed';
    document.querySelector(
      selectors$7.mainContent
    ).style.paddingTop = `${this.headerWrapperHeight}px`;
  },

  _setupHeaderObserver() {
    this.headerObserver = new IntersectionObserver((data) => {
      if (data[0].isIntersecting) {
        this._resetSentinel();
        this.scrolledPastHeader = false;
        this._toggleInlineMenuOpacity();

        requestAnimationFrame(() => {
          this._resetHeader();
        });
      } else {
        this.scrolledPastHeader = true;
        promiseTransitionEnd(this.elements.headerWrapper).then(() => {
          this._toggleInlineMenuOpacity();
          this.drawerMenuIsActive = true;
        });

        this.elements.headerWrapper.classList.add(classes$7.headerWrapperHidden);
        this._moveSentinel();
      }
    });
  },

  _toggleHeaderPosition() {
    if (this.isHeaderAnimating || this.doNotSlideHeaderIn) return;

    const newScrollPosition = window.pageYOffset;
    const scrollDirection =
      newScrollPosition < this.previousScrollPosition ? 'up' : 'down';
    this.scrolledPastHeader = newScrollPosition > this.headerWrapperHeight;

    this.previousScrollPosition = newScrollPosition;

    if (
      !this.scrolledPastHeader ||
      this.lastScrollDirection === scrollDirection
    )
      return;

    this.lastScrollDirection = scrollDirection;

    if (scrollDirection === 'down') {
      if (this.elements.menuNavigation) this._closeActiveDropdown();

      if (this.isFixed) {
        requestAnimationFrame(() => {
          this._headerSlideOut();
        });
      } else {
        if (this.elements.headerLogo)
          this.elements.headerLogo.style.removeProperty('transition');
        requestAnimationFrame(() => {
          this.elements.headerWrapper.classList.add(
            classes$7.headerWrapperHidden
          );
        });
      }
    } else {
      if (this.isFixed) return;
      requestAnimationFrame(() => {
        this._headerSlideIn();
      });
    }
  },

  _productAddedToCart() {
    if (!this.scrolledPastHeader) return;
    if (!this.isFixed) this._headerSlideIn();

    clearTimeout(this.stickyHeaderTimeout);
    this.stickyHeaderTimeout = setTimeout(() => {
      this._headerSlideOut();
    }, 5000);
  },

  _preventHeaderSlideIn() {
    this.doNotSlideHeaderIn = true;

    if (this.isFixed) this._headerSlideOut();
    this.lastScrollDirection = null;

    this.preventHeaderSlideInTimeout = setTimeout(() => {
      this.doNotSlideHeaderIn = false;
      this.previousScrollPosition = window.pageYOffset;
    });
  },

  _featuredCollectionSticky(event) {
    const { stickyElement, isSticky, container } = event.detail;
    const stickyId = container.dataset.sectionId;

    this.featuredCollections[stickyId] = this.featuredCollections[stickyId] || {
      stickyElement,
      isSticky,
    };
    this.featuredCollections[stickyId].isSticky = isSticky;

    this._toggleFeaturedCollectionStyle(this.featuredCollections[stickyId]);
  },

  _resetHeader() {
    if (!this.elements.headerSentinel) return;

    this.isFixed = false;
    this.isHeaderAnimating = true;

    if (this.elements.menuNavigation) {
      if (this.elements.headerLogo) {
        promiseTransitionEnd(this.elements.headerLogo).then(() => {
          this._handleMenuNavigationWidth();
        });
      } else {
        this._handleMenuNavigationWidth();
      }
    }
    this._toggleBodyClass();

    if (this.elements.announcementBar)
      this.elements.announcementBar.style.display = 'block';
    this.elements.headerWrapper.classList.remove(
      classes$7.headerWrapperFixed,
      classes$7.headerWrapperHidden
    );

    if (!this.featuredCollections) return;

    Object.keys(this.featuredCollections).forEach((stickyId) => {
      const collection = this.featuredCollections[stickyId];
      collection.stickyElement.style.transform = 'translateY(0)';
      collection.stickyElement.style.removeProperty('transition');
    });

    this.isHeaderAnimating = false;
  },

  _headerSlideIn() {
    this.isFixed = true;
    this.isHeaderAnimating = true;
    this.drawerMenuIsActive = true;

    this._toggleBodyClass();

    if (this.elements.announcementBar)
      this.elements.announcementBar.style.display = 'none';
    requestAnimationFrame(() => {
      this.elements.headerWrapper.classList.add(classes$7.headerWrapperFixed);
      this.elements.headerWrapper.classList.remove(classes$7.headerWrapperHidden);
      this._checkForFeaturedCollection();
    });

    promiseTransitionEnd(this.elements.headerWrapper).then(() => {
      if (this.elements.headerLogo) {
        this.elements.headerLogo.style.transition = 'max-width 0.25s ease-out';
      }
      this.isHeaderAnimating = false;
    });
  },

  _headerSlideOut() {
    this.isFixed = false;
    this.isHeaderAnimating = true;

    this._toggleBodyClass();

    if (this.elements.headerLogo)
      this.elements.headerLogo.style.removeProperty('transition');

    this.elements.headerWrapper.classList.add(classes$7.headerWrapperHidden);
    promiseTransitionEnd(this.elements.headerWrapper).then(() => {
      this.elements.headerWrapper.classList.remove(classes$7.headerWrapperFixed);
      this.isHeaderAnimating = false;
    });
    this._checkForFeaturedCollection();
  },

  _moveSentinel() {
    this.elements.headerSentinel.style.transform = `translateY(-${this.originalHeaderHeight}px)`;
  },

  _resetSentinel() {
    this.elements.headerSentinel.style.removeProperty('transform');
  },

  _toggleBodyClass() {
    document.body.classList.toggle(classes$7.bodyWithStickyHeader, this.isFixed);
  },

  _toggleInlineMenuOpacity() {
    if (!this.elements.menuNavigation || this.drawerMenuIsActive) return;

    this.elements.menuNavigation.classList.toggle(
      classes$7.menuNavigationHidden,
      this.scrolledPastHeader
    );
  },

  _checkForFeaturedCollection() {
    if (!this.featuredCollections) return;

    Object.keys(this.featuredCollections).forEach((stickyId) => {
      const collection = this.featuredCollections[stickyId];

      this._toggleFeaturedCollectionStyle(collection);
    });
  },

  _toggleFeaturedCollectionStyle(collection) {
    if (!this.isFixed || !collection.isSticky) {
      collection.stickyElement.style.transform = 'translateY(0)';
      promiseTransitionEnd(collection.stickyElement).then(() => {
        collection.stickyElement.style.removeProperty('transition');
      });
    } else {
      collection.stickyElement.style.transition = 'transform .25s ease-out';
      collection.stickyElement.style.transform = `translateY(${this.elements.header.offsetHeight}px)`;
    }
  },

  onUnload() {
    window.removeEventListener(
      'scroll',
      this.eventHandlers.toggleHeaderSticky,
      {
        passive: true,
      }
    );

    document.removeEventListener(
      'productAddedToCart',
      this.eventHandlers.productAddedToCart
    );

    document.removeEventListener(
      'featuredCollectionTabClicked',
      this.eventHandlers.preventHeaderSlideIn
    );

    document.removeEventListener(
      'elementSticky',
      this.eventHandlers.featuredCollectionSticky
    );

    if (this.headerObserver) {
      this.headerObserver.disconnect();
    }

    if (!this.elements.menuNavigation) return;

    this.elements.dropdownParents.forEach((parent) =>
      parent.removeEventListener(
        'click',
        this.eventHandlers.onDropdownParentClick
      )
    );

    window.removeEventListener('resize', this.eventHandlers.onWindowResize);

    this.elements.mobileNavigationToggle.removeEventListener(
      'click',
      this.eventHandlers.handleMobileNavigation
    );
  },
});

const selectors$9 = {
  mediaArrowPrev: '[data-media-arrow-previous]',
  mediaArrowNext: '[data-media-arrow-next]',
  mediaCurrent: '[data-media-current]',
  mediaImages: '[data-media-image]',
  mediaLiveRegion: '[data-media-liveregion]',
  strip: '[data-media-strip]',
  mediaIndicatorLabel: '[data-media-indicator-label]',
  mediaWrapper: '[data-media-wrapper]',
  mediaStripWrapper: '[data-media-strip-wrapper]',
};

const classes$8 = {
  isActive: 'is-active',
  transitionReady: 'transition-ready',
};

class Gallery {
  constructor(container) {
    this.elements = { container };
    this.navigationOnClick = Boolean(
      this.elements.container.dataset.mediaClickNav
    );
  }

  init() {
    Object.assign(this.elements, this.getElements());

    this.eventHandlers = this.setupEventHandlers();
    this.bindEvents();

    this.state = this.setInitialState();
    this.setIndicatorLabel();
    this.hideMedia();
    this.applyTransformation();
    window.setTimeout(() => this.enableTransition());
    this.preloadAdjacentImages();
  }

  getElements() {
    return {
      arrowNext: this.elements.container.querySelector(
        selectors$9.mediaArrowNext
      ),
      arrowPrev: this.elements.container.querySelector(
        selectors$9.mediaArrowPrev
      ),
      currentIndex: this.elements.container.querySelector(
        selectors$9.mediaCurrent
      ),
      images: Array.from(
        this.elements.container.querySelectorAll(selectors$9.mediaImages)
      ),
      liveRegionContent: this.elements.container.querySelector(
        selectors$9.mediaLiveRegion
      ),
      galleryIndicator: this.elements.container.querySelector(
        selectors$9.mediaIndicatorLabel
      ),
      mediaWrapper: this.elements.container.querySelectorAll(
        selectors$9.mediaWrapper
      ),
      mediaStripWrapper: this.elements.container.querySelector(
        selectors$9.mediaStripWrapper
      ),
    };
  }

  setupEventHandlers() {
    return {
      onArrowClick: this.onArrowClick.bind(this),
      onKeyUp: this.onKeyUp.bind(this),
      onImageClick: this.onImageClick.bind(this),
    };
  }

  bindEvents() {
    [this.elements.arrowNext, this.elements.arrowPrev].forEach((arrow) => {
      arrow.addEventListener('click', this.eventHandlers.onArrowClick);
    });

    this.elements.container.addEventListener(
      'keyup',
      this.eventHandlers.onKeyUp
    );

    if (this.navigationOnClick) {
      this.elements.images.forEach((image) => {
        image.addEventListener('click', this.eventHandlers.onImageClick);
      });
    }
  }

  destroy() {
    [this.elements.arrowNext, this.elements.arrowPrev].forEach((arrow) => {
      arrow.removeEventListener('click', this.eventHandlers.onArrowClick);
    });

    this.elements.container.removeEventListener(
      'keyup',
      this.eventHandlers.onKeyUp
    );

    this.elements.images.forEach((image) => {
      image.removeEventListener('click', this.eventHandlers.onImageClick);
    });
  }

  setInitialState() {
    const activeImage = this.elements.images.find((image) =>
      image.classList.contains(classes$8.isActive)
    );

    return {
      activeMediaImage: activeImage,
      mediaId: Number(activeImage.dataset.mediaId),
      mediaIndex: Number(activeImage.dataset.mediaIndex),
      activeMediaTotalImages: this.elements.images.length,
      useAriaHidden: true,
    };
  }

  onArrowClick(event) {
    event.preventDefault();
    this.state.isNext = 'mediaArrowNext' in event.currentTarget.dataset;
    this.goToAdjacentMedia();
  }

  onKeyUp(event) {
    if (
      event.key.toLowerCase() !== keyCodes.LEFT &&
      event.key.toLowerCase() !== keyCodes.RIGHT
    ) {
      return;
    }

    event.preventDefault();
    this.state.isNext = event.key.toLowerCase() === keyCodes.RIGHT;
    this.goToAdjacentMedia();
  }

  onImageClick(event) {
    const imageClickedIndex = event.currentTarget.dataset.mediaIndex;
    const activeImageIndex = this.elements.images.find((image) =>
      image.classList.contains(classes$8.isActive)
    ).dataset.mediaIndex;
    this.state.isNext = imageClickedIndex > activeImageIndex;
    if (imageClickedIndex !== activeImageIndex) {
      this.goToAdjacentMedia();
    }
  }

  goToAdjacentMedia() {
    this.setMediaIndex();
    this.setActiveMedia('mediaIndex');
    this.state.mediaId = Number(this.state.activeMediaImage.dataset.mediaId);
    this.renderGallery();
  }

  variantMediaSwitch(featuredMediaId) {
    if (featuredMediaId === this.state.mediaId) return;
    this.state.mediaId = featuredMediaId;
    this.setActiveMedia('mediaId');
    this.state.mediaIndex = Number(
      this.state.activeMediaImage.dataset.mediaIndex
    );
    this.renderGallery();
  }

  cacheElement(name) {
    this.elements[name] =
      this.elements[name] ||
      this.elements.container.querySelector(selectors$9[name]);
  }

  setActiveMedia(propertyQuery) {
    this.state.activeMediaImage = this.elements.images.find(
      (image) =>
        Number(image.dataset[propertyQuery]) === this.state[propertyQuery]
    );
  }

  setMediaIndex() {
    this.state.mediaIndex = this.state.isNext
      ? this.nextImage()
      : this.previousImage();
  }

  nextImage() {
    return this.state.mediaIndex === this.state.activeMediaTotalImages
      ? 1
      : this.state.mediaIndex + 1;
  }

  previousImage() {
    return this.state.mediaIndex === 1
      ? this.state.activeMediaTotalImages
      : this.state.mediaIndex - 1;
  }

  preloadAdjacentImages() {
    this.elements.images
      .filter((image) =>
        [this.nextImage(), this.previousImage()].includes(
          Number(image.dataset.mediaIndex)
        )
      )
      .forEach((image) => this.loadImage(image));
  }

  applyActiveClass() {
    this.state.activeMediaImage.classList.add(classes$8.isActive);
    this.loadImage(this.state.activeMediaImage);
  }

  hideMedia() {
    if (!this.state.useAriaHidden) return;

    this.elements.images.forEach((image) => {
      const imageContainer = image.closest(selectors$9.mediaWrapper);
      const focusableElements = imageContainer.querySelectorAll('button, a');

      if (!image.classList.contains(classes$8.isActive)) {
        image
          .closest(selectors$9.mediaWrapper)
          .setAttribute('aria-hidden', 'true');

        focusableElements.forEach((element) =>
          element.setAttribute('tabindex', '-1')
        );
        return;
      }
      imageContainer.removeAttribute('aria-hidden');
      focusableElements.forEach((element) =>
        element.removeAttribute('tabindex')
      );
    });
  }

  getIndicatorText() {
    const indicatorTextContent = this.elements.liveRegionContent.dataset
      .mediaLiveregionMessage;

    return indicatorTextContent
      .replace('[index]', this.state.mediaIndex)
      .replace('[indexTotal]', this.state.activeMediaTotalImages);
  }

  setIndicatorLabel() {
    const indicatorText = this.getIndicatorText();
    this.elements.galleryIndicator.setAttribute('aria-label', indicatorText);
  }

  updateLiveRegion() {
    const indicatorText = this.getIndicatorText();

    this.elements.liveRegionContent.setAttribute('aria-hidden', false);
    this.elements.liveRegionContent.textContent = indicatorText;

    setTimeout(() => {
      this.elements.liveRegionContent.setAttribute('aria-hidden', true);
    }, 2000);
  }

  loadImage(image) {
    if (!image.getAttribute('src') && image.tagName === 'IMG') {
      image.setAttribute('src', image.dataset.src);
    }

    if (!image.getAttribute('srcset') && image.tagName === 'IMG') {
      image.setAttribute('srcset', image.dataset.srcset);
    }
  }

  clearActiveClasses() {
    this.elements.images.forEach((image) =>
      image.classList.remove(classes$8.isActive)
    );
  }

  renderCurrentIndex() {
    this.elements.currentIndex.textContent = this.state.mediaIndex;
  }

  enableTransition() {
    this.cacheElement('strip');
    this.elements.strip.classList.add(classes$8.transitionReady);
  }

  applyTransformation() {
    this.cacheElement('strip');

    const transformationDistance = 100 * (this.state.mediaIndex - 1);
    this.elements.strip.style.transform = `translateX(-${transformationDistance}%)`;
  }

  resetTransformation() {
    this.cacheElement('strip');

    this.elements.strip.classList.remove(classes$8.transitionReady);
    this.elements.strip.style.transform = `translateX(0)`;
  }

  addAccessibilityAttr() {
    this.elements.container.setAttribute(
      'aria-roledescription',
      theme.strings.mediaCarousel
    );

    this.elements.container.setAttribute(
      'aria-label',
      this.elements.container.dataset.label
    );

    this.elements.mediaStripWrapper.setAttribute('aria-live', 'polite');

    this.elements.mediaWrapper.forEach((wrapper) => {
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('aria-roledescription', theme.strings.mediaSlide);
      wrapper.setAttribute('aria-label', wrapper.dataset.mediaLabel);
    });
  }

  removeAccessibilityAttr() {
    this.elements.container.removeAttribute('aria-roledescription');
    this.elements.container.removeAttribute('aria-label');
    this.elements.mediaWrapper.forEach((wrapper) => {
      wrapper.removeAttribute('aria-roledescription');
      wrapper.removeAttribute('aria-label');
      wrapper.removeAttribute('role');
    });
    this.elements.images.forEach((image) => {
      image.closest(selectors$9.mediaWrapper).removeAttribute('aria-hidden');
    });
    this.elements.mediaStripWrapper.removeAttribute('aria-live');
  }

  renderGallery() {
    this.clearActiveClasses();
    this.applyActiveClass();
    this.hideMedia();
    this.applyTransformation();
    this.renderCurrentIndex();
    this.setIndicatorLabel();
    this.updateLiveRegion();
    this.preloadAdjacentImages();
  }
}

function Listeners() {
  this.entries = [];
}

Listeners.prototype.add = function(element, event, fn) {
  this.entries.push({ element: element, event: event, fn: fn });
  element.addEventListener(event, fn);
};

Listeners.prototype.removeAll = function() {
  this.entries = this.entries.filter(function(listener) {
    listener.element.removeEventListener(listener.event, listener.fn);
    return false;
  });
};

/**
 * Returns a product JSON object when passed a product URL
 * @param {*} url
 */


/**
 * Find a match in the project JSON (using a ID number) and return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Number} value Accepts Number (e.g. 6908023078973)
 * @returns {Object} The variant object once a match has been successful. Otherwise null will be return
 */


/**
 * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
 */
function getVariantFromSerializedArray(product, collection) {
  _validateProductStructure(product);

  // If value is an array of options
  var optionArray = _createOptionArrayFromOptionCollection(product, collection);
  return getVariantFromOptionArray(product, optionArray);
}

/**
 * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
 * @param {Object} product Product JSON object
 * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
 * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
 */
function getVariantFromOptionArray(product, options) {
  _validateProductStructure(product);
  _validateOptionsArray(options);

  var result = product.variants.filter(function(variant) {
    return options.every(function(option, index) {
      return variant.options[index] === option;
    });
  });

  return result[0] || null;
}

/**
 * Creates an array of selected options from the object
 * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
 * @param {Object} product Product JSON object
 * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
 * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
 */
function _createOptionArrayFromOptionCollection(product, collection) {
  _validateProductStructure(product);
  _validateSerializedArray(collection);

  var optionArray = [];

  collection.forEach(function(option) {
    for (var i = 0; i < product.options.length; i++) {
      if (product.options[i].name.toLowerCase() === option.name.toLowerCase()) {
        optionArray[i] = option.value;
        break;
      }
    }
  });

  return optionArray;
}

/**
 * Check if the product data is a valid JS object
 * Error will be thrown if type is invalid
 * @param {object} product Product JSON object
 */
function _validateProductStructure(product) {
  if (typeof product !== 'object') {
    throw new TypeError(product + ' is not an object.');
  }

  if (Object.keys(product).length === 0 && product.constructor === Object) {
    throw new Error(product + ' is empty.');
  }
}

/**
 * Validate the structure of the array
 * It must be formatted like jQuery's serializeArray()
 * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
 */
function _validateSerializedArray(collection) {
  if (!Array.isArray(collection)) {
    throw new TypeError(collection + ' is not an array.');
  }

  if (collection.length === 0) {
    return [];
  }

  if (collection[0].hasOwnProperty('name')) {
    if (typeof collection[0].name !== 'string') {
      throw new TypeError(
        'Invalid value type passed for name of option ' +
          collection[0].name +
          '. Value should be string.'
      );
    }
  } else {
    throw new Error(collection[0] + 'does not contain name key.');
  }
}

/**
 * Validate the structure of the array
 * It must be formatted as list of values
 * @param {Array} collection Array of object (e.g. ['36', 'Black'])
 */
function _validateOptionsArray(options) {
  if (Array.isArray(options) && typeof options[0] === 'object') {
    throw new Error(options + 'is not a valid array of options.');
  }
}

var selectors$11 = {
  idInput: '[name="id"]',
  optionInput: '[name^="options"]',
  quantityInput: '[name="quantity"]',
  propertyInput: '[name^="properties"]'
};

// Public Methods
// -----------------------------------------------------------------------------

/**
 * Returns a URL with a variant ID query parameter. Useful for updating window.history
 * with a new URL based on the currently select product variant.
 * @param {string} url - The URL you wish to append the variant ID to
 * @param {number} id  - The variant ID you wish to append to the URL
 * @returns {string} - The new url which includes the variant ID query parameter
 */



/**
 * Constructor class that creates a new instance of a product form controller.
 *
 * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
 * @param {Object} product - A product object
 * @param {Object} options - Optional options object
 * @param {Function} options.onOptionChange - Callback for whenever an option input changes
 * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
 * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
 * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
 */
function ProductForm$1(element, product, options) {
  this.element = element;
  this.product = _validateProductObject(product);

  options = options || {};

  this._listeners = new Listeners();
  this._listeners.add(
    this.element,
    'submit',
    this._onSubmit.bind(this, options)
  );

  this.optionInputs = this._initInputs(
    selectors$11.optionInput,
    options.onOptionChange
  );

  this.quantityInputs = this._initInputs(
    selectors$11.quantityInput,
    options.onQuantityChange
  );

  this.propertyInputs = this._initInputs(
    selectors$11.propertyInput,
    options.onPropertyChange
  );
}

/**
 * Cleans up all event handlers that were assigned when the Product Form was constructed.
 * Useful for use when a section needs to be reloaded in the theme editor.
 */
ProductForm$1.prototype.destroy = function() {
  this._listeners.removeAll();
};

/**
 * Getter method which returns the array of currently selected option values
 *
 * @returns {Array} An array of option values
 */
ProductForm$1.prototype.options = function() {
  return _serializeOptionValues(this.optionInputs, function(item) {
    var regex = /(?:^(options\[))(.*?)(?:\])/;
    item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
    return item;
  });
};

/**
 * Getter method which returns the currently selected variant, or `null` if variant
 * doesn't exist.
 *
 * @returns {Object|null} Variant object
 */
ProductForm$1.prototype.variant = function() {
  return getVariantFromSerializedArray(this.product, this.options());
};

/**
 * Getter method which returns a collection of objects containing name and values
 * of property inputs
 *
 * @returns {Array} Collection of objects with name and value keys
 */
ProductForm$1.prototype.properties = function() {
  var properties = _serializePropertyValues(this.propertyInputs, function(
    propertyName
  ) {
    var regex = /(?:^(properties\[))(.*?)(?:\])/;
    var name = regex.exec(propertyName)[2]; // Use just the value between 'properties[' and ']'
    return name;
  });

  return Object.entries(properties).length === 0 ? null : properties;
};

/**
 * Getter method which returns the current quantity or 1 if no quantity input is
 * included in the form
 *
 * @returns {Array} Collection of objects with name and value keys
 */
ProductForm$1.prototype.quantity = function() {
  return this.quantityInputs[0]
    ? Number.parseInt(this.quantityInputs[0].value, 10)
    : 1;
};

// Private Methods
// -----------------------------------------------------------------------------
ProductForm$1.prototype._setIdInputValue = function(value) {
  var idInputElement = this.element.querySelector(selectors$11.idInput);

  if (!idInputElement) {
    idInputElement = document.createElement('input');
    idInputElement.type = 'hidden';
    idInputElement.name = 'id';
    this.element.appendChild(idInputElement);
  }

  idInputElement.value = value.toString();
};

ProductForm$1.prototype._onSubmit = function(options, event) {
  event.dataset = this._getProductFormEventData();

  if (event.dataset.variant) {
    this._setIdInputValue(event.dataset.variant.id);
  }

  if (options.onFormSubmit) {
    options.onFormSubmit(event);
  }
};

ProductForm$1.prototype._onFormEvent = function(cb) {
  if (typeof cb === 'undefined') {
    return Function.prototype;
  }

  return function(event) {
    event.dataset = this._getProductFormEventData();
    cb(event);
  }.bind(this);
};

ProductForm$1.prototype._initInputs = function(selector, cb) {
  var elements = Array.prototype.slice.call(
    this.element.querySelectorAll(selector)
  );

  return elements.map(
    function(element) {
      this._listeners.add(element, 'change', this._onFormEvent(cb));
      return element;
    }.bind(this)
  );
};

ProductForm$1.prototype._getProductFormEventData = function() {
  return {
    options: this.options(),
    variant: this.variant(),
    properties: this.properties(),
    quantity: this.quantity()
  };
};

function _serializeOptionValues(inputs, transform) {
  return inputs.reduce(function(options, input) {
    if (
      input.checked || // If input is a checked (means type radio or checkbox)
      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
    ) {
      options.push(transform({ name: input.name, value: input.value }));
    }

    return options;
  }, []);
}

function _serializePropertyValues(inputs, transform) {
  return inputs.reduce(function(properties, input) {
    if (
      input.checked || // If input is a checked (means type radio or checkbox)
      (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
    ) {
      properties[transform(input.name)] = input.value;
    }

    return properties;
  }, {});
}

function _validateProductObject(product) {
  if (typeof product !== 'object') {
    throw new TypeError(product + ' is not an object.');
  }

  if (typeof product.variants[0].options === 'undefined') {
    throw new TypeError(
      'Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route'
    );
  }

  return product;
}

const attributes$1 = {
  dataQuantitySelectorIncrease: 'data-quantity-selector-increase',
};

const selectors$10 = {
  addToCart: '[data-add-to-cart]',
  addToCartText: '[data-add-to-cart-text]',
  cartCountBubble: '[data-cart-count-bubble]',
  cartCount: '[data-cart-count]',
  cartPriceBubble: '[data-cart-price-bubble]',
  errorMessageWrapper: '[data-error-message-wrapper]',
  errorMessage: '[data-error-message]',
  price: '[data-price]',
  productForm: '[data-product-form]',
  productJSON: '[data-product-json]',
  productMasterSelect: '[data-product-master-select]',
  productPolicies: '[data-product-policies]',
  regularPrice: '[data-regular-price]',
  productSuccessMessage: '[data-product-success-message]',
  productStatus: '[data-product-status]',
  salePrice: '[data-sale-price]',
  unitPrice: '[data-unit-price]',
  unitPriceBaseUnit: '[data-unit-price-base-unit]',
  quantityInput: '[data-quantity-input]',
  quantityInputWrapper: '[data-quantity-input-wrapper]',
  quantitySelectors: '[data-quantity-selector]',
  quantitySelectorIncrease: '[data-quantity-selector-increase]',
};

const classes$9 = {
  hidden: 'hidden',
  formInputError: 'form__input-wrapper--error',
  productOnSale: 'price--on-sale',
  productSoldOut: 'price--sold-out',
  productUnitAvailable: 'price--unit-available',
  productUnavailable: 'price--unavailable',
  visuallyHidden: 'visually-hidden',
};

class ProductForm$$1 {
  constructor(container) {
    this.elements = { container };
  }

  init() {
    this.eventHandlers = {};
    Object.assign(this.elements, this._getElements());

    if (!this.elements.productForm) return;

    this.productId = this.elements.productForm.dataset.productId;

    if (this.elements.productJSON) {
      const productJSON = JSON.parse(this.elements.productJSON.innerHTML);
      this._initProductForm(productJSON);
    } else {
      this._getProductJSON(this.elements.productForm.dataset.productHandle)
        .then((product) => {
          this._initProductForm(product);
        })
        .catch((error) => {
          throw new Error(error);
        });
    }
  }

  destroy() {
    const hasQuantitySelector = Boolean(
      this.elements.container.dataset.showQuantitySelector
    );

    if (!hasQuantitySelector) return;

    this.elements.quantitySelectors.forEach((quantitySelector) => {
      quantitySelector.removeEventListener(
        'click',
        this.eventHandlers.onQuantitySelectorClick
      );
    });

    if (!this.hasInstantQuantity) return;

    this.elements.quantityInput.removeEventListener(
      'input',
      this.eventHandlers.onQuantityInputTextChanged
    );

    this.elements.quantityInput.removeEventListener(
      'removedFromCart',
      this.eventHandlers.onProductRemovedFromCart
    );
  }

  _hideInstantQuantity() {
    if (!this.hasInstantQuantity || !this.elements.quantityInputWrapper) return;

    this.elements.quantityInput.value = 1;

    this._hideErrorMessage();

    this.elements.quantityInputWrapper.classList.add(classes$9.hidden);
    this.elements.addToCart.classList.remove(classes$9.hidden);
    this.elements.addToCart.focus();
  }

  _initProductForm(product) {
    this.productForm = new ProductForm$1(
      this.elements.productForm,
      product,
      {
        onOptionChange: this._onFormOptionChange.bind(this),
        onFormSubmit: this._onFormSubmit.bind(this),
        onQuantityChange: this._onQuantityChange.bind(this),
      }
    );
    this._setupEventListeners();
  }

  _getElements() {
    return {
      addToCart: this.elements.container.querySelector(selectors$10.addToCart),
      addToCartText: this.elements.container.querySelector(selectors$10.addToCart),
      cartPriceBubble: document.querySelector(selectors$10.cartPriceBubble),
      errorMessageWrapper: this.elements.container.querySelector(
        selectors$10.errorMessageWrapper
      ),
      errorMessageElement: this.elements.container.querySelector(
        selectors$10.errorMessage
      ),
      masterSelect: this.elements.container.querySelector(
        selectors$10.productMasterSelect
      ),
      productForm: this.elements.container.querySelector(selectors$10.productForm),
      productJSON: this.elements.container.querySelector(selectors$10.productJSON),
      productPolicies: this.elements.container.querySelector(
        selectors$10.productPolicies
      ),
      productStatus: this.elements.container.querySelector(
        selectors$10.productStatus
      ),
      priceContainer: this.elements.container.querySelector(selectors$10.price),
      regularPrice: this.elements.container.querySelectorAll(
        selectors$10.regularPrice
      ),
      salePrice: this.elements.container.querySelector(selectors$10.salePrice),
      successMessage: this.elements.container.querySelector(
        selectors$10.productSuccessMessage
      ),
      quantityInputWrapper: this.elements.container.querySelector(
        selectors$10.quantityInputWrapper
      ),
      quantityInput: this.elements.container.querySelector(
        selectors$10.quantityInput
      ),
      quantitySelectors: this.elements.container.querySelectorAll(
        selectors$10.quantitySelectors
      ),
      quantitySelectorIncrease: this.elements.container.querySelector(
        selectors$10.quantitySelectorIncrease
      ),
      unitPrice: this.elements.container.querySelector(selectors$10.unitPrice),
      unitPriceBaseUnit: this.elements.container.querySelector(
        selectors$10.unitPriceBaseUnit
      ),
    };
  }

  _getEventHandlers() {
    return {
      onProductRemovedFromCart: this._hideInstantQuantity.bind(this),
      onQuantitySelectorClick: this._onQuantitySelectorClick.bind(this),
      onQuantityInputTextChanged: debounce(() => {
        this._updateCartQuantity();
      }, 1000),
    };
  }

  _setupEventListeners() {
    if (!this.elements.container.dataset.showQuantitySelector) return;

    this.eventHandlers = this._getEventHandlers();

    this.hasInstantQuantity = Boolean(
      this.elements.quantityInputWrapper.dataset.quantityInputInstant
    );

    this.elements.quantitySelectors.forEach((quantitySelector) => {
      quantitySelector.addEventListener(
        'click',
        this.eventHandlers.onQuantitySelectorClick
      );
    });

    if (!this.hasInstantQuantity) return;

    this.elements.quantityInput.addEventListener(
      'input',
      this.eventHandlers.onQuantityInputTextChanged
    );

    this.elements.quantityInput.addEventListener(
      'removedFromCart',
      this.eventHandlers.onProductRemovedFromCart
    );
  }

  _getProductJSON(handle) {
    const themeRoot = theme.rootUrl === '/' ? '' : theme.rootUrl;

    return window
      .fetch(`${themeRoot}/products/${handle}.js`)
      .then((response) => {
        return response.json();
      });
  }

  _onFormSubmit(event) {
    event.preventDefault();

    // we need the LIVE addToCart element here
    const addToCart = this.elements.container.querySelector(
      selectors$10.addToCart
    );

    if (addToCart.hasAttribute('aria-disabled')) return;

    if (this._quantityIsInvalid()) return;

    this._addItemToCart();
  }

  _quantityIsInvalid() {
    if (
      this.elements.quantityInput &&
      (parseInt(this.elements.quantityInput.value, 10) <= 0 ||
        this.elements.quantityInput.value === '')
    ) {
      this._showErrorMessage(theme.strings.quantityMinimumMessage);
      return true;
    }

    return false;
  }

  _showInstantQuantity(result) {
    if (!this.hasInstantQuantity || !this.elements.quantityInputWrapper) return;

    this.elements.quantityInput.dataset.quantityInputKey = result.key;
    this.elements.quantityInput.value = result.quantity;

    this.elements.addToCart.classList.add(classes$9.hidden);
    this.elements.quantityInputWrapper.classList.remove(classes$9.hidden);

    if (!this.elements.quantityInput) return;
    this.elements.quantityInput.focus();
  }

  _addItemToCart() {
    this._hideErrorMessage();
    this._toggleSuccessMessage(true);

    addItemFromForm(this.elements.productForm)
      .then((result) => {
        this._toggleSuccessMessage(false, this._getSuccessMessage());
        this._showInstantQuantity(result);
        if (!window.carts.length) this._onCartUpdated();
        this.isUpdatingCart = false;

        document.dispatchEvent(new CustomEvent('productAddedToCart'));

        window.carts.forEach((cart) => {
          cart.onCartUpdated(this.productId);
        });

        theme.cartQuantity.updateQuantityInputElements(
          result.key,
          result.quantity
        );
        const liveRegionText = this._getQuantityUpdatedText(
          result.quantity,
          true
        );
        this._updateLiveRegion(liveRegionText);
      })
      .catch((error) => {
        this._handleProductError(error);
        this.isUpdatingCart = false;
      });
  }

  _getSuccessMessage() {
    const quantity = this.elements.quantityInput
      ? this.elements.quantityInput.value
      : 1;

    return parseInt(quantity, 10) > 1
      ? theme.strings.itemAddedToCartMulti
      : theme.strings.itemAddedToCartSingle;
  }

  _toggleSuccessMessage(hideMessage, message = '') {
    if (!this.elements.successMessage) return;

    this.elements.successMessage.textContent = message;
    this.elements.successMessage.classList.toggle(classes$9.hidden, hideMessage);
  }

  _onCartUpdated() {
    getState()
      .then((cart) => {
        this._updateCartPriceBubble(cart.total_price);
        this._updateCartCountBubble(cart.item_count);
        theme.cartQuantity.updateLocalCartState(cart, this.productId);
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  _updateCartPriceBubble(price) {
    if (!this.elements.cartPriceBubble) return;

    this.elements.cartPriceBubble.innerText = this._formatMoney(price);
  }

  _updateCartCountBubble(itemCount) {
    this.cartCountBubbles =
      this.cartCountBubbles ||
      document.querySelectorAll(selectors$10.cartCountBubble);
    this.cartCounts =
      this.cartCounts || document.querySelectorAll(selectors$10.cartCount);

    this.cartCounts.forEach(
      (cartCount) => (cartCount.innerText = itemCount > 99 ? '99+' : itemCount)
    );
    this.cartCountBubbles.forEach((countBubble) =>
      countBubble.classList.toggle(classes$9.hidden, itemCount === 0)
    );
  }

  _handleProductError(error) {
    error
      .json()
      .then((message) => {
        const errorMessage = message.description
          ? message.description
          : theme.strings.cartError;

        this._showErrorMessage(errorMessage);
      })
      .catch((message) => {
        throw message;
      });
  }

  _getQuantityErrorMessage(item) {
    const errorMessage = theme.strings.quantityError;

    return errorMessage
      .replace('[quantity]', item.quantity)
      .replace('[title]', item.title);
  }

  _showErrorMessage(errorMessage) {
    if (
      !this.elements.errorMessageElement ||
      !this.elements.errorMessageWrapper
    )
      return;

    this.elements.errorMessageElement.innerHTML = errorMessage;
    this.elements.errorMessageWrapper.classList.remove(classes$9.hidden);
    this.elements.errorMessageWrapper.setAttribute('aria-hidden', true);
    this.elements.errorMessageWrapper.removeAttribute('aria-hidden');

    if (!this.elements.quantityInputWrapper || this.hasInstantQuantity) return;
    this.elements.quantityInputWrapper.classList.add(classes$9.formInputError);
  }

  _hideErrorMessage() {
    if (!this.elements.errorMessageWrapper) return;

    this.elements.errorMessageWrapper.classList.add(classes$9.hidden);

    if (!this.elements.quantityInputWrapper || this.hasInstantQuantity) return;

    this.elements.quantityInputWrapper.classList.remove(classes$9.formInputError);
  }

  _onFormOptionChange(event) {
    const variant = event.dataset.variant;

    this._updateMasterSelect(variant);
    this._hideErrorMessage();
    this._toggleSuccessMessage(true);
    this._updatePrice(variant);
    this._updateProductPolicies(variant);
    this._updateAddToCart(variant);
    this._updateVariantName(variant);
    this._hideInstantQuantity();

    const liveRegionText = this._getVariantUpdatedText(variant);
    this._updateLiveRegion(liveRegionText);

    this._fireEvent('formOptionChanged', { variant });
  }

  _fireEvent(eventName, data) {
    this.elements.container.dispatchEvent(
      new window.CustomEvent(eventName, {
        detail: data,
      })
    );
  }

  _updateVariantName(variant) {
    if (!variant || !variant.name) return;

    this.elements.productForm.dataset.variantName = variant.name;
  }

  _updateMasterSelect(variant) {
    if (!variant || !this.elements.masterSelect) return;

    this.elements.masterSelect.value = variant.id;
  }

  _onQuantityChange() {
    this._hideErrorMessage();
    this._toggleSuccessMessage(true);
  }

  _calculateNewInputQuantity(currentQuantity, isIncrement) {
    const minimum = this.hasInstantQuantity ? 0 : 1;
    const result = isIncrement ? currentQuantity + 1 : currentQuantity - 1;

    return Math.max(minimum, result);
  }

  _onQuantitySelectorClick(event) {
    if (this.isUpdatingCart) return;

    this._hideErrorMessage();

    const isIncrement = event.currentTarget.hasAttribute(
      attributes$1.dataQuantitySelectorIncrease
    );

    const quantityInput = this.elements.container.querySelector(
      selectors$10.quantityInput
    );
    const currentQuantity = parseInt(quantityInput.value, 10);

    const newQuantity = this._calculateNewInputQuantity(
      currentQuantity,
      isIncrement
    );

    quantityInput.value = newQuantity;

    if (this.hasInstantQuantity) {
      clearTimeout(this.timeout);

      this.timeout = setTimeout(() => {
        this.isUpdatingCart = true;
        this._updateCartQuantity();
      }, 500);
    }
  }

  _updateCartQuantity() {
    const cartKey = this.elements.quantityInput.dataset.quantityInputKey;
    if (!cartKey) return;
    const [variantId] = cartKey.split(':');

    const newQuantity = parseInt(this.elements.quantityInput.value, 10);

    updateItem(cartKey, { quantity: newQuantity }).then((state) => {
      this.isUpdatingCart = false;
      if (!window.carts.length) this._onCartUpdated();

      window.carts.forEach((cart) => {
        cart.onCartUpdated(this.productId);
      });
      theme.cartQuantity.updateQuantityInputElements(cartKey, newQuantity);

      const liveRegionText = this._getQuantityUpdatedText(newQuantity);
      this._updateLiveRegion(liveRegionText);
      document.dispatchEvent(new CustomEvent('productAddedToCart'));

      const updatedItem = state.items.find((item) => item.key === cartKey);

      const totalQuantity = state.items.reduce((total, currentItem) => {
        return currentItem.id === Number(variantId)
          ? total + currentItem.quantity
          : total;
      }, 0);

      if (newQuantity > totalQuantity) {
        this.elements.quantityInput.value = totalQuantity;
        this.elements.quantityInput.focus();
        this._showErrorMessage(this._getQuantityErrorMessage(updatedItem));
      }

      if (newQuantity) return;
      this._hideInstantQuantity();
    });
  }

  _updatePrice(variant) {
    if (!this.elements.priceContainer) return;

    this.elements.priceContainer.classList.remove(
      classes$9.productUnavailable,
      classes$9.productOnSale,
      classes$9.productUnitAvailable,
      classes$9.productSoldOut
    );

    this.elements.priceContainer.removeAttribute('aria-hidden');
    // product unavailable
    if (!variant) {
      this.elements.priceContainer.classList.add(classes$9.productUnavailable);
      this.elements.priceContainer.setAttribute('aria-hidden', true);
      return;
    }
    // sold out
    if (!variant.available) {
      this.elements.priceContainer.classList.add(classes$9.productSoldOut);
    }
    // on sale
    if (variant.compare_at_price > variant.price) {
      this._renderOnSalePrice(variant);
    } else {
      this._renderRegularPrice(variant);
    }
    this._updateUnitPrice(variant);
  }

  _renderOnSalePrice(variant) {
    this.elements.regularPrice.forEach((price) => {
      price.innerText = this._formatMoney(variant.compare_at_price);
    });

    if (!this.elements.salePrice) return;
    this.elements.salePrice.innerText = this._formatMoney(variant.price);
    this.elements.priceContainer.classList.add(classes$9.productOnSale);
  }

  _renderRegularPrice(variant) {
    this.elements.regularPrice.forEach((price) => {
      price.innerText = this._formatMoney(variant.price);
    });
  }

  _updateUnitPrice(variant) {
    if (
      !variant.unit_price ||
      !this.elements.unitPrice ||
      !this.elements.unitPriceBaseUnit
    )
      return;

    this.elements.unitPrice.innerText = this._formatMoney(
      variant.unit_price,
      theme.moneyFormat
    );
    this.elements.unitPriceBaseUnit.innerText = this._getBaseUnit(variant);
    this.elements.priceContainer.classList.add(classes$9.productUnitAvailable);
  }

  _getBaseUnit(variant) {
    return variant.unit_price_measurement.reference_value === 1
      ? variant.unit_price_measurement.reference_unit
      : variant.unit_price_measurement.reference_value +
          variant.unit_price_measurement.reference_unit;
  }

  _updateProductPolicies(variant) {
    if (!this.elements.productPolicies) return;

    this.elements.productPolicies.classList.remove(classes$9.visuallyHidden);

    if (variant) return;

    this.elements.productPolicies.classList.add(classes$9.visuallyHidden);
  }

  _updateAddToCart(variant) {
    if (!this.elements.addToCart || !this.elements.addToCartText) return;

    if (!variant) {
      this.elements.addToCart.setAttribute('aria-disabled', true);
      this.elements.addToCart.setAttribute(
        'aria-label',
        theme.strings.unavailable
      );
      this.elements.addToCartText.innerText = theme.strings.unavailable;
    } else if (variant.available) {
      this.elements.addToCart.removeAttribute('aria-disabled');
      this.elements.addToCart.setAttribute(
        'aria-label',
        theme.strings.addToCart
      );
      this.elements.addToCartText.innerText = theme.strings.addToCart;
    } else {
      this.elements.addToCart.setAttribute('aria-disabled', true);
      this.elements.addToCart.setAttribute('aria-label', theme.strings.soldOut);
      this.elements.addToCartText.innerText = theme.strings.soldOut;
    }
  }

  _updateLiveRegion(text) {
    if (!this.elements.productStatus) return;

    this.elements.productStatus.innerText = text;
    this.elements.productStatus.setAttribute('aria-hidden', false);

    // hide content from accessibility tree after announcement
    setTimeout(() => {
      this.elements.productStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  _formatMoney(price) {
    return formatMoney(price, theme.moneyFormat);
  }

  _getQuantityUpdatedText(quantity, isAddToCart) {
    let liveMessage = theme.strings.productUpdatedOnCart.replace(
      '[quantity]',
      quantity
    );

    if (quantity === 0) liveMessage = theme.strings.productRemovedFromCart;
    else if (quantity === 1 && isAddToCart)
      liveMessage = theme.strings.productAddedToCart;

    return liveMessage.replace(
      '[title]',
      this.elements.productForm.dataset.variantName
    );
  }

  _getVariantUpdatedText(variant) {
    if (!variant) return theme.strings.unavailable;

    const isOnSale = variant.compare_at_price > variant.price;

    const availability = variant.available ? '' : theme.strings.soldOut;

    let regularPriceLabel = '';
    let regularPrice = this._formatMoney(variant.price);

    let salePriceLabel = '';
    let salePrice = '';

    let unitPriceLabel = '';
    let unitPrice = '';

    if (isOnSale) {
      regularPriceLabel = theme.strings.regularPrice;
      regularPrice = this._formatMoney(variant.compare_at_price);

      salePriceLabel = theme.strings.salePrice;
      salePrice = this._formatMoney(variant.price);
    }

    if (variant.unit_price) {
      unitPriceLabel = theme.strings.unitPrice;
      unitPrice = `${this._formatMoney(variant.unit_price)} ${
        theme.strings.unitPriceSeparator
      } ${this._getBaseUnit(variant)}`;
    }

    return `${availability} ${regularPriceLabel} ${regularPrice} ${salePriceLabel} ${salePrice} ${unitPriceLabel} ${unitPrice}`;
  }
}

const selectors$8 = {
  productForm: '[data-product-form]',
  media: '[data-media]',
  singleMedia: '[data-media-image]',
};

class Product {
  constructor(container) {
    this.container = container;

    this._prepareGallery();

    const productFormElement = this.container.querySelector(
      selectors$8.productForm
    );

    if (!productFormElement) return;
    this._setupEventListeners();
    this.productForm = new ProductForm$$1(this.container);
    this.productForm.init();
  }

  destroy() {
    if (this.productForm) this.productForm.destroy();

    this.container.removeEventListener(
      'formOptionChanged',
      this.eventHandlers.onFormOptionChange
    );

    const hasGallery = Boolean(this.gallery);
    if (!hasGallery) return;

    this.gallery.destroy();
  }

  _getEventHandlers() {
    return {
      onFormOptionChange: this._onFormOptionChange.bind(this),
    };
  }

  _setupEventListeners() {
    this.eventHandlers = this._getEventHandlers();

    this.container.addEventListener(
      'formOptionChanged',
      this.eventHandlers.onFormOptionChange
    );
  }

  _prepareGallery() {
    this.galleryElement = this.container.querySelector(selectors$8.media);
    if (!this.galleryElement) return;

    if (this.container.dataset.mediaType === 'gallery') {
      this._initializeGallery();
      return;
    }

    this._addGalleryMediaQueryListener();

    if (this.galleryMediaQueryListener.matches) {
      this._initializeGallery();
      this.gallery.addAccessibilityAttr();
      return;
    }

    this._loadAllGalleryImages();
  }

  _addGalleryMediaQueryListener() {
    this.galleryMediaQueryListener = window.matchMedia(
      getMediaQueryString('large', 'max')
    );

    this.galleryMediaQueryListener.addListener((event) => {
      if (event.matches) {
        this._switchToGalleryMode();
        return;
      }

      this._switchToStackedMode();
    });
  }

  _switchToGalleryMode() {
    const galleryWasJustInitialized = this._initializeGallery();
    this.gallery.state.useAriaHidden = true;
    this.gallery.hideMedia();
    this.gallery.addAccessibilityAttr();

    if (galleryWasJustInitialized) return;

    this.gallery.bindEvents();
  }

  _switchToStackedMode() {
    this._loadAllGalleryImages();
    this.gallery.removeAccessibilityAttr();
    this.gallery.resetTransformation();
    this.gallery.state.useAriaHidden = false;
    this.gallery.destroy();
  }

  _initializeGallery() {
    if (this.gallery) {
      this.gallery.applyTransformation();
      window.setTimeout(() => this.gallery.enableTransition());
      return false;
    }

    this.gallery = new Gallery(this.galleryElement);
    this.gallery.init();
    return true;
  }

  _loadAllGalleryImages() {
    const images = this.container.querySelectorAll(selectors$8.singleMedia);

    images.forEach((image) => {
      if (!image.getAttribute('src')) {
        image.setAttribute('src', image.getAttribute('data-src'));
      }

      if (!image.getAttribute('srcset')) {
        image.setAttribute('srcset', image.getAttribute('data-srcset'));
      }

      // eslint-disable-next-line no-self-assign
      image.outerHTML = image.outerHTML;
    });

    if (this.gallery) {
      this.gallery.elements.images = Array.from(
        this.gallery.elements.container.querySelectorAll(selectors$8.singleMedia)
      );
    }
  }

  _onFormOptionChange(event) {
    const variant = event.detail.variant;

    if (!variant) return;

    if (!variant.featured_media || !this.gallery) return;
    this.gallery.variantMediaSwitch(variant.featured_media.id);

    if (this.galleryMediaQueryListener) {
      if (this.galleryMediaQueryListener.matches) return;

      this.gallery.resetTransformation();
    }
  }
}

sections.register('product', {
  onLoad() {
    this.product = new Product(this.container);
  },

  onUnload() {
    this.product.destroy();
  },
});

// eslint-disable-next-line import/no-cycle
const selectors$14 = {
  productCollectionTitle: '[data-product-collection-title]',
  productImage: '[data-media-image]',
  productRecommendationsContainer: '[product-recommendations-container]',
  productTemplate: '[data-product-template]',
  productViewCartLink: '[data-product-view-cart-link]',
  productCollectionTitleWrapper: '[data-product-collection-title-wrapper]',
};

const classes$11 = {
  hidden: 'hidden',
  isOpen: 'is-open',
  productModalContentNoMedia: 'product-modal__content--no-media',
};

class ProductModal {
  constructor(productContainer, productModalContent, collectionTitle) {
    this.elements = { productContainer, productModalContent };
    this.collectionTitle = collectionTitle || '';
  }

  init() {
    this.eventHandlers = this._getEventHandlers();
  }

  setupProductModal(productUrl) {
    this._getProductModalContent(productUrl)
      .then((productTemplate) => {
        this._setupProductModalContent(productTemplate);
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  _getEventHandlers() {
    return {
      hideModalShowCart: this._hideModalShowCart.bind(this),
      hideProductModal: this._hideProductModal.bind(this),
    };
  }

  _setupEventHandlers() {
    this.elements.productContainer.addEventListener(
      'popup_closed',
      this.eventHandlers.hideProductModal
    );

    this.elements.viewCart = this.elements.productModalContent.querySelector(
      selectors$14.productViewCartLink
    );

    if (!this.elements.viewCart) return;

    this.elements.viewCart.addEventListener(
      'click',
      this.eventHandlers.hideModalShowCart
    );
  }

  _updateSPRReviews() {
    if (!window.SPR) return;

    if (window.SPR.initDomEls && window.SPR.loadProducts) {
      window.SPR.initDomEls();
      window.SPR.loadProducts();
    }
  }

  _getProductModalContent(productUrl) {
    return fetch(productUrl)
      .then((response) => response.text())
      .then((text) => {
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
      })
      .then((productHtml) => {
        return productHtml;
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  _setupProductModalContent(productTemplate) {
    this.elements.productModalContent.innerHTML = '';
    this.elements.productModalContent.scrollTo(0, 0);

    const productRecommendationsContainer = productTemplate.querySelector(
      selectors$14.productRecommendationsContainer
    );

    const productSection = this._getProductSection(productTemplate);

    if (!this._productHasMedia(productTemplate))
      this.elements.productModalContent.classList.add(
        classes$11.productModalContentNoMedia
      );

    this.elements.productModalContent.appendChild(productSection);

    if (productRecommendationsContainer) {
      this._getProductRecommendations(productRecommendationsContainer)
        .then((productRecommendationsSection) => {
          this.elements.productModalContent.appendChild(
            productRecommendationsSection
          );

          this.productRecommendations.resetSafariImages();

          this.productPopup =
            this.productPopup ||
            window.popups.find((popup) => popup.name === 'product-modal');

          this.productPopup.resetContainerFocus();
        })
        .catch((error) => {
          throw new Error(error);
        });
    }

    // to make srcset work on Safari, we need to reinsert the images
    this.elements.productModalContent
      .querySelectorAll(selectors$14.productImage)
      /* eslint-disable-next-line no-self-assign */
      .forEach((image) => (image.outerHTML = image.outerHTML));

    this._showProductModal(productSection);
    this._updateSPRReviews();
    this._setupEventHandlers();
  }

  _getProductSection(productTemplate) {
    const productSection = productTemplate.querySelector(
      selectors$14.productTemplate
    );
    const productCollectionTitles = productSection.querySelectorAll(
      selectors$14.productCollectionTitle
    );

    const collectionTitleWrappers = productSection.querySelectorAll(
      selectors$14.productCollectionTitleWrapper
    );

    collectionTitleWrappers.forEach((titleWrapper) =>
      titleWrapper.classList.toggle(classes$11.hidden, this.collectionTitle === '')
    );

    productCollectionTitles.forEach((productCollectionTitle) => {
      productCollectionTitle.textContent = this.collectionTitle;
    });

    return productSection;
  }

  _getProductRecommendations(productRecommendationsContainer) {
    this.productRecommendations = new ProductRecommendations(
      productRecommendationsContainer
    );
    this.productRecommendations.init();

    return this.productRecommendations.setupAndGetHTML();
  }

  _productHasMedia(productTemplate) {
    return productTemplate.querySelectorAll(selectors$14.productImage).length;
  }

  _showProductModal(productTemplate) {
    this.product = new Product(productTemplate);

    this.productPopup =
      this.productPopup ||
      window.popups.find((popup) => popup.name === 'product-modal');

    if (window.Shopify && Shopify.PaymentButton) {
      Shopify.PaymentButton.init();
    }

    if (this.productPopup.elements.stage.classList.contains(classes$11.isOpen))
      return;

    this.productPopup.openPopup({
      currentTarget: this.elements.productContainer,
    });
  }

  _hideModalShowCart(event) {
    event.preventDefault();

    this.cartPopup =
      this.cartPopup || window.popups.find((popup) => popup.name === 'cart');

    this.productPopup.closePopup();
    this.cartPopup.openPopup({
      currentTarget: this.productPopup.elements.triggerNode,
    });

    this._hideProductModal();

    if (!this.elements.viewCart) return;

    this.elements.viewCart.removeEventListener(
      'click',
      this.eventHandlers.hideModalShowCart
    );
  }

  _hideProductModal() {
    this.elements.productModalContent.innerHTML = '';
    this.elements.productModalContent.classList.remove(
      classes$11.productModalContentNoMedia
    );
    this.product.destroy();

    this.elements.productContainer.removeEventListener(
      'popup_closed',
      this.eventHandlers.hideProductModal
    );
  }
}

// eslint-disable-next-line import/no-cycle
const selectors$13 = {
  productCardLink: '[data-product-card-link]',
  productForm: '[data-product-form]',
  productOption: '[data-product-option]',
  showOptionsButton: '[data-show-options-button]',
};

const classes$10 = {
  hidden: 'hidden',
  productCardFormExpanded: 'product-card--form-expanded',
};

class ProductCard {
  constructor(productCard, productModalContent, collectionTitle) {
    this.elements = { productCard, productModalContent };
    this.collectionTitle = collectionTitle;
  }

  init() {
    Object.assign(this.elements, this._getElements());
    this._setupEventHandlers();

    this.productModal = new ProductModal(
      this.elements.productCard,
      this.elements.productModalContent,
      this.collectionTitle
    );
    this.productModal.init();

    if (!this.elements.productForm) return;

    this.productForm = new ProductForm$$1(this.elements.productCard);
    this.productForm.init();
  }

  _getElements() {
    return {
      productCardLinks: this.elements.productCard.querySelectorAll(
        selectors$13.productCardLink
      ),
      productForm: this.elements.productCard.querySelector(
        selectors$13.productForm
      ),
      showOptionsButton: this.elements.productCard.querySelector(
        selectors$13.showOptionsButton
      ),
    };
  }

  _getEventHandlers() {
    return {
      onProductLinkClick: this._onProductLinkClick.bind(this),
    };
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    if (this.elements.showOptionsButton) {
      this.elements.showOptionsButton.addEventListener('click', () => {
        this._toggleShowOptions(true);
      });

      this.elements.productCard.addEventListener('mouseleave', (event) => {
        if (!event.relatedTarget) return;
        this._toggleShowOptions(false);
      });

      this.elements.productCard.addEventListener('focusout', (event) => {
        if (
          !event.relatedTarget ||
          this.elements.productCard.contains(event.relatedTarget)
        )
          return;

        this._toggleShowOptions(false);
      });
    }

    if (!this.elements.productCardLinks || !this.elements.productModalContent)
      return;

    this.elements.productCardLinks.forEach((productCardLink) =>
      productCardLink.addEventListener(
        'click',
        this.eventHandlers.onProductLinkClick
      )
    );
  }

  _toggleShowOptions(show) {
    this.elements.productCard.classList.toggle(
      classes$10.productCardFormExpanded,
      show
    );
    this.elements.showOptionsButton.classList.toggle(classes$10.hidden, show);

    if (!show) return;

    const firstOption = this.elements.productForm.querySelector(
      selectors$13.productOption
    );
    if (!firstOption) return;

    firstOption.focus();
  }

  _onProductLinkClick(event) {
    event.preventDefault();

    const productUrl =
      event.currentTarget.href ||
      event.currentTarget.dataset.productCardLinkUrl;

    this.productModal.setupProductModal(productUrl);
  }
}

// eslint-disable-next-line import/no-cycle
const selectors$12 = {
  productCard: '[data-product-card]',
  productCardImage: '[data-product-card-image]',
  productModalContent: '[data-product-modal-content]',
  productRecommendations: '[data-product-recommendations]',
};

class ProductRecommendations {
  constructor(container, setupRecommendationsOnInit = false) {
    this.elements = { container };
    this.setupRecommendationsOnInit = setupRecommendationsOnInit;
    this.recommendationsLoaded = false;
    this.isProductModalEnabled = Boolean(
      this.elements.container.dataset.productModal
    );
    this.isQuickAddEnabled = Boolean(this.elements.container.dataset.quickAdd);
  }

  init() {
    Object.assign(this.elements, this._getElements());

    if (this.setupRecommendationsOnInit) {
      this._setupProductRecommendations();
    }
  }

  setupAndGetHTML() {
    return new Promise((resolve, reject) => {
      this._getProductRecommendationsHTML()
        .then((productRecommendationsHtml) => {
          this._showProductRecommendations(productRecommendationsHtml, false);

          if (this.recommendationsLoaded) {
            resolve(this.elements.container);
          } else {
            const error = 'Product recommendations are not available';
            reject(error);
          }
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  }

  resetSafariImages() {
    const images = this.elements.container.querySelectorAll(
      selectors$12.productCardImage
    );

    // to make srcset work on Safari, we need to reinsert the images
    images
      /* eslint-disable-next-line no-self-assign */
      .forEach((image) => (image.outerHTML = image.outerHTML));
  }

  _getProductRecommendationsHTML() {
    const baseUrl = this.elements.container.dataset.baseUrl;
    const productId = this.elements.container.dataset.productId;
    const productRecommendationsUrl = `${baseUrl}?section_id=product-recommendations&product_id=${productId}&limit=4`;

    return fetch(productRecommendationsUrl)
      .then((response) => response.text())
      .then((text) => {
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  _showProductRecommendations(productRecommendationsHtml, resetImages = true) {
    const productRecommendations = productRecommendationsHtml.querySelector(
      selectors$12.productRecommendations
    );

    if (!productRecommendations) return;
    this.elements.container.appendChild(productRecommendations);

    this._setupProductCards();

    if (resetImages) {
      this.resetSafariImages();
    }

    this.recommendationsLoaded = true;
  }

  _getElements() {
    return {
      productModalContent: document.querySelector(
        selectors$12.productModalContent
      ),
    };
  }

  _setupProductRecommendations() {
    this._getProductRecommendationsHTML().then((productRecommendationsHtml) => {
      this._showProductRecommendations(productRecommendationsHtml);
    });
  }

  _setupProductCards() {
    theme.cartQuantity.updateQuantityIndicatorElements(
      false,
      this.elements.container
    );

    if (!this.isProductModalEnabled && !this.isQuickAddEnabled) return;

    const productCards = this.elements.container.querySelectorAll(
      selectors$12.productCard
    );

    productCards.forEach((cardElement) => {
      const productCard = new ProductCard(
        cardElement,
        this.elements.productModalContent,
        ''
      );

      productCard.init();
    });
  }
}

sections.register('product-recommendations', {
  onLoad() {
    this.productRecommendations = new ProductRecommendations(
      this.container,
      true
    );
    this.productRecommendations.init();
  },
});

const selectors$16 = {
  stickyElement: '[data-sticky-element]',
  stickySentinelTop: '[data-sticky-sentinel-top]',
  stickySentinelBottom: '[data-sticky-sentinel-bottom]',
};

const classes$13 = {
  stickyContainer: 'sticky__container',
  stickySentinel: 'sticky__sentinel',
  stickySentinelTop: 'sticky__sentinel--top',
  stickySentinelBottom: 'sticky__sentinel--bottom',
  stickyElement: 'sticky__element',
};

class StickyElement {
  constructor(container) {
    this.container = container;
  }

  init() {
    if (!isIntersectionObserverAvailable()) return;

    this.stickyElement = this.container.querySelector(selectors$16.stickyElement);
    if (!this.stickyElement) return;

    this.sticky = false;
    this._addSentinels();
    this._observeTopSentinel();
    this._observeBottomSentinel();
  }

  destroy() {
    if (this.topObserver) this.topObserver.disconnect();
    if (this.bottomObserver) this.bottomObserver.disconnect();
  }

  isSticky() {
    return this.sticky;
  }

  _fireEvent() {
    document.dispatchEvent(
      new window.CustomEvent('elementSticky', {
        detail: {
          stickyElement: this.stickyElement,
          isSticky: this.sticky,
          container: this.container,
        },
      })
    );
  }

  _addSentinels() {
    const sentinelTop = document.createElement('div');
    sentinelTop.classList.add(
      classes$13.stickySentinel,
      classes$13.stickySentinelTop
    );
    sentinelTop.dataset.stickySentinelTop = '';

    this.container.classList.add(classes$13.stickyContainer);

    this.stickyElement.insertAdjacentElement('beforebegin', sentinelTop);

    const sentinelBottom = document.createElement('div');
    sentinelBottom.classList.add(
      classes$13.stickySentinel,
      classes$13.stickySentinelBottom
    );
    sentinelBottom.dataset.stickySentinelBottom = '';

    this.stickyElement.parentElement.appendChild(sentinelBottom);
  }

  _observeTopSentinel() {
    const topSentinel = this.container.querySelector(
      selectors$16.stickySentinelTop
    );
    if (!topSentinel) return;

    this.topObserver = new IntersectionObserver((records) => {
      records.forEach((record) => {
        const targetInfo = record.boundingClientRect;
        const rootBoundsInfo = record.rootBounds;

        const startedSticking = targetInfo.bottom < rootBoundsInfo.top;
        const stoppedSticking =
          targetInfo.bottom >= rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom;

        if (startedSticking) {
          this.sticky = true;
          this.stickyElement.classList.add(classes$13.stickyElement);
          this._fireEvent();
        }

        if (stoppedSticking) {
          this.sticky = false;
          this.stickyElement.classList.remove(classes$13.stickyElement);
          this._fireEvent();
        }
      });
    });

    this.topObserver.observe(topSentinel);
  }

  _observeBottomSentinel() {
    const bottomSentinel = this.container.querySelector(
      selectors$16.stickySentinelBottom
    );
    if (!bottomSentinel) return;

    let previousY = 0;
    this.bottomObserver = new IntersectionObserver((records) => {
      records.forEach((record) => {
        const targetInfo = record.boundingClientRect;
        const rootBoundsInfo = record.rootBounds;
        const ratio = record.intersectionRatio;
        const scrollingDown = previousY > record.boundingClientRect.y;
        previousY = record.boundingClientRect.y;

        const startedSticking =
          targetInfo.bottom > rootBoundsInfo.top && ratio === 1;
        const stoppedSticking =
          targetInfo.top < rootBoundsInfo.top &&
          targetInfo.bottom < rootBoundsInfo.bottom;

        if (!scrollingDown && startedSticking) {
          this.sticky = true;
          this.stickyElement.classList.add(classes$13.stickyElement);
          this._fireEvent();
        }

        if (stoppedSticking) {
          this.sticky = false;
          this.stickyElement.classList.remove(classes$13.stickyElement);
          this._fireEvent();
        }
      });
    });

    this.bottomObserver.observe(bottomSentinel);
  }
}

const selectors$17 = {
  viewMoreButton: '[data-view-more-button]',
  viewMoreItem: '[data-view-more-item]',
  viewMoreStatus: '[data-view-more-status]',
};

const classes$14 = {
  hidden: 'hidden',
};

const events = {
  success: 'viewmore_loaded',
};

class ViewMore {
  constructor(container) {
    this.container = container;
  }

  init() {
    if (!this.container) return;

    this.viewMoreButton = this.container.querySelector(
      selectors$17.viewMoreButton
    );
    if (!this.viewMoreButton) return;

    this.maxCount = parseInt(this.viewMoreButton.dataset.viewMoreMax, 10);
    this.countPerPage = parseInt(this.viewMoreButton.dataset.viewMoreStep, 10);
    this.currentCount = parseInt(
      this.viewMoreButton.dataset.viewMoreCurrent,
      10
    );
    this.isLoading = false;
    this._setupEventHandlers();
  }

  _getEventHandlers() {
    return {
      onClickViewMoreHandler: this._onClickViewMoreHandler.bind(this),
    };
  }

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    this.viewMoreButton.addEventListener(
      'click',
      this.eventHandlers.onClickViewMoreHandler
    );
  }

  _onClickViewMoreHandler() {
    this._loadItems();
  }

  _getNextPage() {
    const nextPage = Math.floor(this.currentCount / this.countPerPage) + 1;
    const url = this.viewMoreButton.dataset.viewMoreNext.replace(
      '[pagination]',
      nextPage
    );

    return url;
  }

  _fireEvent(eventName, data) {
    this.container.dispatchEvent(
      new window.CustomEvent(eventName, {
        detail: data,
      })
    );
  }

  _loadItems() {
    if (this.isLoading || this.currentCount >= this.maxCount) return;

    const url = this._getNextPage();
    this.isLoading = true;
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
      })
      .then((html) => {
        const items = [...html.querySelectorAll(selectors$17.viewMoreItem)];

        if (this.currentCount < this.countPerPage) {
          items.splice(0, this.currentCount);
        }

        this.isLoading = false;
        this.currentCount += items.length;
        this._updateButton();
        this._updateLiveRegion();
        this._fireEvent(events.success, { items });
      })
      .then(() => {
        this._updateSPRBadges();
      })
      .catch((error) => {
        this.isLoading = false;
        throw new Error(error);
      });
  }

  _updateSPRBadges() {
    if (!window.SPR) return;

    if (window.SPR.initDomEls && window.SPR.loadBadges) {
      window.SPR.initDomEls();
      window.SPR.loadBadges();
    }
  }

  _updateButton() {
    this.viewMoreButton.dataset.viewMoreCurrent = this.currentCount;

    if (this.currentCount >= this.maxCount) {
      this.viewMoreButton.classList.add(classes$14.hidden);
    }
  }

  _updateLiveRegion() {
    const viewMoreStatus = this.container.querySelector(
      selectors$17.viewMoreStatus
    );
    const viewMoreStatusMessage = viewMoreStatus.dataset.viewMoreStatusMessage
      .replace('[item_count]', this.currentCount)
      .replace('[item_max]', this.maxCount);

    viewMoreStatus.innerText = viewMoreStatusMessage;
    viewMoreStatus.setAttribute('aria-hidden', false);

    // hide content from accessibility tree after announcement
    setTimeout(() => {
      viewMoreStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }
}

const selectors$15 = {
  scrollerContent: '[data-scroller-content]',
  featuredCollectionsTabs: '[data-featured-collections-tab]',
  featuredCollectionsSelectedTab: '[data-featured-collections-selected-tab]',
  featuredCollectionsTabsPanel: '[data-featured-collections-tab-panel]',
  featuredCollectionsWrapper: '[data-featured-collections-wrapper]',
  productCard: '[data-product-card]',
  productCardLink: '[data-product-card-link]',
  productModalContent: '[data-product-modal-content]',
  viewMoreContent: '[data-view-more-content]',
};

const classes$12 = {
  featuredCollectionsPanelActive: 'featured-collections__panel--active',
  featuredCollectionsPanelVisible: 'featured-collections__panel--visible',
  featuredCollectionsTabActive: 'featured-collections-tab__item--active',
};

sections.register('featured-collections', {
  onLoad() {
    this.elements = this._getElements();

    this.scroller = new Scroller(this.container);
    this.scroller.init();

    this.stickyNav = new StickyElement(this.container);
    this.stickyNav.init();

    this.isProductModalEnabled = Boolean(this.container.dataset.productModal);
    this.isQuickAddEnabled = Boolean(this.container.dataset.quickAdd);
    this.hasSingleCollection = Boolean(this.container.dataset.singleCollection);

    if (this.isProductModalEnabled) {
      this.elements.productModalContent = document.querySelector(
        selectors$15.productModalContent
      );
    }

    this._setupProductCards();
    this._setupEventHandlers();

    if (!theme.cartQuantity) return;

    theme.cartQuantity.updateQuantityIndicatorElements(false, this.container);
  },

  onUnload() {
    if (!this.elements.tabs) return;

    this.stickyNav.destroy();
    this.scroller.destroy();
    this.elements.tabs.forEach((tab) => {
      tab.removeEventListener('click', this.eventHandlers.onClickTabHandler);
      tab.removeEventListener(
        'keydown',
        this.eventHandlers.onKeyDownTabHandler
      );
    });
  },

  onBlockSelect(event) {
    if (this.hasSingleCollection) return;

    const selectedBlock = this.container.querySelector(
      `[data-featured-collections-block-id="${event}"]`
    );

    if (!selectedBlock) return;
    const selectedTab = selectedBlock.dataset.featuredCollectionsTabNumber;
    this.showCollectionPanel(selectedTab);
  },

  _getElements() {
    return {
      tabs: this.container.querySelectorAll(selectors$15.featuredCollectionsTabs),
      tabsPanel: this.container.querySelectorAll(
        selectors$15.featuredCollectionsTabsPanel
      ),
      tabsPanelWrapper: this.container.querySelector(
        selectors$15.featuredCollectionsWrapper
      ),
    };
  },

  _getEventHandlers() {
    return {
      onClickTabHandler: this.onClickTabHandler.bind(this),
      onKeyDownTabHandler: this.onKeyDownTabHandler.bind(this),
      onKeyUpTabHandler: this.onKeyUpTabHandler.bind(this),
      onViewMoreLoaded: this.onViewMoreLoaded.bind(this),
    };
  },

  _setupEventHandlers() {
    this.eventHandlers = this._getEventHandlers();

    this.elements.tabsPanel.forEach((tabPanel) => {
      if (!tabPanel.dataset.viewMore) return;

      const viewMore = new ViewMore(tabPanel);
      viewMore.init();
      tabPanel.addEventListener(
        'viewmore_loaded',
        this.eventHandlers.onViewMoreLoaded
      );
    });

    if (!this.elements.tabs || this.hasSingleCollection) return;

    this.elements.tabs.forEach((tab) => {
      tab.addEventListener('click', this.eventHandlers.onClickTabHandler);
      tab.addEventListener('keydown', this.eventHandlers.onKeyDownTabHandler);
      tab.addEventListener('keyup', this.eventHandlers.onKeyUpTabHandler);
    });
  },

  _setupProductCards() {
    if (!this.isProductModalEnabled && !this.isQuickAddEnabled) return;

    this.elements.tabsPanel.forEach((tabPanel) => {
      const productCards = tabPanel.querySelectorAll(selectors$15.productCard);
      const collectionTitle = tabPanel.dataset.collectionTitle;

      productCards.forEach((cardElement) => {
        const productCard = new ProductCard(
          cardElement,
          this.elements.productModalContent,
          collectionTitle
        );

        productCard.init();
      });
    });
  },

  onViewMoreLoaded(event) {
    const newProducts = event.detail.items;
    const viewMoreContainer = event.target;
    const collectionTitle = viewMoreContainer.dataset.collectionTitle;

    const viewMoreContent = viewMoreContainer.querySelector(
      selectors$15.viewMoreContent
    );

    const newProductIds = [];
    newProducts.forEach((product, index) => {
      const newElement = product.querySelector(selectors$15.productCard);
      newProductIds.push(newElement.dataset.productId);

      const newItem = viewMoreContent.appendChild(product);
      const productLink = newItem.querySelector(selectors$15.productCardLink);
      if (productLink && index === 0) productLink.focus();

      if (!this.isProductModalEnabled && !this.isQuickAddEnabled) return;

      const newProductCard = new ProductCard(
        newElement,
        this.elements.productModalContent,
        collectionTitle
      );
      newProductCard.init();
    });

    theme.cartQuantity.updateQuantityIndicatorElements(
      newProductIds,
      this.viewMoreContent,
      true
    );
  },

  /**
   * Keyboard event callback
   * Make the tab list keyboard navigation friendly with Home, End, Left arrow, Right arrow keys
   * @param {Object} event Event object
   */
  onKeyDownTabHandler(event) {
    const preventKeys = [
      keyCodes.HOME,
      keyCodes.END,
      keyCodes.RIGHT,
      keyCodes.LEFT,
    ];

    if (preventKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  },

  /**
   * Keyboard event callback
   * Make the tab list keyboard navigation friendly with Home, End, Left arrow, Right arrow keys
   * @param {Object} event Event object
   */
  onKeyUpTabHandler(event) {
    const currentElement = event.currentTarget;
    const lastElementIndex = this.elements.tabs.length - 1;
    const currentElementIndex = Number(
      currentElement.dataset.featuredCollectionsTabNumber
    );

    let index = -1;
    switch (event.key.toLowerCase()) {
      case keyCodes.HOME: {
        index = 0;
        break;
      }
      case keyCodes.END: {
        index = lastElementIndex;
        break;
      }
      case keyCodes.RIGHT: {
        index =
          currentElementIndex === lastElementIndex
            ? 0
            : currentElementIndex + 1;
        break;
      }
      case keyCodes.LEFT: {
        index =
          currentElementIndex === 0
            ? lastElementIndex
            : currentElementIndex - 1;
        break;
      }
    }

    if (index !== -1 && currentElementIndex !== index) {
      event.preventDefault();
      this.showCollectionPanel(index);
    }
  },

  onClickTabHandler(event) {
    const index = event.currentTarget.dataset.featuredCollectionsTabNumber;
    this.showCollectionPanel(index);
  },

  /**
   * Show the correct tabpanel, adjust the aria attributes and classes accordingly
   * @param {Number} index The position of the tabpanel
   */
  showCollectionPanel(index) {
    const targetTab = this.elements.tabs[index];

    const offsetPosition =
      this.elements.tabsPanelWrapper.getBoundingClientRect().top +
      window.pageYOffset -
      105;

    if (this.stickyNav.isSticky()) {
      document.dispatchEvent(new CustomEvent('featuredCollectionTabClicked'));

      window.scrollTo({
        top: offsetPosition,
      });
    }

    this.elements.tabs.forEach((tab) => {
      tab.classList.remove(classes$12.featuredCollectionsTabActive);
      tab.setAttribute('aria-selected', false);
      tab.setAttribute('tabindex', -1);
      delete tab.dataset.featuredCollectionsSelectedTab;
      tab.blur();
    });

    targetTab.classList.add(classes$12.featuredCollectionsTabActive);
    targetTab.setAttribute('aria-selected', true);
    targetTab.setAttribute('tabindex', 0);
    targetTab.dataset.featuredCollectionsSelectedTab = true;
    targetTab.focus();

    this.scroller.makeElementVisible(targetTab);

    const targetPanel = this.elements.tabsPanel[index];
    if (!targetPanel) return;

    this.elements.tabsPanel.forEach((tabPanel) => {
      tabPanel.classList.remove(classes$12.featuredCollectionsPanelVisible);
      tabPanel.classList.remove(classes$12.featuredCollectionsPanelActive);
    });

    targetPanel.classList.add(classes$12.featuredCollectionsPanelActive);
    window.requestAnimationFrame(() =>
      targetPanel.classList.add(classes$12.featuredCollectionsPanelVisible)
    );
  },
});

const selectors$18 = {
  productCard: '[data-product-card]',
  productModalContent: '[data-product-modal-content]',
  dataSlide: '[data-slide]',
};

sections.register('custom-content', {
  onLoad() {
    this.elements = this._getElements();

    const products = this.container.querySelectorAll(selectors$18.productCard);

    if (this.container.dataset.slider) {
      this._prepareGallery();
    }

    this.isProductModalEnabled = Boolean(this.container.dataset.productModal);

    if (this.isProductModalEnabled && products.length > 0) {
      this._setupProductCards();
    }
  },

  onUnload() {
    const hasGallery = Boolean(this.gallery);

    if (!hasGallery) return;

    this.gallery.destroy();
  },

  _getElements() {
    return {
      productModalContent: document.querySelector(
        selectors$18.productModalContent
      ),
    };
  },

  _setupProductCards() {
    const products = this.container.querySelectorAll(selectors$18.productCard);

    products.forEach((singleProduct) => {
      const productCardModal = new ProductCard(
        singleProduct,
        this.elements.productModalContent
      );

      productCardModal.init();
    });
  },

  _prepareGallery() {
    this.galleryElement = this.container.querySelector(selectors$18.dataSlide);

    if (!this.galleryElement) return;

    this._addGalleryMediaQueryListener();

    if (this.galleryMediaQueryListener.matches) {
      this._initializeGallery();
      this.gallery.addAccessibilityAttr();
    }
  },

  _disableGalleryMode() {
    this.gallery.removeAccessibilityAttr();
    this.gallery.resetTransformation();
    this.gallery.state.useAriaHidden = false;
    this.gallery.destroy();
  },

  _switchToGalleryMode() {
    const galleryWasJustInitialized = this._initializeGallery();
    this.gallery.state.useAriaHidden = true;
    this.gallery.hideMedia();
    this.gallery.addAccessibilityAttr();

    if (galleryWasJustInitialized) return;

    this.gallery.bindEvents();
  },

  _addGalleryMediaQueryListener() {
    this.galleryMediaQueryListener = window.matchMedia(
      getMediaQueryString('medium', 'max')
    );

    this.galleryMediaQueryListener.addListener((event) => {
      if (event.matches) {
        this._switchToGalleryMode();
        return;
      }

      this._disableGalleryMode();
    });
  },

  _initializeGallery() {
    if (this.gallery) {
      this.gallery.applyTransformation();
      window.setTimeout(() => this.gallery.enableTransition());
      return false;
    }

    this.gallery = new Gallery(this.galleryElement);
    this.gallery.init();

    return true;
  },
});

const selectors$19 = {
  blogTagFilter: '[data-blog-tag-filter]',
};

(() => {
  const blogTagFilter = document.querySelector(selectors$19.blogTagFilter);

  if (!blogTagFilter) return;

  resizeSelectInput(blogTagFilter);

  blogTagFilter.addEventListener('change', (event) => {
    location.href = event.target.value;
  });
})();

const selectors$20 = {
  passwordButton: '[data-password-button]',
  passwordInput: '[data-password-input]',
};

const attributes$2 = {
  error: 'data-error',
  templatePassword: 'data-template-password',
};

(() => {
  const isPasswordTemplate = document.body.hasAttribute(
    attributes$2.templatePassword
  );

  if (!isPasswordTemplate) return;

  const passwordInput = document.querySelector(selectors$20.passwordInput);

  if (passwordInput.hasAttribute(attributes$2.error)) {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        showPasswordModal();
      }, 50);
    });
  }

  function showPasswordModal() {
    const passwordModal = window.popups.find(
      (popup) => popup.name === 'password-modal'
    );

    passwordModal.openPopup({
      currentTarget: document.querySelector(selectors$20.passwordButton),
    });
  }
})();

const selectors$21 = {
  addNewAddressToggle: '[data-add-new-address-toggle]',
  addressCountrySelect: '[data-address-country-select]',
  addressFormNew: '[data-address-form-new]',
  cancelEditAddressToggle: '[data-cancel-edit-address-toggle]',
  cancelNewAddressToggle: '[data-cancel-new-address-toggle]',
  customerAddresses: '[data-customer-addresses]',
  deleteAddressButton: '[data-delete-address-button]',
  editAddressToggle: '[data-edit-address-toggle]',
  editAddressId: (id) => `[data-edit-address-id="${id}"]`,
  form: '[data-form]',
};

const attributes$3 = {
  addNewAddressToggle: 'data-add-new-address-toggle',
};

const classes$15 = {
  hidden: 'hidden',
};

(() => {
  const container = document.querySelector(selectors$21.customerAddresses);

  if (!container) return;

  const newAddressForm = container.querySelector(selectors$21.addressFormNew);

  if (!newAddressForm) return;

  _setupCountries();

  _setupEventListeners();

  function _setupEventListeners() {
    const addNewAddressToggle = container.querySelector(
      selectors$21.addNewAddressToggle
    );

    const cancelNewAddressToggle = container.querySelector(
      selectors$21.cancelNewAddressToggle
    );

    const editAddressToggles = container.querySelectorAll(
      selectors$21.editAddressToggle
    );
    const cancelEditAddressToggles = container.querySelectorAll(
      selectors$21.cancelEditAddressToggle
    );

    const deleteAddressButtons = container.querySelectorAll(
      selectors$21.deleteAddressButton
    );

    addNewAddressToggle.addEventListener('click', (event) =>
      _toggleAddNewAddressForm(event, addNewAddressToggle, newAddressForm)
    );

    cancelNewAddressToggle.addEventListener('click', (event) =>
      _toggleAddNewAddressForm(event, addNewAddressToggle, newAddressForm)
    );

    editAddressToggles.forEach((editAddressToggle) =>
      editAddressToggle.addEventListener('click', (event) =>
        _toggleEditAddressForm(event, editAddressToggles)
      )
    );

    cancelEditAddressToggles.forEach((cancelEditAddressToggle) =>
      cancelEditAddressToggle.addEventListener('click', () => {
        _toggleEditAddressForm(event, editAddressToggles);
      })
    );

    deleteAddressButtons.forEach((deleteButton) =>
      deleteButton.addEventListener('click', _deleteAddress)
    );
  }

  function _setupCountries() {
    // Initialize observers on address selectors, defined in shopify_common.js
    if (Shopify) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        'AddressCountryNew',
        'AddressProvinceNew',
        {
          hideElement: 'AddressProvinceContainerNew',
        }
      );
    }

    // Initialize each edit form's country/province selector
    container
      .querySelectorAll(selectors$21.addressCountrySelect)
      .forEach((countrySelect) => {
        const formId = countrySelect.dataset.formId;
        const countrySelector = `AddressCountry_${formId}`;
        const provinceSelector = `AddressProvince_${formId}`;
        const containerSelector = `AddressProvinceContainer_${formId}`;

        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
          hideElement: containerSelector,
        });
      });
  }

  function _toggleAddNewAddressForm(
    event,
    addNewAddressToggle,
    // eslint-disable-next-line no-shadow
    newAddressForm
  ) {
    const button = event.currentTarget;
    const newAddressFormExpandedState = addNewAddressToggle.getAttribute(
      'aria-expanded'
    );

    if (newAddressFormExpandedState === 'false') {
      newAddressForm.classList.remove(classes$15.hidden);
      addNewAddressToggle.setAttribute('aria-expanded', true);
    } else {
      newAddressForm.classList.add(classes$15.hidden);
      addNewAddressToggle.setAttribute('aria-expanded', false);
    }

    if (button.hasAttribute(attributes$3.addNewAddressToggle)) return;
    addNewAddressToggle.focus();
  }

  function _toggleEditAddressForm(event, editAddressToggles) {
    const button = event.currentTarget;
    const addressId = button.dataset.addressId;
    const editAddressformContainer = container.querySelector(
      selectors$21.editAddressId(addressId)
    );
    const editButton = Array.from(editAddressToggles).find(
      (editAddressToggle) => editAddressToggle.dataset.addressId === addressId
    );

    if (editButton.getAttribute('aria-expanded') === 'false') {
      editAddressformContainer.classList.remove(classes$15.hidden);
      editButton.setAttribute('aria-expanded', true);
    } else {
      editAddressformContainer.classList.add(classes$15.hidden);
      editButton.setAttribute('aria-expanded', false);
    }

    if (button.hasAttribute(attributes$3.editAddressFormToggle)) return;
    editButton.focus();
  }

  function _deleteAddress(event) {
    const deleteButton = event.currentTarget;
    const target = deleteButton.dataset.target;
    const confirmMessage =
      deleteButton.dataset.confirmMessage ||
      'Are you sure you wish to delete this address?';

    // eslint-disable-next-line no-alert
    if (confirm(confirmMessage)) {
      Shopify.postLink(target, {
        parameters: { _method: 'delete' },
      });
    }
  }
})();

const selectors$22 = {
  cancelResetPasswordLink: '[data-cancel-reset-password-link]',
  customerLogin: '[data-customer-login]',
  loginContainer: '[data-login-container]',
  loginHeading: '[data-login-heading]',
  resetPasswordHeading: '[data-reset-password-heading]',
  resetPasswordLink: '[data-reset-password-link]',
  resetPasswordContainer: '[data-reset-password-container]',
  resetPasswordSuccess: '[data-reset-password-success]',
  resetPasswordSuccessMessage: '[data-reset-password-success-message]',
};

const classes$16 = {
  hidden: 'hidden',
};

(() => {
  const container = document.querySelector(selectors$22.customerLogin);

  if (!container) return;

  _checkUrlHash();
  _resetPasswordOnSuccess();
  _setupEventHandlers();

  function _setupEventHandlers() {
    const resetPasswordLink = container.querySelector(
      selectors$22.resetPasswordLink
    );

    const cancelResetPasswordLink = container.querySelector(
      selectors$22.cancelResetPasswordLink
    );

    resetPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();

      const resetPasswordHeading = container.querySelector(
        selectors$22.resetPasswordHeading
      );
      _handleContainers(resetPasswordHeading, true);
    });

    cancelResetPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();

      const loginHeading = container.querySelector(selectors$22.loginHeading);
      _handleContainers(loginHeading, false);
    });
  }

  function _checkUrlHash() {
    const hash = window.location.hash;

    // Allow deep linking to recover password form
    if (hash === '#recover') {
      const resetPasswordHeading = container.querySelector(
        selectors$22.resetPasswordHeading
      );

      _handleContainers(resetPasswordHeading, true);
    }
  }

  function _resetPasswordOnSuccess() {
    const resetPasswordStatus = container.querySelector(
      selectors$22.resetPasswordSuccess
    );
    const resetPasswordMessage = container.querySelector(
      selectors$22.resetPasswordSuccessMessage
    );

    if (!resetPasswordStatus) return;

    resetPasswordMessage.classList.remove(classes$16.hidden);
    resetPasswordMessage.focus();
  }

  function _handleContainers(containerHeading, showPasswordPage) {
    const loginContainer = container.querySelector(selectors$22.loginContainer);
    const resetPasswordContainer = container.querySelector(
      selectors$22.resetPasswordContainer
    );

    if (showPasswordPage) {
      loginContainer.classList.add(classes$16.hidden);
      resetPasswordContainer.classList.remove(classes$16.hidden);
    } else {
      loginContainer.classList.remove(classes$16.hidden);
      resetPasswordContainer.classList.add(classes$16.hidden);
    }

    containerHeading.setAttribute('tabindex', '-1');
    containerHeading.focus();

    containerHeading.addEventListener('blur', () => {
      containerHeading.removeAttribute('tabindex');
    });
  }
})();

// import components
// import sections
// import templates
window.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-new
  new Form();

  sections.load('*');

  window.carts = Array.from(
    document.querySelectorAll('[data-cart]'),
    (cart) => {
      const currentCart = new Cart(cart);
      currentCart.init();
      return currentCart;
    }
  );

  window.popups = Array.from(
    document.querySelectorAll('[data-popup]'),
    (popup) => {
      const currentPopup = new Popup(popup.dataset.popup);
      currentPopup.init();
      return currentPopup;
    }
  );

  _shopify_themeA11y.accessibleLinks('a[href]:not([aria-describedby]', {
    messages: {
      newWindow: theme.strings.newWindow,
      external: theme.strings.external,
      newWindowExternal: theme.strings.newWindowExternal,
    },
  });

  theme.cartQuantity = new CartQuantity();
  theme.cartQuantity.updateLocalCartState();

  const cartTemplate = document.querySelector('[data-cart-template]');

  if (cartTemplate) {
    const cart = new CartTemplate(cartTemplate);
    cart.init();
  }
});

}(Shopify.theme.sections,Shopify.theme.a11y));
