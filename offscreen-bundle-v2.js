// node_modules/@firebase/util/dist/postinstall.mjs
var getDefaultsFromPostinstall = () => void 0;

// node_modules/@firebase/util/dist/index.esm.js
var stringToByteArray$1 = function(str) {
  const out = [];
  let p = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = c >> 6 | 192;
      out[p++] = c & 63 | 128;
    } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
      c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
      out[p++] = c >> 18 | 240;
      out[p++] = c >> 12 & 63 | 128;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    } else {
      out[p++] = c >> 12 | 224;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    }
  }
  return out;
};
var byteArrayToString = function(bytes) {
  const out = [];
  let pos = 0, c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
    } else if (c1 > 239 && c1 < 365) {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
      out[c++] = String.fromCharCode(55296 + (u >> 10));
      out[c++] = String.fromCharCode(56320 + (u & 1023));
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
    }
  }
  return out.join("");
};
var base64 = {
  /**
   * Maps bytes to characters.
   */
  byteToCharMap_: null,
  /**
   * Maps characters to bytes.
   */
  charToByteMap_: null,
  /**
   * Maps bytes to websafe characters.
   * @private
   */
  byteToCharMapWebSafe_: null,
  /**
   * Maps websafe characters to bytes.
   * @private
   */
  charToByteMapWebSafe_: null,
  /**
   * Our default alphabet, shared between
   * ENCODED_VALS and ENCODED_VALS_WEBSAFE
   */
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  /**
   * Our default alphabet. Value 64 (=) is special; it means "nothing."
   */
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  /**
   * Our websafe alphabet.
   */
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  /**
   * Whether this browser supports the atob and btoa functions. This extension
   * started at Mozilla but is now implemented by many browsers. We use the
   * ASSUME_* variables to avoid pulling in the full useragent detection library
   * but still allowing the standard per-browser compilations.
   *
   */
  HAS_NATIVE_SUPPORT: typeof atob === "function",
  /**
   * Base64-encode an array of bytes.
   *
   * @param input An array of bytes (numbers with
   *     value in [0, 255]) to encode.
   * @param webSafe Boolean indicating we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeByteArray(input, webSafe) {
    if (!Array.isArray(input)) {
      throw Error("encodeByteArray takes an array as a parameter");
    }
    this.init_();
    const byteToCharMap = webSafe ? this.byteToCharMapWebSafe_ : this.byteToCharMap_;
    const output = [];
    for (let i = 0; i < input.length; i += 3) {
      const byte1 = input[i];
      const haveByte2 = i + 1 < input.length;
      const byte2 = haveByte2 ? input[i + 1] : 0;
      const haveByte3 = i + 2 < input.length;
      const byte3 = haveByte3 ? input[i + 2] : 0;
      const outByte1 = byte1 >> 2;
      const outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
      let outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
      let outByte4 = byte3 & 63;
      if (!haveByte3) {
        outByte4 = 64;
        if (!haveByte2) {
          outByte3 = 64;
        }
      }
      output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
    }
    return output.join("");
  },
  /**
   * Base64-encode a string.
   *
   * @param input A string to encode.
   * @param webSafe If true, we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return btoa(input);
    }
    return this.encodeByteArray(stringToByteArray$1(input), webSafe);
  },
  /**
   * Base64-decode a string.
   *
   * @param input to decode.
   * @param webSafe True if we should use the
   *     alternative alphabet.
   * @return string representing the decoded value.
   */
  decodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return atob(input);
    }
    return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
  },
  /**
   * Base64-decode a string.
   *
   * In base-64 decoding, groups of four characters are converted into three
   * bytes.  If the encoder did not apply padding, the input length may not
   * be a multiple of 4.
   *
   * In this case, the last group will have fewer than 4 characters, and
   * padding will be inferred.  If the group has one or two characters, it decodes
   * to one byte.  If the group has three characters, it decodes to two bytes.
   *
   * @param input Input to decode.
   * @param webSafe True if we should use the web-safe alphabet.
   * @return bytes representing the decoded value.
   */
  decodeStringToByteArray(input, webSafe) {
    this.init_();
    const charToByteMap = webSafe ? this.charToByteMapWebSafe_ : this.charToByteMap_;
    const output = [];
    for (let i = 0; i < input.length; ) {
      const byte1 = charToByteMap[input.charAt(i++)];
      const haveByte2 = i < input.length;
      const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
      ++i;
      const haveByte3 = i < input.length;
      const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      const haveByte4 = i < input.length;
      const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
        throw new DecodeBase64StringError();
      }
      const outByte1 = byte1 << 2 | byte2 >> 4;
      output.push(outByte1);
      if (byte3 !== 64) {
        const outByte2 = byte2 << 4 & 240 | byte3 >> 2;
        output.push(outByte2);
        if (byte4 !== 64) {
          const outByte3 = byte3 << 6 & 192 | byte4;
          output.push(outByte3);
        }
      }
    }
    return output;
  },
  /**
   * Lazy static initialization function. Called before
   * accessing any of the static map variables.
   * @private
   */
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {};
      this.charToByteMap_ = {};
      this.byteToCharMapWebSafe_ = {};
      this.charToByteMapWebSafe_ = {};
      for (let i = 0; i < this.ENCODED_VALS.length; i++) {
        this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
        this.charToByteMap_[this.byteToCharMap_[i]] = i;
        this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
        this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
        if (i >= this.ENCODED_VALS_BASE.length) {
          this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
        }
      }
    }
  }
};
var DecodeBase64StringError = class extends Error {
  constructor() {
    super(...arguments);
    this.name = "DecodeBase64StringError";
  }
};
var base64Encode = function(str) {
  const utf8Bytes = stringToByteArray$1(str);
  return base64.encodeByteArray(utf8Bytes, true);
};
var base64urlEncodeWithoutPadding = function(str) {
  return base64Encode(str).replace(/\./g, "");
};
var base64Decode = function(str) {
  try {
    return base64.decodeString(str, true);
  } catch (e) {
    console.error("base64Decode failed: ", e);
  }
  return null;
};
function getGlobal() {
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("Unable to locate global object.");
}
var getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
var getDefaultsFromEnvVariable = () => {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return;
  }
  const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
  if (defaultsJsonString) {
    return JSON.parse(defaultsJsonString);
  }
};
var getDefaultsFromCookie = () => {
  if (typeof document === "undefined") {
    return;
  }
  let match;
  try {
    match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
  } catch (e) {
    return;
  }
  const decoded = match && base64Decode(match[1]);
  return decoded && JSON.parse(decoded);
};
var getDefaults = () => {
  try {
    return getDefaultsFromPostinstall() || getDefaultsFromGlobal() || getDefaultsFromEnvVariable() || getDefaultsFromCookie();
  } catch (e) {
    console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
    return;
  }
};
var getDefaultAppConfig = () => getDefaults()?.config;
var Deferred = class {
  constructor() {
    this.reject = () => {
    };
    this.resolve = () => {
    };
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  /**
   * Our API internals are not promisified and cannot because our callback APIs have subtle expectations around
   * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
   * and returns a node-style callback which will resolve or reject the Deferred's promise.
   */
  wrapCallback(callback) {
    return (error, value) => {
      if (error) {
        this.reject(error);
      } else {
        this.resolve(value);
      }
      if (typeof callback === "function") {
        this.promise.catch(() => {
        });
        if (callback.length === 1) {
          callback(error);
        } else {
          callback(error, value);
        }
      }
    };
  }
};
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB === "object";
  } catch (e) {
    return false;
  }
}
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME = "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        reject(request.error?.message || "");
      };
    } catch (error) {
      reject(error);
    }
  });
}
var ERROR_NAME = "FirebaseError";
var FirebaseError = class _FirebaseError extends Error {
  constructor(code, message, customData) {
    super(message);
    this.code = code;
    this.customData = customData;
    this.name = ERROR_NAME;
    Object.setPrototypeOf(this, _FirebaseError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorFactory.prototype.create);
    }
  }
};
var ErrorFactory = class {
  constructor(service, serviceName, errors) {
    this.service = service;
    this.serviceName = serviceName;
    this.errors = errors;
  }
  create(code, ...data) {
    const customData = data[0] || {};
    const fullCode = `${this.service}/${code}`;
    const template = this.errors[code];
    const message = template ? replaceTemplate(template, customData) : "Error";
    const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
    const error = new FirebaseError(fullCode, fullMessage, customData);
    return error;
  }
};
function replaceTemplate(template, data) {
  return template.replace(PATTERN, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `<${key}?>`;
  });
}
var PATTERN = /\{\$([^}]+)}/g;
function jsonEval(str) {
  return JSON.parse(str);
}
var decode = function(token) {
  let header = {}, claims = {}, data = {}, signature = "";
  try {
    const parts = token.split(".");
    header = jsonEval(base64Decode(parts[0]) || "");
    claims = jsonEval(base64Decode(parts[1]) || "");
    signature = parts[2];
    data = claims["d"] || {};
    delete claims["d"];
  } catch (e) {
  }
  return {
    header,
    claims,
    data,
    signature
  };
};
var issuedAtTime = function(token) {
  const claims = decode(token).claims;
  if (typeof claims === "object" && claims.hasOwnProperty("iat")) {
    return claims["iat"];
  }
  return null;
};
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const k of aKeys) {
    if (!bKeys.includes(k)) {
      return false;
    }
    const aProp = a[k];
    const bProp = b[k];
    if (isObject(aProp) && isObject(bProp)) {
      if (!deepEqual(aProp, bProp)) {
        return false;
      }
    } else if (aProp !== bProp) {
      return false;
    }
  }
  for (const k of bKeys) {
    if (!aKeys.includes(k)) {
      return false;
    }
  }
  return true;
}
function isObject(thing) {
  return thing !== null && typeof thing === "object";
}
var MAX_VALUE_MILLIS = 4 * 60 * 60 * 1e3;
function getModularInstance(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
}

// node_modules/@firebase/component/dist/esm/index.esm.js
var Component = class {
  /**
   *
   * @param name The public service name, e.g. app, auth, firestore, database
   * @param instanceFactory Service factory responsible for creating the public interface
   * @param type whether the service provided by the component is public or private
   */
  constructor(name5, instanceFactory, type) {
    this.name = name5;
    this.instanceFactory = instanceFactory;
    this.type = type;
    this.multipleInstances = false;
    this.serviceProps = {};
    this.instantiationMode = "LAZY";
    this.onInstanceCreated = null;
  }
  setInstantiationMode(mode) {
    this.instantiationMode = mode;
    return this;
  }
  setMultipleInstances(multipleInstances) {
    this.multipleInstances = multipleInstances;
    return this;
  }
  setServiceProps(props) {
    this.serviceProps = props;
    return this;
  }
  setInstanceCreatedCallback(callback) {
    this.onInstanceCreated = callback;
    return this;
  }
};
var DEFAULT_ENTRY_NAME = "[DEFAULT]";
var Provider = class {
  constructor(name5, container) {
    this.name = name5;
    this.container = container;
    this.component = null;
    this.instances = /* @__PURE__ */ new Map();
    this.instancesDeferred = /* @__PURE__ */ new Map();
    this.instancesOptions = /* @__PURE__ */ new Map();
    this.onInitCallbacks = /* @__PURE__ */ new Map();
  }
  /**
   * @param identifier A provider can provide multiple instances of a service
   * if this.component.multipleInstances is true.
   */
  get(identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    if (!this.instancesDeferred.has(normalizedIdentifier)) {
      const deferred = new Deferred();
      this.instancesDeferred.set(normalizedIdentifier, deferred);
      if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
        try {
          const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier
          });
          if (instance) {
            deferred.resolve(instance);
          }
        } catch (e) {
        }
      }
    }
    return this.instancesDeferred.get(normalizedIdentifier).promise;
  }
  getImmediate(options) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(options?.identifier);
    const optional = options?.optional ?? false;
    if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
      try {
        return this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
      } catch (e) {
        if (optional) {
          return null;
        } else {
          throw e;
        }
      }
    } else {
      if (optional) {
        return null;
      } else {
        throw Error(`Service ${this.name} is not available`);
      }
    }
  }
  getComponent() {
    return this.component;
  }
  setComponent(component) {
    if (component.name !== this.name) {
      throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
    }
    if (this.component) {
      throw Error(`Component for ${this.name} has already been provided`);
    }
    this.component = component;
    if (!this.shouldAutoInitialize()) {
      return;
    }
    if (isComponentEager(component)) {
      try {
        this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
      } catch (e) {
      }
    }
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      try {
        const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
        instanceDeferred.resolve(instance);
      } catch (e) {
      }
    }
  }
  clearInstance(identifier = DEFAULT_ENTRY_NAME) {
    this.instancesDeferred.delete(identifier);
    this.instancesOptions.delete(identifier);
    this.instances.delete(identifier);
  }
  // app.delete() will call this method on every provider to delete the services
  // TODO: should we mark the provider as deleted?
  async delete() {
    const services = Array.from(this.instances.values());
    await Promise.all([
      ...services.filter((service) => "INTERNAL" in service).map((service) => service.INTERNAL.delete()),
      ...services.filter((service) => "_delete" in service).map((service) => service._delete())
    ]);
  }
  isComponentSet() {
    return this.component != null;
  }
  isInitialized(identifier = DEFAULT_ENTRY_NAME) {
    return this.instances.has(identifier);
  }
  getOptions(identifier = DEFAULT_ENTRY_NAME) {
    return this.instancesOptions.get(identifier) || {};
  }
  initialize(opts = {}) {
    const { options = {} } = opts;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
    if (this.isInitialized(normalizedIdentifier)) {
      throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
    }
    if (!this.isComponentSet()) {
      throw Error(`Component ${this.name} has not been registered yet`);
    }
    const instance = this.getOrInitializeService({
      instanceIdentifier: normalizedIdentifier,
      options
    });
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      if (normalizedIdentifier === normalizedDeferredIdentifier) {
        instanceDeferred.resolve(instance);
      }
    }
    return instance;
  }
  /**
   *
   * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
   * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
   *
   * @param identifier An optional instance identifier
   * @returns a function to unregister the callback
   */
  onInit(callback, identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    const existingCallbacks = this.onInitCallbacks.get(normalizedIdentifier) ?? /* @__PURE__ */ new Set();
    existingCallbacks.add(callback);
    this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
    const existingInstance = this.instances.get(normalizedIdentifier);
    if (existingInstance) {
      callback(existingInstance, normalizedIdentifier);
    }
    return () => {
      existingCallbacks.delete(callback);
    };
  }
  /**
   * Invoke onInit callbacks synchronously
   * @param instance the service instance`
   */
  invokeOnInitCallbacks(instance, identifier) {
    const callbacks = this.onInitCallbacks.get(identifier);
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      try {
        callback(instance, identifier);
      } catch {
      }
    }
  }
  getOrInitializeService({ instanceIdentifier, options = {} }) {
    let instance = this.instances.get(instanceIdentifier);
    if (!instance && this.component) {
      instance = this.component.instanceFactory(this.container, {
        instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
        options
      });
      this.instances.set(instanceIdentifier, instance);
      this.instancesOptions.set(instanceIdentifier, options);
      this.invokeOnInitCallbacks(instance, instanceIdentifier);
      if (this.component.onInstanceCreated) {
        try {
          this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
        } catch {
        }
      }
    }
    return instance || null;
  }
  normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
    if (this.component) {
      return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
    } else {
      return identifier;
    }
  }
  shouldAutoInitialize() {
    return !!this.component && this.component.instantiationMode !== "EXPLICIT";
  }
};
function normalizeIdentifierForFactory(identifier) {
  return identifier === DEFAULT_ENTRY_NAME ? void 0 : identifier;
}
function isComponentEager(component) {
  return component.instantiationMode === "EAGER";
}
var ComponentContainer = class {
  constructor(name5) {
    this.name = name5;
    this.providers = /* @__PURE__ */ new Map();
  }
  /**
   *
   * @param component Component being added
   * @param overwrite When a component with the same name has already been registered,
   * if overwrite is true: overwrite the existing component with the new component and create a new
   * provider with the new component. It can be useful in tests where you want to use different mocks
   * for different tests.
   * if overwrite is false: throw an exception
   */
  addComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
    }
    provider.setComponent(component);
  }
  addOrOverwriteComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      this.providers.delete(component.name);
    }
    this.addComponent(component);
  }
  /**
   * getProvider provides a type safe interface where it can only be called with a field name
   * present in NameServiceMapping interface.
   *
   * Firebase SDKs providing services should extend NameServiceMapping interface to register
   * themselves.
   */
  getProvider(name5) {
    if (this.providers.has(name5)) {
      return this.providers.get(name5);
    }
    const provider = new Provider(name5, this);
    this.providers.set(name5, provider);
    return provider;
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
};

