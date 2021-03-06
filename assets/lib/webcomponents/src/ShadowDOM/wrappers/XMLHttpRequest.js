/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function(scope) {
  'use strict';

  var unwrapIfNeeded = scope.unwrapIfNeeded;
  var originalSend = XMLHttpRequest.prototype.send;

  // Since we only need to adjust XHR.send, we just patch it instead of wrapping
  // the entire object. This happens when FormData is passed.
  XMLHttpRequest.prototype.send = function(obj) {
    return originalSend.call(this, unwrapIfNeeded(obj));
  };

})(window.ShadowDOMPolyfill);
