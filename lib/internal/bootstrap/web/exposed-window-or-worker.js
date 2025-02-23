'use strict';

/**
 * This file exposes web interfaces that is defined with the WebIDL
 * Exposed=Window + Exposed=(Window,Worker) extended attribute or exposed in
 * WindowOrWorkerGlobalScope mixin.
 * See more details at https://webidl.spec.whatwg.org/#Exposed and
 * https://html.spec.whatwg.org/multipage/webappapis.html#windoworworkerglobalscope.
 */

const {
  globalThis,
  ObjectDefineProperty,
} = primordials;

const {
  defineOperation,
  defineLazyProperties,
  defineReplaceableLazyAttribute,
  exposeLazyInterfaces,
} = require('internal/util');

// https://html.spec.whatwg.org/multipage/webappapis.html#windoworworkerglobalscope
const timers = require('timers');
defineOperation(globalThis, 'clearInterval', timers.clearInterval);
defineOperation(globalThis, 'clearTimeout', timers.clearTimeout);
defineOperation(globalThis, 'setInterval', timers.setInterval);
defineOperation(globalThis, 'setTimeout', timers.setTimeout);

const {
  queueMicrotask,
} = require('internal/process/task_queues');
defineOperation(globalThis, 'queueMicrotask', queueMicrotask);

const { structuredClone } = internalBinding('messaging');
defineOperation(globalThis, 'structuredClone', structuredClone);
defineLazyProperties(globalThis, 'buffer', ['atob', 'btoa']);

// https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts
exposeLazyInterfaces(globalThis, 'internal/worker/io', ['BroadcastChannel']);
exposeLazyInterfaces(globalThis, 'internal/worker/io', [
  'MessageChannel', 'MessagePort', 'MessageEvent',
]);
// https://www.w3.org/TR/FileAPI/#dfn-Blob
exposeLazyInterfaces(globalThis, 'internal/blob', ['Blob']);
// https://www.w3.org/TR/FileAPI/#dfn-file
exposeLazyInterfaces(globalThis, 'internal/file', ['File']);
// https://www.w3.org/TR/hr-time-2/#the-performance-attribute
exposeLazyInterfaces(globalThis, 'perf_hooks', [
  'Performance', 'PerformanceEntry', 'PerformanceMark', 'PerformanceMeasure',
  'PerformanceObserver', 'PerformanceObserverEntryList', 'PerformanceResourceTiming',
]);

defineReplaceableLazyAttribute(globalThis, 'perf_hooks', ['performance']);

// https://w3c.github.io/FileAPI/#creating-revoking
const { installObjectURLMethods } = require('internal/url');
installObjectURLMethods();

{
  // https://fetch.spec.whatwg.org/#fetch-method
  function set(value) {
    ObjectDefineProperty(globalThis, 'fetch', {
      __proto__: null,
      writable: true,
      value,
    });
  }
  ObjectDefineProperty(globalThis, 'fetch', {
    __proto__: null,
    configurable: true,
    enumerable: true,
    set,
    get() {
      function fetch(input, init = undefined) {
        // Loading undici alone lead to promises which breaks lots of tests so we
        // have to load it really lazily for now.
        const { fetch: impl } = require('internal/deps/undici/undici');
        return impl(input, init);
      }
      set(fetch);
      return fetch;
    },
  });
}

// https://xhr.spec.whatwg.org/#interface-formdata
// https://fetch.spec.whatwg.org/#headers-class
// https://fetch.spec.whatwg.org/#request-class
// https://fetch.spec.whatwg.org/#response-class
exposeLazyInterfaces(globalThis, 'internal/deps/undici/undici', [
  'FormData', 'Headers', 'Request', 'Response',
]);

// The WebAssembly Web API which relies on Response.
// https:// webassembly.github.io/spec/web-api/#streaming-modules
internalBinding('wasm_web_api').setImplementation((streamState, source) => {
  require('internal/wasm_web_api').wasmStreamingCallback(streamState, source);
});