// node_modules/@firebase/logger/dist/esm/index.esm.js
var instances = [];
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["VERBOSE"] = 1] = "VERBOSE";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  LogLevel2[LogLevel2["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
var levelStringToEnum = {
  "debug": LogLevel.DEBUG,
  "verbose": LogLevel.VERBOSE,
  "info": LogLevel.INFO,
  "warn": LogLevel.WARN,
  "error": LogLevel.ERROR,
  "silent": LogLevel.SILENT
};
var defaultLogLevel = LogLevel.INFO;
var ConsoleMethod = {
  [LogLevel.DEBUG]: "log",
  [LogLevel.VERBOSE]: "log",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error"
};
var defaultLogHandler = (instance, logType, ...args) => {
  if (logType < instance.logLevel) {
    return;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const method = ConsoleMethod[logType];
  if (method) {
    console[method](`[${now}]  ${instance.name}:`, ...args);
  } else {
    throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
  }
};
var Logger = class {
  /**
   * Gives you an instance of a Logger to capture messages according to
   * Firebase's logging scheme.
   *
   * @param name The name that the logs will be associated with
   */
  constructor(name5) {
    this.name = name5;
    this._logLevel = defaultLogLevel;
    this._logHandler = defaultLogHandler;
    this._userLogHandler = null;
    instances.push(this);
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(val) {
    if (!(val in LogLevel)) {
      throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
    }
    this._logLevel = val;
  }
  // Workaround for setter/getter having to be the same type.
  setLogLevel(val) {
    this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(val) {
    if (typeof val !== "function") {
      throw new TypeError("Value assigned to `logHandler` must be a function");
    }
    this._logHandler = val;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(val) {
    this._userLogHandler = val;
  }
  /**
   * The functions below are all based on the `console` interface
   */
  debug(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
    this._logHandler(this, LogLevel.DEBUG, ...args);
  }
  log(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.VERBOSE, ...args);
    this._logHandler(this, LogLevel.VERBOSE, ...args);
  }
  info(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
    this._logHandler(this, LogLevel.INFO, ...args);
  }
  warn(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
    this._logHandler(this, LogLevel.WARN, ...args);
  }
  error(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
    this._logHandler(this, LogLevel.ERROR, ...args);
  }
};

// node_modules/idb/build/wrap-idb-value.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var cursorRequestMap = /* @__PURE__ */ new WeakMap();
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "objectStoreNames") {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      }
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);

// node_modules/idb/build/index.js
function openDB(name5, version4, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name5, version4);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));

// node_modules/@firebase/app/dist/esm/index.esm.js
var PlatformLoggerServiceImpl = class {
  constructor(container) {
    this.container = container;
  }
  // In initial implementation, this will be called by installations on
  // auth token refresh, and installations will send this string.
  getPlatformInfoString() {
    const providers = this.container.getProviders();
    return providers.map((provider) => {
      if (isVersionServiceProvider(provider)) {
        const service = provider.getImmediate();
        return `${service.library}/${service.version}`;
      } else {
        return null;
      }
    }).filter((logString) => logString).join(" ");
  }
};
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return component?.type === "VERSION";
}
var name$q = "@firebase/app";
var version$1 = "0.14.4";
var logger = new Logger("@firebase/app");
var name$p = "@firebase/app-compat";
var name$o = "@firebase/analytics-compat";
var name$n = "@firebase/analytics";
var name$m = "@firebase/app-check-compat";
var name$l = "@firebase/app-check";
var name$k = "@firebase/auth";
var name$j = "@firebase/auth-compat";
var name$i = "@firebase/database";
var name$h = "@firebase/data-connect";
var name$g = "@firebase/database-compat";
var name$f = "@firebase/functions";
var name$e = "@firebase/functions-compat";
var name$d = "@firebase/installations";
var name$c = "@firebase/installations-compat";
var name$b = "@firebase/messaging";
var name$a = "@firebase/messaging-compat";
var name$9 = "@firebase/performance";
var name$8 = "@firebase/performance-compat";
var name$7 = "@firebase/remote-config";
var name$6 = "@firebase/remote-config-compat";
var name$5 = "@firebase/storage";
var name$4 = "@firebase/storage-compat";
var name$3 = "@firebase/firestore";
var name$2 = "@firebase/ai";
var name$1 = "@firebase/firestore-compat";
var name = "firebase";
var DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
var PLATFORM_LOG_STRING = {
  [name$q]: "fire-core",
  [name$p]: "fire-core-compat",
  [name$n]: "fire-analytics",
  [name$o]: "fire-analytics-compat",
  [name$l]: "fire-app-check",
  [name$m]: "fire-app-check-compat",
  [name$k]: "fire-auth",
  [name$j]: "fire-auth-compat",
  [name$i]: "fire-rtdb",
  [name$h]: "fire-data-connect",
  [name$g]: "fire-rtdb-compat",
  [name$f]: "fire-fn",
  [name$e]: "fire-fn-compat",
  [name$d]: "fire-iid",
  [name$c]: "fire-iid-compat",
  [name$b]: "fire-fcm",
  [name$a]: "fire-fcm-compat",
  [name$9]: "fire-perf",
  [name$8]: "fire-perf-compat",
  [name$7]: "fire-rc",
  [name$6]: "fire-rc-compat",
  [name$5]: "fire-gcs",
  [name$4]: "fire-gcs-compat",
  [name$3]: "fire-fst",
  [name$1]: "fire-fst-compat",
  [name$2]: "fire-vertex",
  "fire-js": "fire-js",
  // Platform identifier for JS SDK.
  [name]: "fire-js-all"
};
var _apps = /* @__PURE__ */ new Map();
var _serverApps = /* @__PURE__ */ new Map();
var _components = /* @__PURE__ */ new Map();
function _addComponent(app2, component) {
  try {
    app2.container.addComponent(component);
  } catch (e) {
    logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app2.name}`, e);
  }
}
function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
    logger.debug(`There were multiple attempts to register component ${componentName}.`);
    return false;
  }
  _components.set(componentName, component);
  for (const app2 of _apps.values()) {
    _addComponent(app2, component);
  }
  for (const serverApp of _serverApps.values()) {
    _addComponent(serverApp, component);
  }
  return true;
}
function _getProvider(app2, name5) {
  const heartbeatController = app2.container.getProvider("heartbeat").getImmediate({ optional: true });
  if (heartbeatController) {
    void heartbeatController.triggerHeartbeat();
  }
  return app2.container.getProvider(name5);
}
function _isFirebaseServerApp(obj) {
  if (obj === null || obj === void 0) {
    return false;
  }
  return obj.settings !== void 0;
}
var ERRORS = {
  [
    "no-app"
    /* AppError.NO_APP */
  ]: "No Firebase App '{$appName}' has been created - call initializeApp() first",
  [
    "bad-app-name"
    /* AppError.BAD_APP_NAME */
  ]: "Illegal App name: '{$appName}'",
  [
    "duplicate-app"
    /* AppError.DUPLICATE_APP */
  ]: "Firebase App named '{$appName}' already exists with different options or config",
  [
    "app-deleted"
    /* AppError.APP_DELETED */
  ]: "Firebase App named '{$appName}' already deleted",
  [
    "server-app-deleted"
    /* AppError.SERVER_APP_DELETED */
  ]: "Firebase Server App has been deleted",
  [
    "no-options"
    /* AppError.NO_OPTIONS */
  ]: "Need to provide options, when not being deployed to hosting via source.",
  [
    "invalid-app-argument"
    /* AppError.INVALID_APP_ARGUMENT */
  ]: "firebase.{$appName}() takes either no argument or a Firebase App instance.",
  [
    "invalid-log-argument"
    /* AppError.INVALID_LOG_ARGUMENT */
  ]: "First argument to `onLog` must be null or a function.",
  [
    "idb-open"
    /* AppError.IDB_OPEN */
  ]: "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "idb-get"
    /* AppError.IDB_GET */
  ]: "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "idb-set"
    /* AppError.IDB_WRITE */
  ]: "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "idb-delete"
    /* AppError.IDB_DELETE */
  ]: "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
  [
    "finalization-registry-not-supported"
    /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */
  ]: "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
  [
    "invalid-server-app-environment"
    /* AppError.INVALID_SERVER_APP_ENVIRONMENT */
  ]: "FirebaseServerApp is not for use in browser environments."
};
var ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);
var FirebaseAppImpl = class {
  constructor(options, config, container) {
    this._isDeleted = false;
    this._options = { ...options };
    this._config = { ...config };
    this._name = config.name;
    this._automaticDataCollectionEnabled = config.automaticDataCollectionEnabled;
    this._container = container;
    this.container.addComponent(new Component(
      "app",
      () => this,
      "PUBLIC"
      /* ComponentType.PUBLIC */
    ));
  }
  get automaticDataCollectionEnabled() {
    this.checkDestroyed();
    return this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(val) {
    this.checkDestroyed();
    this._automaticDataCollectionEnabled = val;
  }
  get name() {
    this.checkDestroyed();
    return this._name;
  }
  get options() {
    this.checkDestroyed();
    return this._options;
  }
  get config() {
    this.checkDestroyed();
    return this._config;
  }
  get container() {
    return this._container;
  }
  get isDeleted() {
    return this._isDeleted;
  }
  set isDeleted(val) {
    this._isDeleted = val;
  }
  /**
   * This function will throw an Error if the App has already been deleted -
   * use before performing API actions on the App.
   */
  checkDestroyed() {
    if (this.isDeleted) {
      throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
    }
  }
};
function initializeApp(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== "object") {
    const name6 = rawConfig;
    rawConfig = { name: name6 };
  }
  const config = {
    name: DEFAULT_ENTRY_NAME2,
    automaticDataCollectionEnabled: true,
    ...rawConfig
  };
  const name5 = config.name;
  if (typeof name5 !== "string" || !name5) {
    throw ERROR_FACTORY.create("bad-app-name", {
      appName: String(name5)
    });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
    throw ERROR_FACTORY.create(
      "no-options"
      /* AppError.NO_OPTIONS */
    );
  }
  const existingApp = _apps.get(name5);
  if (existingApp) {
    if (deepEqual(options, existingApp.options) && deepEqual(config, existingApp.config)) {
      return existingApp;
    } else {
      throw ERROR_FACTORY.create("duplicate-app", { appName: name5 });
    }
  }
  const container = new ComponentContainer(name5);
  for (const component of _components.values()) {
    container.addComponent(component);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name5, newApp);
  return newApp;
}
function getApp(name5 = DEFAULT_ENTRY_NAME2) {
  const app2 = _apps.get(name5);
  if (!app2 && name5 === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
    return initializeApp();
  }
  if (!app2) {
    throw ERROR_FACTORY.create("no-app", { appName: name5 });
  }
  return app2;
}
function registerVersion(libraryKeyOrName, version4, variant) {
  let library = PLATFORM_LOG_STRING[libraryKeyOrName] ?? libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version4.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version4}":`
    ];
    if (libraryMismatch) {
      warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(`version name "${version4}" contains illegal characters (whitespace or "/")`);
    }
    logger.warn(warning.join(" "));
    return;
  }
  _registerComponent(new Component(
    `${library}-version`,
    () => ({ library, version: version4 }),
    "VERSION"
    /* ComponentType.VERSION */
  ));
}
var DB_NAME = "firebase-heartbeat-database";
var DB_VERSION = 1;
var STORE_NAME = "firebase-heartbeat-store";
var dbPromise = null;
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade: (db, oldVersion) => {
        switch (oldVersion) {
          case 0:
            try {
              db.createObjectStore(STORE_NAME);
            } catch (e) {
              console.warn(e);
            }
        }
      }
    }).catch((e) => {
      throw ERROR_FACTORY.create("idb-open", {
        originalErrorMessage: e.message
      });
    });
  }
  return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app2) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME);
    const result = await tx.objectStore(STORE_NAME).get(computeKey(app2));
    await tx.done;
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-get", {
        originalErrorMessage: e?.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
async function writeHeartbeatsToIndexedDB(app2, heartbeatObject) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app2));
    await tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-set", {
        originalErrorMessage: e?.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
function computeKey(app2) {
  return `${app2.name}!${app2.options.appId}`;
}
var MAX_HEADER_BYTES = 1024;
var MAX_NUM_STORED_HEARTBEATS = 30;
var HeartbeatServiceImpl = class {
  constructor(container) {
    this.container = container;
    this._heartbeatsCache = null;
    const app2 = this.container.getProvider("app").getImmediate();
    this._storage = new HeartbeatStorageImpl(app2);
    this._heartbeatsCachePromise = this._storage.read().then((result) => {
      this._heartbeatsCache = result;
      return result;
    });
  }
  /**
   * Called to report a heartbeat. The function will generate
   * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
   * to IndexedDB.
   * Note that we only store one heartbeat per day. So if a heartbeat for today is
   * already logged, subsequent calls to this function in the same day will be ignored.
   */
  async triggerHeartbeat() {
    try {
      const platformLogger = this.container.getProvider("platform-logger").getImmediate();
      const agent = platformLogger.getPlatformInfoString();
      const date = getUTCDateString();
      if (this._heartbeatsCache?.heartbeats == null) {
        this._heartbeatsCache = await this._heartbeatsCachePromise;
        if (this._heartbeatsCache?.heartbeats == null) {
          return;
        }
      }
      if (this._heartbeatsCache.lastSentHeartbeatDate === date || this._heartbeatsCache.heartbeats.some((singleDateHeartbeat) => singleDateHeartbeat.date === date)) {
        return;
      } else {
        this._heartbeatsCache.heartbeats.push({ date, agent });
        if (this._heartbeatsCache.heartbeats.length > MAX_NUM_STORED_HEARTBEATS) {
          const earliestHeartbeatIdx = getEarliestHeartbeatIdx(this._heartbeatsCache.heartbeats);
          this._heartbeatsCache.heartbeats.splice(earliestHeartbeatIdx, 1);
        }
      }
      return this._storage.overwrite(this._heartbeatsCache);
    } catch (e) {
      logger.warn(e);
    }
  }
  /**
   * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
   * It also clears all heartbeats from memory as well as in IndexedDB.
   *
   * NOTE: Consuming product SDKs should not send the header if this method
   * returns an empty string.
   */
  async getHeartbeatsHeader() {
    try {
      if (this._heartbeatsCache === null) {
        await this._heartbeatsCachePromise;
      }
      if (this._heartbeatsCache?.heartbeats == null || this._heartbeatsCache.heartbeats.length === 0) {
        return "";
      }
      const date = getUTCDateString();
      const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
      const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
      this._heartbeatsCache.lastSentHeartbeatDate = date;
      if (unsentEntries.length > 0) {
        this._heartbeatsCache.heartbeats = unsentEntries;
        await this._storage.overwrite(this._heartbeatsCache);
      } else {
        this._heartbeatsCache.heartbeats = [];
        void this._storage.overwrite(this._heartbeatsCache);
      }
      return headerString;
    } catch (e) {
      logger.warn(e);
      return "";
    }
  }
};
function getUTCDateString() {
  const today = /* @__PURE__ */ new Date();
  return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    const heartbeatEntry = heartbeatsToSend.find((hb) => hb.agent === singleDateHeartbeat.agent);
    if (!heartbeatEntry) {
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date]
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries
  };
}
var HeartbeatStorageImpl = class {
  constructor(app2) {
    this.app = app2;
    this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
    if (!isIndexedDBAvailable()) {
      return false;
    } else {
      return validateIndexedDBOpenable().then(() => true).catch(() => false);
    }
  }
  /**
   * Read all heartbeats.
   */
  async read() {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return { heartbeats: [] };
    } else {
      const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
      if (idbHeartbeatObject?.heartbeats) {
        return idbHeartbeatObject;
      } else {
        return { heartbeats: [] };
      }
    }
  }
  // overwrite the storage with the provided heartbeats
  async overwrite(heartbeatsObject) {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: heartbeatsObject.heartbeats
      });
    }
  }
  // add heartbeats
  async add(heartbeatsObject) {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: [
          ...existingHeartbeatsObject.heartbeats,
          ...heartbeatsObject.heartbeats
        ]
      });
    }
  }
};
function countBytes(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache })
  ).length;
}
function getEarliestHeartbeatIdx(heartbeats) {
  if (heartbeats.length === 0) {
    return -1;
  }
  let earliestHeartbeatIdx = 0;
  let earliestHeartbeatDate = heartbeats[0].date;
  for (let i = 1; i < heartbeats.length; i++) {
    if (heartbeats[i].date < earliestHeartbeatDate) {
      earliestHeartbeatDate = heartbeats[i].date;
      earliestHeartbeatIdx = i;
    }
  }
  return earliestHeartbeatIdx;
}
function registerCoreComponents(variant) {
  _registerComponent(new Component(
    "platform-logger",
    (container) => new PlatformLoggerServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  _registerComponent(new Component(
    "heartbeat",
    (container) => new HeartbeatServiceImpl(container),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  ));
  registerVersion(name$q, version$1, variant);
  registerVersion(name$q, version$1, "esm2020");
  registerVersion("fire-js", "");
}
registerCoreComponents("");

// node_modules/firebase/app/dist/esm/index.esm.js
var name2 = "firebase";
var version = "12.4.0";
registerVersion(name2, version, "app");

// node_modules/@firebase/app-check/dist/esm/index.esm.js
var APP_CHECK_STATES = /* @__PURE__ */ new Map();
var DEFAULT_STATE = {
  activated: false,
  tokenObservers: []
};
var DEBUG_STATE = {
  initialized: false,
  enabled: false
};
function getStateReference(app2) {
  return APP_CHECK_STATES.get(app2) || { ...DEFAULT_STATE };
}
function setInitialState(app2, state) {
  APP_CHECK_STATES.set(app2, state);
  return APP_CHECK_STATES.get(app2);
}
function getDebugState() {
  return DEBUG_STATE;
}
var BASE_ENDPOINT = "https://content-firebaseappcheck.googleapis.com/v1";
var EXCHANGE_DEBUG_TOKEN_METHOD = "exchangeDebugToken";
var TOKEN_REFRESH_TIME = {
  /**
   * The offset time before token natural expiration to run the refresh.
   * This is currently 5 minutes.
   */
  OFFSET_DURATION: 5 * 60 * 1e3,
  /**
   * This is the first retrial wait after an error. This is currently
   * 30 seconds.
   */
  RETRIAL_MIN_WAIT: 30 * 1e3,
  /**
   * This is the maximum retrial wait, currently 16 minutes.
   */
  RETRIAL_MAX_WAIT: 16 * 60 * 1e3
};
var ONE_DAY = 24 * 60 * 60 * 1e3;
var Refresher = class {
  constructor(operation, retryPolicy, getWaitDuration, lowerBound, upperBound) {
    this.operation = operation;
    this.retryPolicy = retryPolicy;
    this.getWaitDuration = getWaitDuration;
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
    this.pending = null;
    this.nextErrorWaitInterval = lowerBound;
    if (lowerBound > upperBound) {
      throw new Error("Proactive refresh lower bound greater than upper bound!");
    }
  }
  start() {
    this.nextErrorWaitInterval = this.lowerBound;
    this.process(true).catch(() => {
    });
  }
  stop() {
    if (this.pending) {
      this.pending.reject("cancelled");
      this.pending = null;
    }
  }
  isRunning() {
    return !!this.pending;
  }
  async process(hasSucceeded) {
    this.stop();
    try {
      this.pending = new Deferred();
      this.pending.promise.catch((_e) => {
      });
      await sleep(this.getNextRun(hasSucceeded));
      this.pending.resolve();
      await this.pending.promise;
      this.pending = new Deferred();
      this.pending.promise.catch((_e) => {
      });
      await this.operation();
      this.pending.resolve();
      await this.pending.promise;
      this.process(true).catch(() => {
      });
    } catch (error) {
      if (this.retryPolicy(error)) {
        this.process(false).catch(() => {
        });
      } else {
        this.stop();
      }
    }
  }
  getNextRun(hasSucceeded) {
    if (hasSucceeded) {
      this.nextErrorWaitInterval = this.lowerBound;
      return this.getWaitDuration();
    } else {
      const currentErrorWaitInterval = this.nextErrorWaitInterval;
      this.nextErrorWaitInterval *= 2;
      if (this.nextErrorWaitInterval > this.upperBound) {
        this.nextErrorWaitInterval = this.upperBound;
      }
      return currentErrorWaitInterval;
    }
  }
};
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
var ERRORS2 = {
  [
    "already-initialized"
    /* AppCheckError.ALREADY_INITIALIZED */
  ]: "You have already called initializeAppCheck() for FirebaseApp {$appName} with different options. To avoid this error, call initializeAppCheck() with the same options as when it was originally called. This will return the already initialized instance.",
  [
    "use-before-activation"
    /* AppCheckError.USE_BEFORE_ACTIVATION */
  ]: "App Check is being used before initializeAppCheck() is called for FirebaseApp {$appName}. Call initializeAppCheck() before instantiating other Firebase services.",
  [
    "fetch-network-error"
    /* AppCheckError.FETCH_NETWORK_ERROR */
  ]: "Fetch failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.",
  [
    "fetch-parse-error"
    /* AppCheckError.FETCH_PARSE_ERROR */
  ]: "Fetch client could not parse response. Original error: {$originalErrorMessage}.",
  [
    "fetch-status-error"
    /* AppCheckError.FETCH_STATUS_ERROR */
  ]: "Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.",
  [
    "storage-open"
    /* AppCheckError.STORAGE_OPEN */
  ]: "Error thrown when opening storage. Original error: {$originalErrorMessage}.",
  [
    "storage-get"
    /* AppCheckError.STORAGE_GET */
  ]: "Error thrown when reading from storage. Original error: {$originalErrorMessage}.",
  [
    "storage-set"
    /* AppCheckError.STORAGE_WRITE */
  ]: "Error thrown when writing to storage. Original error: {$originalErrorMessage}.",
  [
    "recaptcha-error"
    /* AppCheckError.RECAPTCHA_ERROR */
  ]: "ReCAPTCHA error.",
  [
    "initial-throttle"
    /* AppCheckError.INITIAL_THROTTLE */
  ]: `{$httpStatus} error. Attempts allowed again after {$time}`,
  [
    "throttled"
    /* AppCheckError.THROTTLED */
  ]: `Requests throttled due to previous {$httpStatus} error. Attempts allowed again after {$time}`
};
var ERROR_FACTORY2 = new ErrorFactory("appCheck", "AppCheck", ERRORS2);
function ensureActivated(app2) {
  if (!getStateReference(app2).activated) {
    throw ERROR_FACTORY2.create("use-before-activation", {
      appName: app2.name
    });
  }
}
async function exchangeToken({ url, body }, heartbeatServiceProvider) {
  const headers = {
    "Content-Type": "application/json"
  };
  const heartbeatService = heartbeatServiceProvider.getImmediate({
    optional: true
  });
  if (heartbeatService) {
    const heartbeatsHeader = await heartbeatService.getHeartbeatsHeader();
    if (heartbeatsHeader) {
      headers["X-Firebase-Client"] = heartbeatsHeader;
    }
  }
  const options = {
    method: "POST",
    body: JSON.stringify(body),
    headers
  };
  let response;
  try {
    response = await fetch(url, options);
  } catch (originalError) {
    throw ERROR_FACTORY2.create("fetch-network-error", {
      originalErrorMessage: originalError?.message
    });
  }
  if (response.status !== 200) {
    throw ERROR_FACTORY2.create("fetch-status-error", {
      httpStatus: response.status
    });
  }
  let responseBody;
  try {
    responseBody = await response.json();
  } catch (originalError) {
    throw ERROR_FACTORY2.create("fetch-parse-error", {
      originalErrorMessage: originalError?.message
    });
  }
  const match = responseBody.ttl.match(/^([\d.]+)(s)$/);
  if (!match || !match[2] || isNaN(Number(match[1]))) {
    throw ERROR_FACTORY2.create("fetch-parse-error", {
      originalErrorMessage: `ttl field (timeToLive) is not in standard Protobuf Duration format: ${responseBody.ttl}`
    });
  }
  const timeToLiveAsNumber = Number(match[1]) * 1e3;
  const now = Date.now();
  return {
    token: responseBody.token,
    expireTimeMillis: now + timeToLiveAsNumber,
    issuedAtTimeMillis: now
  };
}
function getExchangeDebugTokenRequest(app2, debugToken) {
  const { projectId, appId, apiKey } = app2.options;
  return {
    url: `${BASE_ENDPOINT}/projects/${projectId}/apps/${appId}:${EXCHANGE_DEBUG_TOKEN_METHOD}?key=${apiKey}`,
    body: {
      // eslint-disable-next-line
      debug_token: debugToken
    }
  };
}
var DB_NAME2 = "firebase-app-check-database";
var DB_VERSION2 = 1;
var STORE_NAME2 = "firebase-app-check-store";
var DEBUG_TOKEN_KEY = "debug-token";
var dbPromise2 = null;
function getDBPromise() {
  if (dbPromise2) {
    return dbPromise2;
  }
  dbPromise2 = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME2, DB_VERSION2);
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        reject(ERROR_FACTORY2.create("storage-open", {
          originalErrorMessage: event.target.error?.message
        }));
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        switch (event.oldVersion) {
          case 0:
            db.createObjectStore(STORE_NAME2, {
              keyPath: "compositeKey"
            });
        }
      };
    } catch (e) {
      reject(ERROR_FACTORY2.create("storage-open", {
        originalErrorMessage: e?.message
      }));
    }
  });
  return dbPromise2;
}
function readTokenFromIndexedDB(app2) {
  return read(computeKey2(app2));
}
function writeTokenToIndexedDB(app2, token) {
  return write(computeKey2(app2), token);
}
function writeDebugTokenToIndexedDB(token) {
  return write(DEBUG_TOKEN_KEY, token);
}
function readDebugTokenFromIndexedDB() {
  return read(DEBUG_TOKEN_KEY);
}
async function write(key, value) {
  const db = await getDBPromise();
  const transaction = db.transaction(STORE_NAME2, "readwrite");
  const store = transaction.objectStore(STORE_NAME2);
  const request = store.put({
    compositeKey: key,
    value
  });
  return new Promise((resolve, reject) => {
    request.onsuccess = (_event) => {
      resolve();
    };
    transaction.onerror = (event) => {
      reject(ERROR_FACTORY2.create("storage-set", {
        originalErrorMessage: event.target.error?.message
      }));
    };
  });
}
async function read(key) {
  const db = await getDBPromise();
  const transaction = db.transaction(STORE_NAME2, "readonly");
  const store = transaction.objectStore(STORE_NAME2);
  const request = store.get(key);
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const result = event.target.result;
      if (result) {
        resolve(result.value);
      } else {
        resolve(void 0);
      }
    };
    transaction.onerror = (event) => {
      reject(ERROR_FACTORY2.create("storage-get", {
        originalErrorMessage: event.target.error?.message
      }));
    };
  });
}
function computeKey2(app2) {
  return `${app2.options.appId}-${app2.name}`;
}
var logger2 = new Logger("@firebase/app-check");
async function readTokenFromStorage(app2) {
  if (isIndexedDBAvailable()) {
    let token = void 0;
    try {
      token = await readTokenFromIndexedDB(app2);
    } catch (e) {
      logger2.warn(`Failed to read token from IndexedDB. Error: ${e}`);
    }
    return token;
  }
  return void 0;
}
function writeTokenToStorage(app2, token) {
  if (isIndexedDBAvailable()) {
    return writeTokenToIndexedDB(app2, token).catch((e) => {
      logger2.warn(`Failed to write token to IndexedDB. Error: ${e}`);
    });
  }
  return Promise.resolve();
}
async function readOrCreateDebugTokenFromStorage() {
  let existingDebugToken = void 0;
  try {
    existingDebugToken = await readDebugTokenFromIndexedDB();
  } catch (_e) {
  }
  if (!existingDebugToken) {
    const newToken = crypto.randomUUID();
    writeDebugTokenToIndexedDB(newToken).catch((e) => logger2.warn(`Failed to persist debug token to IndexedDB. Error: ${e}`));
    return newToken;
  } else {
    return existingDebugToken;
  }
}
function isDebugMode() {
  const debugState = getDebugState();
  return debugState.enabled;
}
async function getDebugToken() {
  const state = getDebugState();
  if (state.enabled && state.token) {
    return state.token.promise;
  } else {
    throw Error(`
            Can't get debug token in production mode.
        `);
  }
}
function initializeDebugMode() {
  const globals = getGlobal();
  const debugState = getDebugState();
  debugState.initialized = true;
  if (typeof globals.FIREBASE_APPCHECK_DEBUG_TOKEN !== "string" && globals.FIREBASE_APPCHECK_DEBUG_TOKEN !== true) {
    return;
  }
  debugState.enabled = true;
  const deferredToken = new Deferred();
  debugState.token = deferredToken;
  if (typeof globals.FIREBASE_APPCHECK_DEBUG_TOKEN === "string") {
    deferredToken.resolve(globals.FIREBASE_APPCHECK_DEBUG_TOKEN);
  } else {
    deferredToken.resolve(readOrCreateDebugTokenFromStorage());
  }
}
var defaultTokenErrorData = { error: "UNKNOWN_ERROR" };
function formatDummyToken(tokenErrorData) {
  return base64.encodeString(
    JSON.stringify(tokenErrorData),
    /* webSafe= */
    false
  );
}
async function getToken$2(appCheck2, forceRefresh = false, shouldLogErrors = false) {
  const app2 = appCheck2.app;
  ensureActivated(app2);
  const state = getStateReference(app2);
  let token = state.token;
  let error = void 0;
  if (token && !isValid(token)) {
    state.token = void 0;
    token = void 0;
  }
  if (!token) {
    const cachedToken = await state.cachedTokenPromise;
    if (cachedToken) {
      if (isValid(cachedToken)) {
        token = cachedToken;
      } else {
        await writeTokenToStorage(app2, void 0);
      }
    }
  }
  if (!forceRefresh && token && isValid(token)) {
    return {
      token: token.token
    };
  }
  let shouldCallListeners = false;
  if (isDebugMode()) {
    try {
      if (!state.exchangeTokenPromise) {
        state.exchangeTokenPromise = exchangeToken(getExchangeDebugTokenRequest(app2, await getDebugToken()), appCheck2.heartbeatServiceProvider).finally(() => {
          state.exchangeTokenPromise = void 0;
        });
        shouldCallListeners = true;
      }
      const tokenFromDebugExchange = await state.exchangeTokenPromise;
      await writeTokenToStorage(app2, tokenFromDebugExchange);
      state.token = tokenFromDebugExchange;
      return { token: tokenFromDebugExchange.token };
    } catch (e) {
      if (e.code === `appCheck/${"throttled"}` || e.code === `appCheck/${"initial-throttle"}`) {
        logger2.warn(e.message);
      } else if (shouldLogErrors) {
        logger2.error(e);
      }
      return makeDummyTokenResult(e);
    }
  }
  try {
    if (!state.exchangeTokenPromise) {
      state.exchangeTokenPromise = state.provider.getToken().finally(() => {
        state.exchangeTokenPromise = void 0;
      });
      shouldCallListeners = true;
    }
    token = await getStateReference(app2).exchangeTokenPromise;
  } catch (e) {
    if (e.code === `appCheck/${"throttled"}` || e.code === `appCheck/${"initial-throttle"}`) {
      logger2.warn(e.message);
    } else if (shouldLogErrors) {
      logger2.error(e);
    }
    error = e;
  }
  let interopTokenResult;
  if (!token) {
    interopTokenResult = makeDummyTokenResult(error);
  } else if (error) {
    if (isValid(token)) {
      interopTokenResult = {
        token: token.token,
        internalError: error
      };
    } else {
      interopTokenResult = makeDummyTokenResult(error);
    }
  } else {
    interopTokenResult = {
      token: token.token
    };
    state.token = token;
    await writeTokenToStorage(app2, token);
  }
  if (shouldCallListeners) {
    notifyTokenListeners(app2, interopTokenResult);
  }
  return interopTokenResult;
}
async function getLimitedUseToken$1(appCheck2) {
  const app2 = appCheck2.app;
  ensureActivated(app2);
  const { provider } = getStateReference(app2);
  if (isDebugMode()) {
    const debugToken = await getDebugToken();
    const { token } = await exchangeToken(getExchangeDebugTokenRequest(app2, debugToken), appCheck2.heartbeatServiceProvider);
    return { token };
  } else {
    const { token } = await provider.getToken();
    return { token };
  }
}
function addTokenListener(appCheck2, type, listener, onError) {
  const { app: app2 } = appCheck2;
  const state = getStateReference(app2);
  const tokenObserver = {
    next: listener,
    error: onError,
    type
  };
  state.tokenObservers = [...state.tokenObservers, tokenObserver];
  if (state.token && isValid(state.token)) {
    const validToken = state.token;
    Promise.resolve().then(() => {
      listener({ token: validToken.token });
      initTokenRefresher(appCheck2);
    }).catch(() => {
    });
  }
  void state.cachedTokenPromise.then(() => initTokenRefresher(appCheck2));
}
function removeTokenListener(app2, listener) {
  const state = getStateReference(app2);
  const newObservers = state.tokenObservers.filter((tokenObserver) => tokenObserver.next !== listener);
  if (newObservers.length === 0 && state.tokenRefresher && state.tokenRefresher.isRunning()) {
    state.tokenRefresher.stop();
  }
  state.tokenObservers = newObservers;
}
function initTokenRefresher(appCheck2) {
  const { app: app2 } = appCheck2;
  const state = getStateReference(app2);
  let refresher = state.tokenRefresher;
  if (!refresher) {
    refresher = createTokenRefresher(appCheck2);
    state.tokenRefresher = refresher;
  }
  if (!refresher.isRunning() && state.isTokenAutoRefreshEnabled) {
    refresher.start();
  }
}
function createTokenRefresher(appCheck2) {
  const { app: app2 } = appCheck2;
  return new Refresher(
    // Keep in mind when this fails for any reason other than the ones
    // for which we should retry, it will effectively stop the proactive refresh.
    async () => {
      const state = getStateReference(app2);
      let result;
      if (!state.token) {
        result = await getToken$2(appCheck2);
      } else {
        result = await getToken$2(appCheck2, true);
      }
      if (result.error) {
        throw result.error;
      }
      if (result.internalError) {
        throw result.internalError;
      }
    },
    () => {
      return true;
    },
    () => {
      const state = getStateReference(app2);
      if (state.token) {
        let nextRefreshTimeMillis = state.token.issuedAtTimeMillis + (state.token.expireTimeMillis - state.token.issuedAtTimeMillis) * 0.5 + 5 * 60 * 1e3;
        const latestAllowableRefresh = state.token.expireTimeMillis - 5 * 60 * 1e3;
        nextRefreshTimeMillis = Math.min(nextRefreshTimeMillis, latestAllowableRefresh);
        return Math.max(0, nextRefreshTimeMillis - Date.now());
      } else {
        return 0;
      }
    },
    TOKEN_REFRESH_TIME.RETRIAL_MIN_WAIT,
    TOKEN_REFRESH_TIME.RETRIAL_MAX_WAIT
  );
}
function notifyTokenListeners(app2, token) {
  const observers = getStateReference(app2).tokenObservers;
  for (const observer of observers) {
    try {
      if (observer.type === "EXTERNAL" && token.error != null) {
        observer.error(token.error);
      } else {
        observer.next(token);
      }
    } catch (e) {
    }
  }
}
function isValid(token) {
  return token.expireTimeMillis - Date.now() > 0;
}
function makeDummyTokenResult(error) {
  return {
    token: formatDummyToken(defaultTokenErrorData),
    error
  };
}
var AppCheckService = class {
  constructor(app2, heartbeatServiceProvider) {
    this.app = app2;
    this.heartbeatServiceProvider = heartbeatServiceProvider;
  }
  _delete() {
    const { tokenObservers } = getStateReference(this.app);
    for (const tokenObserver of tokenObservers) {
      removeTokenListener(this.app, tokenObserver.next);
    }
    return Promise.resolve();
  }
};
function factory(app2, heartbeatServiceProvider) {
  return new AppCheckService(app2, heartbeatServiceProvider);
}
function internalFactory(appCheck2) {
  return {
    getToken: (forceRefresh) => getToken$2(appCheck2, forceRefresh),
    getLimitedUseToken: () => getLimitedUseToken$1(appCheck2),
    addTokenListener: (listener) => addTokenListener(appCheck2, "INTERNAL", listener),
    removeTokenListener: (listener) => removeTokenListener(appCheck2.app, listener)
  };
}
var name3 = "@firebase/app-check";
var version2 = "0.11.0";
var CustomProvider = class _CustomProvider {
  constructor(_customProviderOptions) {
    this._customProviderOptions = _customProviderOptions;
  }
  /**
   * @internal
   */
  async getToken() {
    const customToken = await this._customProviderOptions.getToken();
    const issuedAtTimeSeconds = issuedAtTime(customToken.token);
    const issuedAtTimeMillis = issuedAtTimeSeconds !== null && issuedAtTimeSeconds < Date.now() && issuedAtTimeSeconds > 0 ? issuedAtTimeSeconds * 1e3 : Date.now();
    return { ...customToken, issuedAtTimeMillis };
  }
  /**
   * @internal
   */
  initialize(app2) {
    this._app = app2;
  }
  /**
   * @internal
   */
  isEqual(otherProvider) {
    if (otherProvider instanceof _CustomProvider) {
      return this._customProviderOptions.getToken.toString() === otherProvider._customProviderOptions.getToken.toString();
    } else {
      return false;
    }
  }
};
function initializeAppCheck(app2 = getApp(), options) {
  app2 = getModularInstance(app2);
  const provider = _getProvider(app2, "app-check");
  if (!getDebugState().initialized) {
    initializeDebugMode();
  }
  if (isDebugMode()) {
    void getDebugToken().then((token) => (
      // Not using logger because I don't think we ever want this accidentally hidden.
      console.log(`App Check debug token: ${token}. You will need to add it to your app's App Check settings in the Firebase console for it to work.`)
    ));
  }
  if (provider.isInitialized()) {
    const existingInstance = provider.getImmediate();
    const initialOptions = provider.getOptions();
    if (initialOptions.isTokenAutoRefreshEnabled === options.isTokenAutoRefreshEnabled && initialOptions.provider.isEqual(options.provider)) {
      return existingInstance;
    } else {
      throw ERROR_FACTORY2.create("already-initialized", {
        appName: app2.name
      });
    }
  }
  const appCheck2 = provider.initialize({ options });
  _activate(app2, options.provider, options.isTokenAutoRefreshEnabled);
  if (getStateReference(app2).isTokenAutoRefreshEnabled) {
    addTokenListener(appCheck2, "INTERNAL", () => {
    });
  }
  return appCheck2;
}
function _activate(app2, provider, isTokenAutoRefreshEnabled = false) {
  const state = setInitialState(app2, { ...DEFAULT_STATE });
  state.activated = true;
  state.provider = provider;
  state.cachedTokenPromise = readTokenFromStorage(app2).then((cachedToken) => {
    if (cachedToken && isValid(cachedToken)) {
      state.token = cachedToken;
      notifyTokenListeners(app2, { token: cachedToken.token });
    }
    return cachedToken;
  });
  state.isTokenAutoRefreshEnabled = isTokenAutoRefreshEnabled && app2.automaticDataCollectionEnabled;
  if (!app2.automaticDataCollectionEnabled && isTokenAutoRefreshEnabled) {
    logger2.warn("`isTokenAutoRefreshEnabled` is true but `automaticDataCollectionEnabled` was set to false during `initializeApp()`. This blocks automatic token refresh.");
  }
  state.provider.initialize(app2);
}
var APP_CHECK_NAME = "app-check";
var APP_CHECK_NAME_INTERNAL = "app-check-internal";
function registerAppCheck() {
  _registerComponent(new Component(
    APP_CHECK_NAME,
    (container) => {
      const app2 = container.getProvider("app").getImmediate();
      const heartbeatServiceProvider = container.getProvider("heartbeat");
      return factory(app2, heartbeatServiceProvider);
    },
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ).setInstanceCreatedCallback((container, _identifier, _appcheckService) => {
    container.getProvider(APP_CHECK_NAME_INTERNAL).initialize();
  }));
  _registerComponent(new Component(
    APP_CHECK_NAME_INTERNAL,
    (container) => {
      const appCheck2 = container.getProvider("app-check").getImmediate();
      return internalFactory(appCheck2);
    },
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setInstantiationMode(
    "EXPLICIT"
    /* InstantiationMode.EXPLICIT */
  ));
  registerVersion(name3, version2);
}
registerAppCheck();

// node_modules/@firebase/ai/dist/esm/index.esm.js
var name4 = "@firebase/ai";
var version3 = "2.4.0";
var AI_TYPE = "AI";
var DEFAULT_LOCATION = "us-central1";
var DEFAULT_DOMAIN = "firebasevertexai.googleapis.com";
var DEFAULT_API_VERSION = "v1beta";
var PACKAGE_VERSION = version3;
var LANGUAGE_TAG = "gl-js";
var DEFAULT_FETCH_TIMEOUT_MS = 180 * 1e3;
var DEFAULT_HYBRID_IN_CLOUD_MODEL = "gemini-2.0-flash-lite";
var AIError = class _AIError extends FirebaseError {
  /**
   * Constructs a new instance of the `AIError` class.
   *
   * @param code - The error code from {@link (AIErrorCode:type)}.
   * @param message - A human-readable message describing the error.
   * @param customErrorData - Optional error data.
   */
  constructor(code, message, customErrorData) {
    const service = AI_TYPE;
    const fullCode = `${service}/${code}`;
    const fullMessage = `${service}: ${message} (${fullCode})`;
    super(code, fullMessage);
    this.code = code;
    this.customErrorData = customErrorData;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _AIError);
    }
    Object.setPrototypeOf(this, _AIError.prototype);
    this.toString = () => fullMessage;
  }
};
var POSSIBLE_ROLES = ["user", "model", "function", "system"];
var HarmSeverity = {
  /**
   * Negligible level of harm severity.
   */
  HARM_SEVERITY_NEGLIGIBLE: "HARM_SEVERITY_NEGLIGIBLE",
  /**
   * Low level of harm severity.
   */
  HARM_SEVERITY_LOW: "HARM_SEVERITY_LOW",
  /**
   * Medium level of harm severity.
   */
  HARM_SEVERITY_MEDIUM: "HARM_SEVERITY_MEDIUM",
  /**
   * High level of harm severity.
   */
  HARM_SEVERITY_HIGH: "HARM_SEVERITY_HIGH",
  /**
   * Harm severity is not supported.
   *
   * @remarks
   * The GoogleAI backend does not support `HarmSeverity`, so this value is used as a fallback.
   */
  HARM_SEVERITY_UNSUPPORTED: "HARM_SEVERITY_UNSUPPORTED"
};
var FinishReason = {
  /**
   * Natural stop point of the model or provided stop sequence.
   */
  STOP: "STOP",
  /**
   * The maximum number of tokens as specified in the request was reached.
   */
  MAX_TOKENS: "MAX_TOKENS",
  /**
   * The candidate content was flagged for safety reasons.
   */
  SAFETY: "SAFETY",
  /**
   * The candidate content was flagged for recitation reasons.
   */
  RECITATION: "RECITATION",
  /**
   * Unknown reason.
   */
  OTHER: "OTHER",
  /**
   * The candidate content contained forbidden terms.
   */
  BLOCKLIST: "BLOCKLIST",
  /**
   * The candidate content potentially contained prohibited content.
   */
  PROHIBITED_CONTENT: "PROHIBITED_CONTENT",
  /**
   * The candidate content potentially contained Sensitive Personally Identifiable Information (SPII).
   */
  SPII: "SPII",
  /**
   * The function call generated by the model was invalid.
   */
  MALFORMED_FUNCTION_CALL: "MALFORMED_FUNCTION_CALL"
};
var InferenceMode = {
  "PREFER_ON_DEVICE": "prefer_on_device",
  "ONLY_ON_DEVICE": "only_on_device",
  "ONLY_IN_CLOUD": "only_in_cloud",
  "PREFER_IN_CLOUD": "prefer_in_cloud"
};
var AIErrorCode = {
  /** A generic error occurred. */
  ERROR: "error",
  /** An error occurred in a request. */
  REQUEST_ERROR: "request-error",
  /** An error occurred in a response. */
  RESPONSE_ERROR: "response-error",
  /** An error occurred while performing a fetch. */
  FETCH_ERROR: "fetch-error",
  /** An error occurred because an operation was attempted on a closed session. */
  SESSION_CLOSED: "session-closed",
  /** An error associated with a Content object.  */
  INVALID_CONTENT: "invalid-content",
  /** An error due to the Firebase API not being enabled in the Console. */
  API_NOT_ENABLED: "api-not-enabled",
  /** An error due to invalid Schema input.  */
  INVALID_SCHEMA: "invalid-schema",
  /** An error occurred due to a missing Firebase API key. */
  NO_API_KEY: "no-api-key",
  /** An error occurred due to a missing Firebase app ID. */
  NO_APP_ID: "no-app-id",
  /** An error occurred due to a model name not being specified during initialization. */
  NO_MODEL: "no-model",
  /** An error occurred due to a missing project ID. */
  NO_PROJECT_ID: "no-project-id",
  /** An error occurred while parsing. */
  PARSE_FAILED: "parse-failed",
  /** An error occurred due an attempt to use an unsupported feature. */
  UNSUPPORTED: "unsupported"
};
var BackendType = {
  /**
   * Identifies the backend service for the Vertex AI Gemini API provided through Google Cloud.
   * Use this constant when creating a {@link VertexAIBackend} configuration.
   */
  VERTEX_AI: "VERTEX_AI",
  /**
   * Identifies the backend service for the Gemini Developer API ({@link https://ai.google/ | Google AI}).
   * Use this constant when creating a {@link GoogleAIBackend} configuration.
   */
  GOOGLE_AI: "GOOGLE_AI"
};
var Backend = class {
  /**
   * Protected constructor for use by subclasses.
   * @param type - The backend type.
   */
  constructor(type) {
    this.backendType = type;
  }
};
var GoogleAIBackend = class extends Backend {
  /**
   * Creates a configuration object for the Gemini Developer API backend.
   */
  constructor() {
    super(BackendType.GOOGLE_AI);
  }
};
var VertexAIBackend = class extends Backend {
  /**
   * Creates a configuration object for the Vertex AI backend.
   *
   * @param location - The region identifier, defaulting to `us-central1`;
   * see {@link https://firebase.google.com/docs/vertex-ai/locations#available-locations | Vertex AI locations}
   * for a list of supported locations.
   */
  constructor(location = DEFAULT_LOCATION) {
    super(BackendType.VERTEX_AI);
    if (!location) {
      this.location = DEFAULT_LOCATION;
    } else {
      this.location = location;
    }
  }
};
function encodeInstanceIdentifier(backend) {
  if (backend instanceof GoogleAIBackend) {
    return `${AI_TYPE}/googleai`;
  } else if (backend instanceof VertexAIBackend) {
    return `${AI_TYPE}/vertexai/${backend.location}`;
  } else {
    throw new AIError(AIErrorCode.ERROR, `Invalid backend: ${JSON.stringify(backend.backendType)}`);
  }
}
function decodeInstanceIdentifier(instanceIdentifier) {
  const identifierParts = instanceIdentifier.split("/");
  if (identifierParts[0] !== AI_TYPE) {
    throw new AIError(AIErrorCode.ERROR, `Invalid instance identifier, unknown prefix '${identifierParts[0]}'`);
  }
  const backendType = identifierParts[1];
  switch (backendType) {
    case "vertexai":
      const location = identifierParts[2];
      if (!location) {
        throw new AIError(AIErrorCode.ERROR, `Invalid instance identifier, unknown location '${instanceIdentifier}'`);
      }
      return new VertexAIBackend(location);
    case "googleai":
      return new GoogleAIBackend();
    default:
      throw new AIError(AIErrorCode.ERROR, `Invalid instance identifier string: '${instanceIdentifier}'`);
  }
}
var logger3 = new Logger("@firebase/vertexai");
var Availability;
(function(Availability2) {
  Availability2["UNAVAILABLE"] = "unavailable";
  Availability2["DOWNLOADABLE"] = "downloadable";
  Availability2["DOWNLOADING"] = "downloading";
  Availability2["AVAILABLE"] = "available";
})(Availability || (Availability = {}));
var ChromeAdapterImpl = class _ChromeAdapterImpl {
  constructor(languageModelProvider, mode, onDeviceParams = {
    createOptions: {
      // Defaults to support image inputs for convenience.
      expectedInputs: [{ type: "image" }]
    }
  }) {
    this.languageModelProvider = languageModelProvider;
    this.mode = mode;
    this.onDeviceParams = onDeviceParams;
    this.isDownloading = false;
  }
  /**
   * Checks if a given request can be made on-device.
   *
   * Encapsulates a few concerns:
   *   the mode
   *   API existence
   *   prompt formatting
   *   model availability, including triggering download if necessary
   *
   *
   * Pros: callers needn't be concerned with details of on-device availability.</p>
   * Cons: this method spans a few concerns and splits request validation from usage.
   * If instance variables weren't already part of the API, we could consider a better
   * separation of concerns.
   */
  async isAvailable(request) {
    if (!this.mode) {
      logger3.debug(`On-device inference unavailable because mode is undefined.`);
      return false;
    }
    if (this.mode === InferenceMode.ONLY_IN_CLOUD) {
      logger3.debug(`On-device inference unavailable because mode is "only_in_cloud".`);
      return false;
    }
    const availability = await this.downloadIfAvailable();
    if (this.mode === InferenceMode.ONLY_ON_DEVICE) {
      if (availability === Availability.UNAVAILABLE) {
        throw new AIError(AIErrorCode.API_NOT_ENABLED, "Local LanguageModel API not available in this environment.");
      } else if (availability === Availability.DOWNLOADABLE || availability === Availability.DOWNLOADING) {
        logger3.debug(`Waiting for download of LanguageModel to complete.`);
        await this.downloadPromise;
        return true;
      }
      return true;
    }
    if (availability !== Availability.AVAILABLE) {
      logger3.debug(`On-device inference unavailable because availability is "${availability}".`);
      return false;
    }
    if (!_ChromeAdapterImpl.isOnDeviceRequest(request)) {
      logger3.debug(`On-device inference unavailable because request is incompatible.`);
      return false;
    }
    return true;
  }
  /**
   * Generates content on device.
   *
   * @remarks
   * This is comparable to {@link GenerativeModel.generateContent} for generating content in
   * Cloud.
   * @param request - a standard Firebase AI {@link GenerateContentRequest}
   * @returns {@link Response}, so we can reuse common response formatting.
   */
  async generateContent(request) {
    const session = await this.createSession();
    const contents = await Promise.all(request.contents.map(_ChromeAdapterImpl.toLanguageModelMessage));
    const text = await session.prompt(contents, this.onDeviceParams.promptOptions);
    return _ChromeAdapterImpl.toResponse(text);
  }
  /**
   * Generates content stream on device.
   *
   * @remarks
   * This is comparable to {@link GenerativeModel.generateContentStream} for generating content in
   * Cloud.
   * @param request - a standard Firebase AI {@link GenerateContentRequest}
   * @returns {@link Response}, so we can reuse common response formatting.
   */
  async generateContentStream(request) {
    const session = await this.createSession();
    const contents = await Promise.all(request.contents.map(_ChromeAdapterImpl.toLanguageModelMessage));
    const stream = session.promptStreaming(contents, this.onDeviceParams.promptOptions);
    return _ChromeAdapterImpl.toStreamResponse(stream);
  }
  async countTokens(_request) {
    throw new AIError(AIErrorCode.REQUEST_ERROR, "Count Tokens is not yet available for on-device model.");
  }
  /**
   * Asserts inference for the given request can be performed by an on-device model.
   */
  static isOnDeviceRequest(request) {
    if (request.contents.length === 0) {
      logger3.debug("Empty prompt rejected for on-device inference.");
      return false;
    }
    for (const content of request.contents) {
      if (content.role === "function") {
        logger3.debug(`"Function" role rejected for on-device inference.`);
        return false;
      }
      for (const part of content.parts) {
        if (part.inlineData && _ChromeAdapterImpl.SUPPORTED_MIME_TYPES.indexOf(part.inlineData.mimeType) === -1) {
          logger3.debug(`Unsupported mime type "${part.inlineData.mimeType}" rejected for on-device inference.`);
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Encapsulates logic to get availability and download a model if one is downloadable.
   */
  async downloadIfAvailable() {
    const availability = await this.languageModelProvider?.availability(this.onDeviceParams.createOptions);
    if (availability === Availability.DOWNLOADABLE) {
      this.download();
    }
    return availability;
  }
  /**
   * Triggers out-of-band download of an on-device model.
   *
   * Chrome only downloads models as needed. Chrome knows a model is needed when code calls
   * LanguageModel.create.
   *
   * Since Chrome manages the download, the SDK can only avoid redundant download requests by
   * tracking if a download has previously been requested.
   */
  download() {
    if (this.isDownloading) {
      return;
    }
    this.isDownloading = true;
    this.downloadPromise = this.languageModelProvider?.create(this.onDeviceParams.createOptions).finally(() => {
      this.isDownloading = false;
    });
  }
  /**
   * Converts Firebase AI {@link Content} object to a Chrome {@link LanguageModelMessage} object.
   */
  static async toLanguageModelMessage(content) {
    const languageModelMessageContents = await Promise.all(content.parts.map(_ChromeAdapterImpl.toLanguageModelMessageContent));
    return {
      role: _ChromeAdapterImpl.toLanguageModelMessageRole(content.role),
      content: languageModelMessageContents
    };
  }
  /**
   * Converts a Firebase AI Part object to a Chrome LanguageModelMessageContent object.
   */
  static async toLanguageModelMessageContent(part) {
    if (part.text) {
      return {
        type: "text",
        value: part.text
      };
    } else if (part.inlineData) {
      const formattedImageContent = await fetch(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      const imageBlob = await formattedImageContent.blob();
      const imageBitmap = await createImageBitmap(imageBlob);
      return {
        type: "image",
        value: imageBitmap
      };
    }
    throw new AIError(AIErrorCode.REQUEST_ERROR, `Processing of this Part type is not currently supported.`);
  }
  /**
   * Converts a Firebase AI {@link Role} string to a {@link LanguageModelMessageRole} string.
   */
  static toLanguageModelMessageRole(role) {
    return role === "model" ? "assistant" : "user";
  }
  /**
   * Abstracts Chrome session creation.
   *
   * Chrome uses a multi-turn session for all inference. Firebase AI uses single-turn for all
   * inference. To map the Firebase AI API to Chrome's API, the SDK creates a new session for all
   * inference.
   *
   * Chrome will remove a model from memory if it's no longer in use, so this method ensures a
   * new session is created before an old session is destroyed.
   */
  async createSession() {
    if (!this.languageModelProvider) {
      throw new AIError(AIErrorCode.UNSUPPORTED, "Chrome AI requested for unsupported browser version.");
    }
    const newSession = await this.languageModelProvider.create(this.onDeviceParams.createOptions);
    if (this.oldSession) {
      this.oldSession.destroy();
    }
    this.oldSession = newSession;
    return newSession;
  }
  /**
   * Formats string returned by Chrome as a {@link Response} returned by Firebase AI.
   */
  static toResponse(text) {
    return {
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text }]
            }
          }
        ]
      })
    };
  }
  /**
   * Formats string stream returned by Chrome as SSE returned by Firebase AI.
   */
  static toStreamResponse(stream) {
    const encoder = new TextEncoder();
    return {
      body: stream.pipeThrough(new TransformStream({
        transform(chunk, controller) {
          const json = JSON.stringify({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [{ text: chunk }]
                }
              }
            ]
          });
          controller.enqueue(encoder.encode(`data: ${json}

`));
        }
      }))
    };
  }
};
ChromeAdapterImpl.SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png"];
function chromeAdapterFactory(mode, window2, params) {
  if (typeof window2 !== "undefined" && mode) {
    return new ChromeAdapterImpl(window2.LanguageModel, mode, params);
  }
}
var AIService = class {
  constructor(app2, backend, authProvider, appCheckProvider, chromeAdapterFactory2) {
    this.app = app2;
    this.backend = backend;
    this.chromeAdapterFactory = chromeAdapterFactory2;
    const appCheck2 = appCheckProvider?.getImmediate({ optional: true });
    const auth = authProvider?.getImmediate({ optional: true });
    this.auth = auth || null;
    this.appCheck = appCheck2 || null;
    if (backend instanceof VertexAIBackend) {
      this.location = backend.location;
    } else {
      this.location = "";
    }
  }
  _delete() {
    return Promise.resolve();
  }
  set options(optionsToSet) {
    this._options = optionsToSet;
  }
  get options() {
    return this._options;
  }
};
function factory2(container, { instanceIdentifier }) {
  if (!instanceIdentifier) {
    throw new AIError(AIErrorCode.ERROR, "AIService instance identifier is undefined.");
  }
  const backend = decodeInstanceIdentifier(instanceIdentifier);
  const app2 = container.getProvider("app").getImmediate();
  const auth = container.getProvider("auth-internal");
  const appCheckProvider = container.getProvider("app-check-internal");
  return new AIService(app2, backend, auth, appCheckProvider, chromeAdapterFactory);
}
var AIModel = class _AIModel {
  /**
   * Constructs a new instance of the {@link AIModel} class.
   *
   * This constructor should only be called from subclasses that provide
   * a model API.
   *
   * @param ai - an {@link AI} instance.
   * @param modelName - The name of the model being used. It can be in one of the following formats:
   * - `my-model` (short name, will resolve to `publishers/google/models/my-model`)
   * - `models/my-model` (will resolve to `publishers/google/models/my-model`)
   * - `publishers/my-publisher/models/my-model` (fully qualified model name)
   *
   * @throws If the `apiKey` or `projectId` fields are missing in your
   * Firebase config.
   *
   * @internal
   */
  constructor(ai2, modelName) {
    if (!ai2.app?.options?.apiKey) {
      throw new AIError(AIErrorCode.NO_API_KEY, `The "apiKey" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid API key.`);
    } else if (!ai2.app?.options?.projectId) {
      throw new AIError(AIErrorCode.NO_PROJECT_ID, `The "projectId" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid project ID.`);
    } else if (!ai2.app?.options?.appId) {
      throw new AIError(AIErrorCode.NO_APP_ID, `The "appId" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid app ID.`);
    } else {
      this._apiSettings = {
        apiKey: ai2.app.options.apiKey,
        project: ai2.app.options.projectId,
        appId: ai2.app.options.appId,
        automaticDataCollectionEnabled: ai2.app.automaticDataCollectionEnabled,
        location: ai2.location,
        backend: ai2.backend
      };
      if (_isFirebaseServerApp(ai2.app) && ai2.app.settings.appCheckToken) {
        const token = ai2.app.settings.appCheckToken;
        this._apiSettings.getAppCheckToken = () => {
          return Promise.resolve({ token });
        };
      } else if (ai2.appCheck) {
        if (ai2.options?.useLimitedUseAppCheckTokens) {
          this._apiSettings.getAppCheckToken = () => ai2.appCheck.getLimitedUseToken();
        } else {
          this._apiSettings.getAppCheckToken = () => ai2.appCheck.getToken();
        }
      }
      if (ai2.auth) {
        this._apiSettings.getAuthToken = () => ai2.auth.getToken();
      }
      this.model = _AIModel.normalizeModelName(modelName, this._apiSettings.backend.backendType);
    }
  }
  /**
   * Normalizes the given model name to a fully qualified model resource name.
   *
   * @param modelName - The model name to normalize.
   * @returns The fully qualified model resource name.
   *
   * @internal
   */
  static normalizeModelName(modelName, backendType) {
    if (backendType === BackendType.GOOGLE_AI) {
      return _AIModel.normalizeGoogleAIModelName(modelName);
    } else {
      return _AIModel.normalizeVertexAIModelName(modelName);
    }
  }
  /**
   * @internal
   */
  static normalizeGoogleAIModelName(modelName) {
    return `models/${modelName}`;
  }
  /**
   * @internal
   */
  static normalizeVertexAIModelName(modelName) {
    let model2;
    if (modelName.includes("/")) {
      if (modelName.startsWith("models/")) {
        model2 = `publishers/google/${modelName}`;
      } else {
        model2 = modelName;
      }
    } else {
      model2 = `publishers/google/models/${modelName}`;
    }
    return model2;
  }
};
var Task;
(function(Task2) {
  Task2["GENERATE_CONTENT"] = "generateContent";
  Task2["STREAM_GENERATE_CONTENT"] = "streamGenerateContent";
  Task2["COUNT_TOKENS"] = "countTokens";
  Task2["PREDICT"] = "predict";
})(Task || (Task = {}));
var RequestUrl = class {
  constructor(model2, task, apiSettings, stream, requestOptions) {
    this.model = model2;
    this.task = task;
    this.apiSettings = apiSettings;
    this.stream = stream;
    this.requestOptions = requestOptions;
  }
  toString() {
    const url = new URL(this.baseUrl);
    url.pathname = `/${this.apiVersion}/${this.modelPath}:${this.task}`;
    url.search = this.queryParams.toString();
    return url.toString();
  }
  get baseUrl() {
    return this.requestOptions?.baseUrl || `https://${DEFAULT_DOMAIN}`;
  }
  get apiVersion() {
    return DEFAULT_API_VERSION;
  }
  get modelPath() {
    if (this.apiSettings.backend instanceof GoogleAIBackend) {
      return `projects/${this.apiSettings.project}/${this.model}`;
    } else if (this.apiSettings.backend instanceof VertexAIBackend) {
      return `projects/${this.apiSettings.project}/locations/${this.apiSettings.backend.location}/${this.model}`;
    } else {
      throw new AIError(AIErrorCode.ERROR, `Invalid backend: ${JSON.stringify(this.apiSettings.backend)}`);
    }
  }
  get queryParams() {
    const params = new URLSearchParams();
    if (this.stream) {
      params.set("alt", "sse");
    }
    return params;
  }
};
function getClientHeaders() {
  const loggingTags = [];
  loggingTags.push(`${LANGUAGE_TAG}/${PACKAGE_VERSION}`);
  loggingTags.push(`fire/${PACKAGE_VERSION}`);
  return loggingTags.join(" ");
}
async function getHeaders(url) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("x-goog-api-client", getClientHeaders());
  headers.append("x-goog-api-key", url.apiSettings.apiKey);
  if (url.apiSettings.automaticDataCollectionEnabled) {
    headers.append("X-Firebase-Appid", url.apiSettings.appId);
  }
  if (url.apiSettings.getAppCheckToken) {
    const appCheckToken = await url.apiSettings.getAppCheckToken();
    if (appCheckToken) {
      headers.append("X-Firebase-AppCheck", appCheckToken.token);
      if (appCheckToken.error) {
        logger3.warn(`Unable to obtain a valid App Check token: ${appCheckToken.error.message}`);
      }
    }
  }
  if (url.apiSettings.getAuthToken) {
    const authToken = await url.apiSettings.getAuthToken();
    if (authToken) {
      headers.append("Authorization", `Firebase ${authToken.accessToken}`);
    }
  }
  return headers;
}
async function constructRequest(model2, task, apiSettings, stream, body, requestOptions) {
  const url = new RequestUrl(model2, task, apiSettings, stream, requestOptions);
  return {
    url: url.toString(),
    fetchOptions: {
      method: "POST",
      headers: await getHeaders(url),
      body
    }
  };
}
async function makeRequest(model2, task, apiSettings, stream, body, requestOptions) {
  const url = new RequestUrl(model2, task, apiSettings, stream, requestOptions);
  let response;
  let fetchTimeoutId;
  try {
    const request = await constructRequest(model2, task, apiSettings, stream, body, requestOptions);
    const timeoutMillis = requestOptions?.timeout != null && requestOptions.timeout >= 0 ? requestOptions.timeout : DEFAULT_FETCH_TIMEOUT_MS;
    const abortController = new AbortController();
    fetchTimeoutId = setTimeout(() => abortController.abort(), timeoutMillis);
    request.fetchOptions.signal = abortController.signal;
    response = await fetch(request.url, request.fetchOptions);
    if (!response.ok) {
      let message = "";
      let errorDetails;
      try {
        const json = await response.json();
        message = json.error.message;
        if (json.error.details) {
          message += ` ${JSON.stringify(json.error.details)}`;
          errorDetails = json.error.details;
        }
      } catch (e) {
      }
      if (response.status === 403 && errorDetails && errorDetails.some((detail) => detail.reason === "SERVICE_DISABLED") && errorDetails.some((detail) => detail.links?.[0]?.description.includes("Google developers console API activation"))) {
        throw new AIError(AIErrorCode.API_NOT_ENABLED, `The Firebase AI SDK requires the Firebase AI API ('firebasevertexai.googleapis.com') to be enabled in your Firebase project. Enable this API by visiting the Firebase Console at https://console.firebase.google.com/project/${url.apiSettings.project}/genai/ and clicking "Get started". If you enabled this API recently, wait a few minutes for the action to propagate to our systems and then retry.`, {
          status: response.status,
          statusText: response.statusText,
          errorDetails
        });
      }
      throw new AIError(AIErrorCode.FETCH_ERROR, `Error fetching from ${url}: [${response.status} ${response.statusText}] ${message}`, {
        status: response.status,
        statusText: response.statusText,
        errorDetails
      });
    }
  } catch (e) {
    let err = e;
    if (e.code !== AIErrorCode.FETCH_ERROR && e.code !== AIErrorCode.API_NOT_ENABLED && e instanceof Error) {
      err = new AIError(AIErrorCode.ERROR, `Error fetching from ${url.toString()}: ${e.message}`);
      err.stack = e.stack;
    }
    throw err;
  } finally {
    if (fetchTimeoutId) {
      clearTimeout(fetchTimeoutId);
    }
  }
  return response;
}
function hasValidCandidates(response) {
  if (response.candidates && response.candidates.length > 0) {
    if (response.candidates.length > 1) {
      logger3.warn(`This response had ${response.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`);
    }
    if (hadBadFinishReason(response.candidates[0])) {
      throw new AIError(AIErrorCode.RESPONSE_ERROR, `Response error: ${formatBlockErrorMessage(response)}. Response body stored in error.response`, {
        response
      });
    }
    return true;
  } else {
    return false;
  }
}
function createEnhancedContentResponse(response) {
  if (response.candidates && !response.candidates[0].hasOwnProperty("index")) {
    response.candidates[0].index = 0;
  }
  const responseWithHelpers = addHelpers(response);
  return responseWithHelpers;
}
function addHelpers(response) {
  response.text = () => {
    if (hasValidCandidates(response)) {
      return getText(response, (part) => !part.thought);
    } else if (response.promptFeedback) {
      throw new AIError(AIErrorCode.RESPONSE_ERROR, `Text not available. ${formatBlockErrorMessage(response)}`, {
        response
      });
    }
    return "";
  };
  response.thoughtSummary = () => {
    if (hasValidCandidates(response)) {
      const result = getText(response, (part) => !!part.thought);
      return result === "" ? void 0 : result;
    } else if (response.promptFeedback) {
      throw new AIError(AIErrorCode.RESPONSE_ERROR, `Thought summary not available. ${formatBlockErrorMessage(response)}`, {
        response
      });
    }
    return void 0;
  };
  response.inlineDataParts = () => {
    if (hasValidCandidates(response)) {
      return getInlineDataParts(response);
    } else if (response.promptFeedback) {
      throw new AIError(AIErrorCode.RESPONSE_ERROR, `Data not available. ${formatBlockErrorMessage(response)}`, {
        response
      });
    }
    return void 0;
  };
  response.functionCalls = () => {
    if (hasValidCandidates(response)) {
      return getFunctionCalls(response);
    } else if (response.promptFeedback) {
      throw new AIError(AIErrorCode.RESPONSE_ERROR, `Function call not available. ${formatBlockErrorMessage(response)}`, {
        response
      });
    }
    return void 0;
  };
  return response;
}
function getText(response, partFilter) {
  const textStrings = [];
  if (response.candidates?.[0].content?.parts) {
    for (const part of response.candidates?.[0].content?.parts) {
      if (part.text && partFilter(part)) {
        textStrings.push(part.text);
      }
    }
  }
  if (textStrings.length > 0) {
    return textStrings.join("");
  } else {
    return "";
  }
}
function getFunctionCalls(response) {
  const functionCalls = [];
  if (response.candidates?.[0].content?.parts) {
    for (const part of response.candidates?.[0].content?.parts) {
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
    }
  }
  if (functionCalls.length > 0) {
    return functionCalls;
  } else {
    return void 0;
  }
}
function getInlineDataParts(response) {
  const data = [];
  if (response.candidates?.[0].content?.parts) {
    for (const part of response.candidates?.[0].content?.parts) {
      if (part.inlineData) {
        data.push(part);
      }
    }
  }
  if (data.length > 0) {
    return data;
  } else {
    return void 0;
  }
}
var badFinishReasons = [FinishReason.RECITATION, FinishReason.SAFETY];
function hadBadFinishReason(candidate) {
  return !!candidate.finishReason && badFinishReasons.some((reason) => reason === candidate.finishReason);
}
function formatBlockErrorMessage(response) {
  let message = "";
  if ((!response.candidates || response.candidates.length === 0) && response.promptFeedback) {
    message += "Response was blocked";
    if (response.promptFeedback?.blockReason) {
      message += ` due to ${response.promptFeedback.blockReason}`;
    }
    if (response.promptFeedback?.blockReasonMessage) {
      message += `: ${response.promptFeedback.blockReasonMessage}`;
    }
  } else if (response.candidates?.[0]) {
    const firstCandidate = response.candidates[0];
    if (hadBadFinishReason(firstCandidate)) {
      message += `Candidate was blocked due to ${firstCandidate.finishReason}`;
      if (firstCandidate.finishMessage) {
        message += `: ${firstCandidate.finishMessage}`;
      }
    }
  }
  return message;
}
function mapGenerateContentRequest(generateContentRequest) {
  generateContentRequest.safetySettings?.forEach((safetySetting) => {
    if (safetySetting.method) {
      throw new AIError(AIErrorCode.UNSUPPORTED, "SafetySetting.method is not supported in the the Gemini Developer API. Please remove this property.");
    }
  });
  if (generateContentRequest.generationConfig?.topK) {
    const roundedTopK = Math.round(generateContentRequest.generationConfig.topK);
    if (roundedTopK !== generateContentRequest.generationConfig.topK) {
      logger3.warn("topK in GenerationConfig has been rounded to the nearest integer to match the format for requests to the Gemini Developer API.");
      generateContentRequest.generationConfig.topK = roundedTopK;
    }
  }
  return generateContentRequest;
}
function mapGenerateContentResponse(googleAIResponse) {
  const generateContentResponse = {
    candidates: googleAIResponse.candidates ? mapGenerateContentCandidates(googleAIResponse.candidates) : void 0,
    prompt: googleAIResponse.promptFeedback ? mapPromptFeedback(googleAIResponse.promptFeedback) : void 0,
    usageMetadata: googleAIResponse.usageMetadata
  };
  return generateContentResponse;
}
function mapCountTokensRequest(countTokensRequest, model2) {
  const mappedCountTokensRequest = {
    generateContentRequest: {
      model: model2,
      ...countTokensRequest
    }
  };
  return mappedCountTokensRequest;
}
function mapGenerateContentCandidates(candidates) {
  const mappedCandidates = [];
  let mappedSafetyRatings;
  if (mappedCandidates) {
    candidates.forEach((candidate) => {
      let citationMetadata;
      if (candidate.citationMetadata) {
        citationMetadata = {
          citations: candidate.citationMetadata.citationSources
        };
      }
      if (candidate.safetyRatings) {
        mappedSafetyRatings = candidate.safetyRatings.map((safetyRating) => {
          return {
            ...safetyRating,
            severity: safetyRating.severity ?? HarmSeverity.HARM_SEVERITY_UNSUPPORTED,
            probabilityScore: safetyRating.probabilityScore ?? 0,
            severityScore: safetyRating.severityScore ?? 0
          };
        });
      }
      if (candidate.content?.parts?.some((part) => part?.videoMetadata)) {
        throw new AIError(AIErrorCode.UNSUPPORTED, "Part.videoMetadata is not supported in the Gemini Developer API. Please remove this property.");
      }
      const mappedCandidate = {
        index: candidate.index,
        content: candidate.content,
        finishReason: candidate.finishReason,
        finishMessage: candidate.finishMessage,
        safetyRatings: mappedSafetyRatings,
        citationMetadata,
        groundingMetadata: candidate.groundingMetadata,
        urlContextMetadata: candidate.urlContextMetadata
      };
      mappedCandidates.push(mappedCandidate);
    });
  }
  return mappedCandidates;
}
function mapPromptFeedback(promptFeedback) {
  const mappedSafetyRatings = [];
  promptFeedback.safetyRatings.forEach((safetyRating) => {
    mappedSafetyRatings.push({
      category: safetyRating.category,
      probability: safetyRating.probability,
      severity: safetyRating.severity ?? HarmSeverity.HARM_SEVERITY_UNSUPPORTED,
      probabilityScore: safetyRating.probabilityScore ?? 0,
      severityScore: safetyRating.severityScore ?? 0,
      blocked: safetyRating.blocked
    });
  });
  const mappedPromptFeedback = {
    blockReason: promptFeedback.blockReason,
    safetyRatings: mappedSafetyRatings,
    blockReasonMessage: promptFeedback.blockReasonMessage
  };
  return mappedPromptFeedback;
}
var responseLineRE = /^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
function processStream(response, apiSettings) {
  const inputStream = response.body.pipeThrough(new TextDecoderStream("utf8", { fatal: true }));
  const responseStream = getResponseStream(inputStream);
  const [stream1, stream2] = responseStream.tee();
  return {
    stream: generateResponseSequence(stream1, apiSettings),
    response: getResponsePromise(stream2, apiSettings)
  };
}
async function getResponsePromise(stream, apiSettings) {
  const allResponses = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      let generateContentResponse = aggregateResponses(allResponses);
      if (apiSettings.backend.backendType === BackendType.GOOGLE_AI) {
        generateContentResponse = mapGenerateContentResponse(generateContentResponse);
      }
      return createEnhancedContentResponse(generateContentResponse);
    }
    allResponses.push(value);
  }
}
async function* generateResponseSequence(stream, apiSettings) {
  const reader = stream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    let enhancedResponse;
    if (apiSettings.backend.backendType === BackendType.GOOGLE_AI) {
      enhancedResponse = createEnhancedContentResponse(mapGenerateContentResponse(value));
    } else {
      enhancedResponse = createEnhancedContentResponse(value);
    }
    const firstCandidate = enhancedResponse.candidates?.[0];
    if (!firstCandidate?.content?.parts && !firstCandidate?.finishReason && !firstCandidate?.citationMetadata && !firstCandidate?.urlContextMetadata) {
      continue;
    }
    yield enhancedResponse;
  }
}
function getResponseStream(inputStream) {
  const reader = inputStream.getReader();
  const stream = new ReadableStream({
    start(controller) {
      let currentText = "";
      return pump();
      function pump() {
        return reader.read().then(({ value, done }) => {
          if (done) {
            if (currentText.trim()) {
              controller.error(new AIError(AIErrorCode.PARSE_FAILED, "Failed to parse stream"));
              return;
            }
            controller.close();
            return;
          }
          currentText += value;
          let match = currentText.match(responseLineRE);
          let parsedResponse;
          while (match) {
            try {
              parsedResponse = JSON.parse(match[1]);
            } catch (e) {
              controller.error(new AIError(AIErrorCode.PARSE_FAILED, `Error parsing JSON response: "${match[1]}`));
              return;
            }
            controller.enqueue(parsedResponse);
            currentText = currentText.substring(match[0].length);
            match = currentText.match(responseLineRE);
          }
          return pump();
        });
      }
    }
  });
  return stream;
}
function aggregateResponses(responses) {
  const lastResponse = responses[responses.length - 1];
  const aggregatedResponse = {
    promptFeedback: lastResponse?.promptFeedback
  };
  for (const response of responses) {
    if (response.candidates) {
      for (const candidate of response.candidates) {
        const i = candidate.index || 0;
        if (!aggregatedResponse.candidates) {
          aggregatedResponse.candidates = [];
        }
        if (!aggregatedResponse.candidates[i]) {
          aggregatedResponse.candidates[i] = {
            index: candidate.index
          };
        }
        aggregatedResponse.candidates[i].citationMetadata = candidate.citationMetadata;
        aggregatedResponse.candidates[i].finishReason = candidate.finishReason;
        aggregatedResponse.candidates[i].finishMessage = candidate.finishMessage;
        aggregatedResponse.candidates[i].safetyRatings = candidate.safetyRatings;
        aggregatedResponse.candidates[i].groundingMetadata = candidate.groundingMetadata;
        const urlContextMetadata = candidate.urlContextMetadata;
        if (typeof urlContextMetadata === "object" && urlContextMetadata !== null && Object.keys(urlContextMetadata).length > 0) {
          aggregatedResponse.candidates[i].urlContextMetadata = urlContextMetadata;
        }
        if (candidate.content) {
          if (!candidate.content.parts) {
            continue;
          }
          if (!aggregatedResponse.candidates[i].content) {
            aggregatedResponse.candidates[i].content = {
              role: candidate.content.role || "user",
              parts: []
            };
          }
          for (const part of candidate.content.parts) {
            const newPart = { ...part };
            if (part.text === "") {
              continue;
            }
            if (Object.keys(newPart).length > 0) {
              aggregatedResponse.candidates[i].content.parts.push(newPart);
            }
          }
        }
      }
    }
  }
  return aggregatedResponse;
}
var errorsCausingFallback = [
  // most network errors
  AIErrorCode.FETCH_ERROR,
  // fallback code for all other errors in makeRequest
  AIErrorCode.ERROR,
  // error due to API not being enabled in project
  AIErrorCode.API_NOT_ENABLED
];
async function callCloudOrDevice(request, chromeAdapter, onDeviceCall, inCloudCall) {
  if (!chromeAdapter) {
    return inCloudCall();
  }
  switch (chromeAdapter.mode) {
    case InferenceMode.ONLY_ON_DEVICE:
      if (await chromeAdapter.isAvailable(request)) {
        return onDeviceCall();
      }
      throw new AIError(AIErrorCode.UNSUPPORTED, "Inference mode is ONLY_ON_DEVICE, but an on-device model is not available.");
    case InferenceMode.ONLY_IN_CLOUD:
      return inCloudCall();
    case InferenceMode.PREFER_IN_CLOUD:
      try {
        return await inCloudCall();
      } catch (e) {
        if (e instanceof AIError && errorsCausingFallback.includes(e.code)) {
          return onDeviceCall();
        }
        throw e;
      }
    case InferenceMode.PREFER_ON_DEVICE:
      if (await chromeAdapter.isAvailable(request)) {
        return onDeviceCall();
      }
      return inCloudCall();
    default:
      throw new AIError(AIErrorCode.ERROR, `Unexpected infererence mode: ${chromeAdapter.mode}`);
  }
}
async function generateContentStreamOnCloud(apiSettings, model2, params, requestOptions) {
  if (apiSettings.backend.backendType === BackendType.GOOGLE_AI) {
    params = mapGenerateContentRequest(params);
  }
  return makeRequest(
    model2,
    Task.STREAM_GENERATE_CONTENT,
    apiSettings,
    /* stream */
    true,
    JSON.stringify(params),
    requestOptions
  );
}
async function generateContentStream(apiSettings, model2, params, chromeAdapter, requestOptions) {
  const response = await callCloudOrDevice(params, chromeAdapter, () => chromeAdapter.generateContentStream(params), () => generateContentStreamOnCloud(apiSettings, model2, params, requestOptions));
  return processStream(response, apiSettings);
}
async function generateContentOnCloud(apiSettings, model2, params, requestOptions) {
  if (apiSettings.backend.backendType === BackendType.GOOGLE_AI) {
    params = mapGenerateContentRequest(params);
  }
  return makeRequest(
    model2,
    Task.GENERATE_CONTENT,
    apiSettings,
    /* stream */
    false,
    JSON.stringify(params),
    requestOptions
  );
}
async function generateContent(apiSettings, model2, params, chromeAdapter, requestOptions) {
  const response = await callCloudOrDevice(params, chromeAdapter, () => chromeAdapter.generateContent(params), () => generateContentOnCloud(apiSettings, model2, params, requestOptions));
  const generateContentResponse = await processGenerateContentResponse(response, apiSettings);
  const enhancedResponse = createEnhancedContentResponse(generateContentResponse);
  return {
    response: enhancedResponse
  };
}
async function processGenerateContentResponse(response, apiSettings) {
  const responseJson = await response.json();
  if (apiSettings.backend.backendType === BackendType.GOOGLE_AI) {
    return mapGenerateContentResponse(responseJson);
  } else {
    return responseJson;
  }
}
function formatSystemInstruction(input) {
  if (input == null) {
    return void 0;
  } else if (typeof input === "string") {
    return { role: "system", parts: [{ text: input }] };
  } else if (input.text) {
    return { role: "system", parts: [input] };
  } else if (input.parts) {
    if (!input.role) {
      return { role: "system", parts: input.parts };
    } else {
      return input;
    }
  }
}
function formatNewContent(request) {
  let newParts = [];
  if (typeof request === "string") {
    newParts = [{ text: request }];
  } else {
    for (const partOrString of request) {
      if (typeof partOrString === "string") {
        newParts.push({ text: partOrString });
      } else {
        newParts.push(partOrString);
      }
    }
  }
  return assignRoleToPartsAndValidateSendMessageRequest(newParts);
}
function assignRoleToPartsAndValidateSendMessageRequest(parts) {
  const userContent = { role: "user", parts: [] };
  const functionContent = { role: "function", parts: [] };
  let hasUserContent = false;
  let hasFunctionContent = false;
  for (const part of parts) {
    if ("functionResponse" in part) {
      functionContent.parts.push(part);
      hasFunctionContent = true;
    } else {
      userContent.parts.push(part);
      hasUserContent = true;
    }
  }
  if (hasUserContent && hasFunctionContent) {
    throw new AIError(AIErrorCode.INVALID_CONTENT, "Within a single message, FunctionResponse cannot be mixed with other type of Part in the request for sending chat message.");
  }
  if (!hasUserContent && !hasFunctionContent) {
    throw new AIError(AIErrorCode.INVALID_CONTENT, "No Content is provided for sending chat message.");
  }
  if (hasUserContent) {
    return userContent;
  }
  return functionContent;
}
function formatGenerateContentInput(params) {
  let formattedRequest;
  if (params.contents) {
    formattedRequest = params;
  } else {
    const content = formatNewContent(params);
    formattedRequest = { contents: [content] };
  }
  if (params.systemInstruction) {
    formattedRequest.systemInstruction = formatSystemInstruction(params.systemInstruction);
  }
  return formattedRequest;
}
var VALID_PART_FIELDS = [
  "text",
  "inlineData",
  "functionCall",
  "functionResponse",
  "thought",
  "thoughtSignature"
];
var VALID_PARTS_PER_ROLE = {
  user: ["text", "inlineData"],
  function: ["functionResponse"],
  model: ["text", "functionCall", "thought", "thoughtSignature"],
  // System instructions shouldn't be in history anyway.
  system: ["text"]
};
var VALID_PREVIOUS_CONTENT_ROLES = {
  user: ["model"],
  function: ["model"],
  model: ["user", "function"],
  // System instructions shouldn't be in history.
  system: []
};
function validateChatHistory(history) {
  let prevContent = null;
  for (const currContent of history) {
    const { role, parts } = currContent;
    if (!prevContent && role !== "user") {
      throw new AIError(AIErrorCode.INVALID_CONTENT, `First Content should be with role 'user', got ${role}`);
    }
    if (!POSSIBLE_ROLES.includes(role)) {
      throw new AIError(AIErrorCode.INVALID_CONTENT, `Each item should include role field. Got ${role} but valid roles are: ${JSON.stringify(POSSIBLE_ROLES)}`);
    }
    if (!Array.isArray(parts)) {
      throw new AIError(AIErrorCode.INVALID_CONTENT, `Content should have 'parts' property with an array of Parts`);
    }
    if (parts.length === 0) {
      throw new AIError(AIErrorCode.INVALID_CONTENT, `Each Content should have at least one part`);
    }
    const countFields = {
      text: 0,
      inlineData: 0,
      functionCall: 0,
      functionResponse: 0,
      thought: 0,
      thoughtSignature: 0,
      executableCode: 0,
      codeExecutionResult: 0
    };
    for (const part of parts) {
      for (const key of VALID_PART_FIELDS) {
        if (key in part) {
          countFields[key] += 1;
        }
      }
    }
    const validParts = VALID_PARTS_PER_ROLE[role];
    for (const key of VALID_PART_FIELDS) {
      if (!validParts.includes(key) && countFields[key] > 0) {
        throw new AIError(AIErrorCode.INVALID_CONTENT, `Content with role '${role}' can't contain '${key}' part`);
      }
    }
    if (prevContent) {
      const validPreviousContentRoles = VALID_PREVIOUS_CONTENT_ROLES[role];
      if (!validPreviousContentRoles.includes(prevContent.role)) {
        throw new AIError(AIErrorCode.INVALID_CONTENT, `Content with role '${role}' can't follow '${prevContent.role}'. Valid previous roles: ${JSON.stringify(VALID_PREVIOUS_CONTENT_ROLES)}`);
      }
    }
    prevContent = currContent;
  }
}
var SILENT_ERROR = "SILENT_ERROR";
var ChatSession = class {
  constructor(apiSettings, model2, chromeAdapter, params, requestOptions) {
    this.model = model2;
    this.chromeAdapter = chromeAdapter;
    this.params = params;
    this.requestOptions = requestOptions;
    this._history = [];
    this._sendPromise = Promise.resolve();
    this._apiSettings = apiSettings;
    if (params?.history) {
      validateChatHistory(params.history);
      this._history = params.history;
    }
  }
  /**
   * Gets the chat history so far. Blocked prompts are not added to history.
   * Neither blocked candidates nor the prompts that generated them are added
   * to history.
   */
  async getHistory() {
    await this._sendPromise;
    return this._history;
  }
  /**
   * Sends a chat message and receives a non-streaming
   * {@link GenerateContentResult}
   */
  async sendMessage(request) {
    await this._sendPromise;
    const newContent = formatNewContent(request);
    const generateContentRequest = {
      safetySettings: this.params?.safetySettings,
      generationConfig: this.params?.generationConfig,
      tools: this.params?.tools,
      toolConfig: this.params?.toolConfig,
      systemInstruction: this.params?.systemInstruction,
      contents: [...this._history, newContent]
    };
    let finalResult = {};
    this._sendPromise = this._sendPromise.then(() => generateContent(this._apiSettings, this.model, generateContentRequest, this.chromeAdapter, this.requestOptions)).then((result) => {
      if (result.response.candidates && result.response.candidates.length > 0) {
        this._history.push(newContent);
        const responseContent = {
          parts: result.response.candidates?.[0].content.parts || [],
          // Response seems to come back without a role set.
          role: result.response.candidates?.[0].content.role || "model"
        };
        this._history.push(responseContent);
      } else {
        const blockErrorMessage = formatBlockErrorMessage(result.response);
        if (blockErrorMessage) {
          logger3.warn(`sendMessage() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
        }
      }
      finalResult = result;
    });
    await this._sendPromise;
    return finalResult;
  }
  /**
   * Sends a chat message and receives the response as a
   * {@link GenerateContentStreamResult} containing an iterable stream
   * and a response promise.
   */
  async sendMessageStream(request) {
    await this._sendPromise;
    const newContent = formatNewContent(request);
    const generateContentRequest = {
      safetySettings: this.params?.safetySettings,
      generationConfig: this.params?.generationConfig,
      tools: this.params?.tools,
      toolConfig: this.params?.toolConfig,
      systemInstruction: this.params?.systemInstruction,
      contents: [...this._history, newContent]
    };
    const streamPromise = generateContentStream(this._apiSettings, this.model, generateContentRequest, this.chromeAdapter, this.requestOptions);
    this._sendPromise = this._sendPromise.then(() => streamPromise).catch((_ignored) => {
      throw new Error(SILENT_ERROR);
    }).then((streamResult) => streamResult.response).then((response) => {
      if (response.candidates && response.candidates.length > 0) {
        this._history.push(newContent);
        const responseContent = { ...response.candidates[0].content };
        if (!responseContent.role) {
          responseContent.role = "model";
        }
        this._history.push(responseContent);
      } else {
        const blockErrorMessage = formatBlockErrorMessage(response);
        if (blockErrorMessage) {
          logger3.warn(`sendMessageStream() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
        }
      }
    }).catch((e) => {
      if (e.message !== SILENT_ERROR) {
        logger3.error(e);
      }
    });
    return streamPromise;
  }
};
async function countTokensOnCloud(apiSettings, model2, params, requestOptions) {
  let body = "";
  if (apiSettings.backend.backendType === BackendType.GOOGLE_AI) {
    const mappedParams = mapCountTokensRequest(params, model2);
    body = JSON.stringify(mappedParams);
  } else {
    body = JSON.stringify(params);
  }
  const response = await makeRequest(model2, Task.COUNT_TOKENS, apiSettings, false, body, requestOptions);
  return response.json();
}
async function countTokens(apiSettings, model2, params, chromeAdapter, requestOptions) {
  if (chromeAdapter?.mode === InferenceMode.ONLY_ON_DEVICE) {
    throw new AIError(AIErrorCode.UNSUPPORTED, "countTokens() is not supported for on-device models.");
  }
  return countTokensOnCloud(apiSettings, model2, params, requestOptions);
}
var GenerativeModel = class extends AIModel {
  constructor(ai2, modelParams, requestOptions, chromeAdapter) {
    super(ai2, modelParams.model);
    this.chromeAdapter = chromeAdapter;
    this.generationConfig = modelParams.generationConfig || {};
    this.safetySettings = modelParams.safetySettings || [];
    this.tools = modelParams.tools;
    this.toolConfig = modelParams.toolConfig;
    this.systemInstruction = formatSystemInstruction(modelParams.systemInstruction);
    this.requestOptions = requestOptions || {};
  }
  /**
   * Makes a single non-streaming call to the model
   * and returns an object containing a single {@link GenerateContentResponse}.
   */
  async generateContent(request) {
    const formattedParams = formatGenerateContentInput(request);
    return generateContent(this._apiSettings, this.model, {
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings,
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
      ...formattedParams
    }, this.chromeAdapter, this.requestOptions);
  }
  /**
   * Makes a single streaming call to the model
   * and returns an object containing an iterable stream that iterates
   * over all chunks in the streaming response as well as
   * a promise that returns the final aggregated response.
   */
  async generateContentStream(request) {
    const formattedParams = formatGenerateContentInput(request);
    return generateContentStream(this._apiSettings, this.model, {
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings,
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
      ...formattedParams
    }, this.chromeAdapter, this.requestOptions);
  }
  /**
   * Gets a new {@link ChatSession} instance which can be used for
   * multi-turn chats.
   */
  startChat(startChatParams) {
    return new ChatSession(this._apiSettings, this.model, this.chromeAdapter, {
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
      generationConfig: this.generationConfig,
      safetySettings: this.safetySettings,
      /**
       * Overrides params inherited from GenerativeModel with those explicitly set in the
       * StartChatParams. For example, if startChatParams.generationConfig is set, it'll override
       * this.generationConfig.
       */
      ...startChatParams
    }, this.requestOptions);
  }
  /**
   * Counts the tokens in the provided request.
   */
  async countTokens(request) {
    const formattedParams = formatGenerateContentInput(request);
    return countTokens(this._apiSettings, this.model, formattedParams, this.chromeAdapter);
  }
};
var AUDIO_PROCESSOR_NAME = "audio-processor";
var audioProcessorWorkletString = `
  class AudioProcessor extends AudioWorkletProcessor {
    constructor(options) {
      super();
      this.targetSampleRate = options.processorOptions.targetSampleRate;
      // 'sampleRate' is a global variable available inside the AudioWorkletGlobalScope,
      // representing the native sample rate of the AudioContext.
      this.inputSampleRate = sampleRate;
    }

    /**
     * This method is called by the browser's audio engine for each block of audio data.
     * Input is a single input, with a single channel (input[0][0]).
     */
    process(inputs) {
      const input = inputs[0];
      if (input && input.length > 0 && input[0].length > 0) {
        const pcmData = input[0]; // Float32Array of raw audio samples.
        
        // Simple linear interpolation for resampling.
        const resampled = new Float32Array(Math.round(pcmData.length * this.targetSampleRate / this.inputSampleRate));
        const ratio = pcmData.length / resampled.length;
        for (let i = 0; i < resampled.length; i++) {
          resampled[i] = pcmData[Math.floor(i * ratio)];
        }

        // Convert Float32 (-1, 1) samples to Int16 (-32768, 32767)
        const resampledInt16 = new Int16Array(resampled.length);
        for (let i = 0; i < resampled.length; i++) {
          const sample = Math.max(-1, Math.min(1, resampled[i]));
          if (sample < 0) {
            resampledInt16[i] = sample * 32768;
          } else {
            resampledInt16[i] = sample * 32767;
          }
        }
        
        this.port.postMessage(resampledInt16);
      }
      // Return true to keep the processor alive and processing the next audio block.
      return true;
    }
  }

  // Register the processor with a name that can be used to instantiate it from the main thread.
  registerProcessor('${AUDIO_PROCESSOR_NAME}', AudioProcessor);
`;
function getAI(app2 = getApp(), options) {
  app2 = getModularInstance(app2);
  const AIProvider = _getProvider(app2, AI_TYPE);
  const backend = options?.backend ?? new GoogleAIBackend();
  const finalOptions = {
    useLimitedUseAppCheckTokens: options?.useLimitedUseAppCheckTokens ?? false
  };
  const identifier = encodeInstanceIdentifier(backend);
  const aiInstance = AIProvider.getImmediate({
    identifier
  });
  aiInstance.options = finalOptions;
  return aiInstance;
}
function getGenerativeModel(ai2, modelParams, requestOptions) {
  const hybridParams = modelParams;
  let inCloudParams;
  if (hybridParams.mode) {
    inCloudParams = hybridParams.inCloudParams || {
      model: DEFAULT_HYBRID_IN_CLOUD_MODEL
    };
  } else {
    inCloudParams = modelParams;
  }
  if (!inCloudParams.model) {
    throw new AIError(AIErrorCode.NO_MODEL, `Must provide a model name. Example: getGenerativeModel({ model: 'my-model-name' })`);
  }
  const chromeAdapter = ai2.chromeAdapterFactory?.(hybridParams.mode, typeof window === "undefined" ? void 0 : window, hybridParams.onDeviceParams);
  return new GenerativeModel(ai2, inCloudParams, requestOptions, chromeAdapter);
}
function registerAI() {
  _registerComponent(new Component(
    AI_TYPE,
    factory2,
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setMultipleInstances(true));
  registerVersion(name4, version3);
  registerVersion(name4, version3, "esm2020");
}
registerAI();

// src/offscreen-firebase.js
console.log("\u{1F4C4} Offscreen document loaded (bundled)");
var firebaseConfig = {
  apiKey: "AIzaSyAlWiCOhkKqnAe7capXZ4MXQxt0yrq6cOU",
  authDomain: "web-to-podcast-chromeextension.firebaseapp.com",
  projectId: "web-to-podcast-chromeextension",
  storageBucket: "web-to-podcast-chromeextension.firebasestorage.app",
  messagingSenderId: "582025661331",
  appId: "1:582025661331:web:742d54611bd628a2f3b666",
  measurementId: "G-FGQ5FEHWW7"
};
var APP_CHECK_DEBUG_TOKEN = "07AADCFB-ED1C-4057-9CCB-37DCC59DF14F";
var app = null;
var appCheck = null;
var ai = null;
var model = null;
function convertScriptToSSML(text) {
  let ssml = text;
  console.log("\u{1F399}\uFE0F Converting script to SSML for context-aware TTS...");
  console.log("\u{1F4CF} Original length:", text.length);
  ssml = ssml.replace(/\([^)]*\)/g, " ");
  ssml = ssml.replace(/\[[^\]]*\]/g, " ");
  ssml = ssml.replace(/\*\*([^*]+)\*\*/g, function(_match, content) {
    if (content.length < 50) {
      return '<emphasis level="strong"><prosody pitch="+2st">' + content + "</prosody></emphasis>";
    } else {
      return content;
    }
  });
  ssml = ssml.replace(/\*([^*]+)\*/g, '<emphasis level="moderate">$1</emphasis>');
  ssml = ssml.replace(/\*/g, "");
  ssml = ssml.replace(/([^.!?]+!)/g, '<prosody pitch="+1st" rate="105%">$1</prosody>');
  ssml = ssml.replace(/([^.!?]+\?)/g, '<prosody pitch="+2st">$1</prosody>');
  ssml = ssml.replace(/^[Hh]ost:\s*/gm, "");
  ssml = ssml.replace(/^[Nn]arrator:\s*/gm, "");
  ssml = ssml.replace(/^[Ss]peaker:\s*/gm, "");
  ssml = ssml.replace(/^[-=_]{3,}$/gm, '<break time="800ms"/>');
  let paragraphs = ssml.split(/\n\s*\n+/);
  paragraphs = paragraphs.map((p) => p.trim()).filter((p) => p.length > 0).map((p) => "<p>" + p + "</p>");
  ssml = paragraphs.join('\n<break time="600ms"/>\n');
  ssml = "<speak>\n" + ssml + "\n</speak>";
  ssml = ssml.replace(/\s+/g, " ");
  ssml = ssml.replace(/\s*<break/g, "<break");
  ssml = ssml.replace(/\/>\s*/g, "/> ");
  console.log("\u2705 Script converted to SSML");
  console.log("\u{1F4CF} SSML length:", ssml.length);
  console.log("\u{1F4DD} First 300 chars:", ssml.substring(0, 300));
  return ssml;
}
async function initializeFirebase() {
  try {
    console.log("\u{1F504} Initializing Firebase in offscreen context...");
    app = initializeApp(firebaseConfig);
    console.log("\u2705 Firebase app initialized");
    console.log("\u23ED\uFE0F  Firebase Analytics skipped (not needed in extension)");
    const debugTokenProvider = new CustomProvider({
      getToken: () => {
        console.log("\u{1F511} Providing debug token:", APP_CHECK_DEBUG_TOKEN);
        return Promise.resolve({
          token: APP_CHECK_DEBUG_TOKEN,
          expireTimeMillis: Date.now() + 36e5
          // 1 hour expiration
        });
      }
    });
    appCheck = initializeAppCheck(app, {
      provider: debugTokenProvider,
      isTokenAutoRefreshEnabled: true
    });
    console.log("\u2705 Firebase App Check initialized with debug token");
    console.log("\u{1F511} Debug token being used:", APP_CHECK_DEBUG_TOKEN);
    ai = getAI(app, { backend: new GoogleAIBackend() });
    console.log("\u2705 Firebase AI Logic initialized");
    model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
    console.log("\u2705 Gemini 2.5 Flash model initialized");
    return {
      success: true,
      message: "Firebase AI Logic SDK initialized successfully with App Check debug token"
    };
  } catch (error) {
    console.error("\u274C Firebase initialization failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("\u{1F4E8} Offscreen received message:", message);
  console.log("\u{1F4E8} Message action:", message.action);
  console.log("\u{1F4E8} Message type:", typeof message.action);
  if (message.action === "initializeFirebase") {
    initializeFirebase().then((result) => {
      sendResponse(result);
    }).catch((error) => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }
  if (message.action === "ping") {
    sendResponse({
      success: true,
      message: "Offscreen document is alive",
      firebaseInitialized: app !== null,
      appCheckInitialized: appCheck !== null,
      aiInitialized: ai !== null,
      modelInitialized: model !== null
    });
    return;
  }
  if (message.action === "summarizeContent") {
    console.log("\u{1F504} Summarization request received");
    if (!model) {
      console.error("\u274C Model not initialized");
      sendResponse({
        success: false,
        error: "AI model not initialized"
      });
      return;
    }
    const { text, length, format } = message;
    console.log(`\u{1F4DD} Summarizing ${text.length} characters (length: ${length}, format: ${format})`);
    let prompt = `Please summarize the following text`;
    if (length === "short") {
      prompt += " in 2-3 sentences";
    } else if (length === "medium") {
      prompt += " in 5-7 sentences";
    } else if (length === "long") {
      prompt += " in 10-15 sentences";
    }
    if (format === "key-points") {
      prompt += ", focusing on the main key points";
    } else if (format === "tl;dr") {
      prompt += " as a TL;DR";
    }
    prompt += `:

${text}`;
    console.log("\u{1F680} Calling Gemini API...");
    model.generateContent(prompt).then((result) => {
      console.log("\u2705 Gemini API response received");
      const summary = result.response.text();
      console.log(`\u{1F4C4} Summary length: ${summary.length} characters`);
      sendResponse({
        success: true,
        summary
      });
    }).catch((error) => {
      console.error("\u274C Summarization failed:", error);
      console.error("Error details:", error.message, error.stack);
      sendResponse({
        success: false,
        error: error.message || "Summarization failed"
      });
    });
    return true;
  }
  if (message.action === "rewriteConversational") {
    if (!model) {
      sendResponse({
        success: false,
        error: "AI model not initialized"
      });
      return;
    }
    const { text, difficulty, style } = message;
    let prompt = `Rewrite the following content as an engaging podcast script for text-to-speech narration.

IMPORTANT FORMATTING RULES:
- Do NOT use any asterisks (**), underscores (_), or markdown formatting
- Do NOT include music cues like "(Intro Music)" or "(Outro Music)"
- Do NOT use placeholder text like "[Your Name]" or "[Host Name]"
- Do NOT use separators like "---" or "***"
- Do NOT use "Host:" labels or speaker tags
- Write everything as plain, natural spoken text that can be read aloud directly
- Use actual pauses with periods and commas, not visual separators
- Write complete sentences that flow naturally when spoken
- No stage directions, no formatting, just pure spoken content

`;
    if (difficulty === "easy") {
      prompt += "Use simple language suitable for beginners. Explain technical terms. ";
    } else if (difficulty === "medium") {
      prompt += "Use moderate complexity. Balance accessibility with depth. ";
    } else if (difficulty === "hard") {
      prompt += "Use advanced language. Assume expert audience. ";
    }
    if (style === "narrative") {
      prompt += "Use a storytelling narrative style. ";
    } else if (style === "educational") {
      prompt += "Use an educational teaching style. ";
    } else if (style === "conversational") {
      prompt += "Use a casual conversational style. ";
    }
    prompt += `Make it sound natural and engaging for audio listening, as if a real person is speaking directly to the audience.

Content:
${text}`;
    model.generateContent(prompt).then((result) => {
      const rewritten = result.response.text();
      sendResponse({
        success: true,
        text: rewritten
      });
    }).catch((error) => {
      console.error("\u274C Rewrite failed:", error);
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }
  if (message.action === "generateContent") {
    if (!model) {
      sendResponse({
        success: false,
        error: "AI model not initialized"
      });
      return;
    }
    const { prompt } = message;
    model.generateContent(prompt).then((result) => {
      const text = result.response.text();
      sendResponse({
        success: true,
        text
      });
    }).catch((error) => {
      console.error("\u274C Content generation failed:", error);
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }
  if (message.action === "synthesizeSpeech") {
    const { text, voiceName, languageCode } = message;
    console.log("\u{1F3A4} Synthesizing speech with Google Cloud TTS...");
    console.log("Voice:", voiceName, "Language:", languageCode);
    console.log("\u{1F4DD} Original text (first 200 chars):", text.substring(0, 200));
    console.warn("\u26A0\uFE0F STARTING SSML CONVERSION - CHECK THIS CONSOLE FOR SSML LOGS!");
    const ssmlText = convertScriptToSSML(text);
    console.warn("\u26A0\uFE0F SSML CONVERSION COMPLETE!");
    console.log("\u{1F399}\uFE0F SSML output (first 500 chars):", ssmlText.substring(0, 500));
    console.log("\u{1F399}\uFE0F SSML has asterisks?", ssmlText.includes("*"));
    console.log("\u{1F399}\uFE0F SSML has parentheses?", ssmlText.includes("("));
    const TTS_API_KEY = "AIzaSyDFkbh8oCVVD8r3S8vSfBHQgpOAZrnC4Qg";
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${TTS_API_KEY}`;
    const requestBody = {
      input: { ssml: ssmlText },
      // Use SSML instead of plain text
      voice: {
        languageCode: languageCode || "en-US",
        name: voiceName || "en-US-Neural2-F"
      },
      audioConfig: {
        audioEncoding: "MP3",
        pitch: 0,
        speakingRate: 1
      }
    };
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.error?.message || "TTS API error");
        });
      }
      return response.json();
    }).then((data) => {
      console.log("\u2705 Speech synthesized successfully");
      sendResponse({
        success: true,
        audioContent: data.audioContent
        // Base64 encoded MP3
      });
    }).catch((error) => {
      console.error("\u274C Speech synthesis failed:", error);
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }
});
initializeFirebase().then((result) => {
  console.log("\u{1F4CA} Firebase initialization result:", result);
});
console.log("\u2705 Offscreen document ready");
/*! Bundled license information:

@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/logger/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/app-check/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
@firebase/component/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
firebase/app/dist/esm/index.esm.js:
@firebase/app-check/dist/esm/index.esm.js:
@firebase/app-check/dist/esm/index.esm.js:
@firebase/app-check/dist/esm/index.esm.js:
@firebase/app-check/dist/esm/index.esm.js:
@firebase/app-check/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/ai/dist/esm/index.esm.js:
@firebase/ai/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/ai/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
