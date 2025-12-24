var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// builds/module.js
__markAsModule(exports);
__export(exports, {
  default: () => module_default
});

// src/factories/CreateComboboxInput.js
function CreateComboboxInput() {
  return {
    init() {
      let displayValueFn = Alpine.extractProp(this.$el, "display-value");
      if (displayValueFn)
        this.__displayValue = displayValueFn;
      this.handleEvents();
    },
    handleEvents() {
      this.$el.addEventListener("focus", (e) => {
        this.__startTyping();
      });
      this.$el.addEventListener("input", (e) => {
        e.stopPropagation();
        console.log(e);
        if (this.__isTyping) {
          this.__open();
        }
      });
      this.$el.addEventListener("blur", () => {
        this.__stopTyping();
      });
      this.$el.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            e.stopPropagation();
            if (!this.__isOpen) {
              this.__open();
              break;
            }
            this.__activateNext();
            break;
          case "ArrowUp":
            e.preventDefault();
            e.stopPropagation();
            if (!this.__isOpen) {
              this.__open();
              break;
            }
            this.__activatePrev();
            break;
          case "Enter":
            e.preventDefault();
            e.stopPropagation();
            this.__selectActive();
            this.__stopTyping();
            if (!this.__isMultiple) {
              this.__close();
              this.__resetInput();
            }
            break;
        }
      });
    }
  };
}

// src/factories/CreateComboboxOption.js
function CreateComboboxOption(Alpine2, nextId, effect) {
  const SLOT_NAME = "option";
  return {
    __uniqueKey: "option-" + nextId,
    init() {
      this.$el.dataset.slot = SLOT_NAME;
      let value = Alpine2.extractProp(this.$el, "value");
      this.$el.dataset.key = this.__uniqueKey;
      this.$el.dataset.value = value;
      let disabled = Alpine2.extractProp(this.$el, "disabled", false, false);
      this.__add(this.__uniqueKey, value, disabled);
      this.$watch("__activedKey", (activeKey) => {
        if (activeKey === this.__uniqueKey) {
          this.$el.setAttribute("data-active", true);
        } else {
          this.$el.removeAttribute("data-active");
        }
      });
      this.$watch("__selectedKeys", (selectedKeys) => {
        let thisElHasBeenSelected = false;
        if (!this.__isMultiple) {
          thisElHasBeenSelected = selectedKeys === this.__uniqueKey;
        } else {
          thisElHasBeenSelected = selectedKeys.includes(this.__uniqueKey);
        }
        if (thisElHasBeenSelected) {
          this.$el.setAttribute("aria-selected", true);
          this.$el.setAttribute("data-selected", true);
        } else {
          this.$el.setAttribute("aria-selected", false);
          this.$el.removeAttribute("data-selected");
        }
      });
      this.$nextTick(() => {
        if (disabled) {
          this.$el.setAttribute("tabindex", -1);
        }
      });
    },
    destroy() {
      this.__forget(this.__uniqueKey);
    }
  };
}

// src/core/ComboboxCollection.js
var _items, _itemsMap, _activeNavPos, _needsReindex, _navIndex, _searchIndex, _lastQuery, _lastResults, _isProcessing, _invalidate, invalidate_fn, _scheduleBatch, scheduleBatch_fn, _rebuildIndexes, rebuildIndexes_fn;
var ComboboxCollection = class {
  constructor(options = {}, release = () => {
  }) {
    _invalidate.add(this);
    _scheduleBatch.add(this);
    _rebuildIndexes.add(this);
    _items.set(this, []);
    _itemsMap.set(this, new Map());
    _activeNavPos.set(this, -1);
    _needsReindex.set(this, false);
    _navIndex.set(this, null);
    _searchIndex.set(this, null);
    _lastQuery.set(this, "");
    _lastResults.set(this, null);
    _isProcessing.set(this, false);
    var _a;
    this.pending = Alpine.reactive({state: false});
    this.activeIndex = Alpine.reactive({value: null});
    this.searchThreshold = (_a = options.searchThreshold) != null ? _a : 500;
  }
  add(key, value, disabled = false) {
    if (__privateGet(this, _itemsMap).has(key))
      return;
    const item = {key, value, disabled};
    __privateGet(this, _items).push(item);
    __privateGet(this, _itemsMap).set(key, item);
    __privateMethod(this, _invalidate, invalidate_fn).call(this);
  }
  forget(key) {
    const item = __privateGet(this, _itemsMap).get(key);
    if (!item)
      return;
    const index = __privateGet(this, _items).indexOf(item);
    __privateGet(this, _itemsMap).delete(key);
    __privateGet(this, _items).splice(index, 1);
    if (this.activeIndex.value === index) {
      this.activeIndex.value = null;
      __privateSet(this, _activeNavPos, -1);
    } else if (this.activeIndex.value > index) {
      this.activeIndex.value--;
    }
    __privateMethod(this, _invalidate, invalidate_fn).call(this);
  }
  activate(key) {
    const item = this.get(key);
    if (!item || item.disabled)
      return;
    __privateMethod(this, _rebuildIndexes, rebuildIndexes_fn).call(this);
    const index = __privateGet(this, _items).indexOf(item);
    if (this.activeIndex.value === index)
      return;
    this.activeIndex.value = index;
    __privateSet(this, _activeNavPos, __privateGet(this, _navIndex).indexOf(index));
  }
  deactivate() {
    this.activeIndex.value = null;
    __privateSet(this, _activeNavPos, -1);
  }
  isActivated(key) {
    const item = this.get(key);
    if (!item)
      return false;
    return __privateGet(this, _items).indexOf(item) === this.activeIndex.value;
  }
  getActiveItem() {
    return this.activeIndex.value === null ? null : __privateGet(this, _items)[this.activeIndex.value];
  }
  activateFirst() {
    __privateMethod(this, _rebuildIndexes, rebuildIndexes_fn).call(this);
    if (!__privateGet(this, _navIndex).length)
      return;
    this.activeIndex.value = __privateGet(this, _navIndex)[0];
    __privateSet(this, _activeNavPos, 0);
  }
  activateLast() {
    __privateMethod(this, _rebuildIndexes, rebuildIndexes_fn).call(this);
    if (!__privateGet(this, _navIndex).length)
      return;
    __privateSet(this, _activeNavPos, __privateGet(this, _navIndex).length - 1);
    this.activeIndex.value = __privateGet(this, _navIndex)[__privateGet(this, _activeNavPos)];
  }
  activateNext() {
    __privateMethod(this, _rebuildIndexes, rebuildIndexes_fn).call(this);
    if (!__privateGet(this, _navIndex).length)
      return;
    if (__privateGet(this, _activeNavPos) === -1) {
      this.activateFirst();
      return;
    }
    __privateSet(this, _activeNavPos, (__privateGet(this, _activeNavPos) + 1) % __privateGet(this, _navIndex).length);
    this.activeIndex.value = __privateGet(this, _navIndex)[__privateGet(this, _activeNavPos)];
  }
  activatePrev() {
    __privateMethod(this, _rebuildIndexes, rebuildIndexes_fn).call(this);
    if (!__privateGet(this, _navIndex).length)
      return;
    if (__privateGet(this, _activeNavPos) === -1) {
      this.activateLast();
      return;
    }
    __privateSet(this, _activeNavPos, __privateGet(this, _activeNavPos) === 0 ? __privateGet(this, _navIndex).length - 1 : __privateGet(this, _activeNavPos) - 1);
    this.activeIndex.value = __privateGet(this, _navIndex)[__privateGet(this, _activeNavPos)];
  }
  toggleIsPending() {
    this.pending.state = !this.pending.state;
  }
  search(query) {
    if (!query) {
      __privateSet(this, _lastQuery, "");
      __privateSet(this, _lastResults, null);
      return __privateGet(this, _items);
    }
    const q = query.toLowerCase();
    if (__privateGet(this, _lastQuery) && q.startsWith(__privateGet(this, _lastQuery)) && __privateGet(this, _lastResults)) {
      const filtered = __privateGet(this, _lastResults).filter((item) => String(item.value).toLowerCase().includes(q));
      __privateSet(this, _lastQuery, q);
      __privateSet(this, _lastResults, filtered);
      return filtered;
    }
    let results;
    if (__privateGet(this, _searchIndex)) {
      const normalized = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      results = [];
      for (const {key, value} of __privateGet(this, _searchIndex)) {
        if (value.includes(normalized)) {
          results.push(__privateGet(this, _itemsMap).get(key));
        }
      }
    } else {
      results = __privateGet(this, _items).filter((item) => String(item.value).toLowerCase().includes(q));
    }
    __privateSet(this, _lastQuery, q);
    __privateSet(this, _lastResults, results);
    return results;
  }
  get(key) {
    return __privateGet(this, _itemsMap).get(key);
  }
  getValueByKey(key) {
    return this.get(key).value;
  }
  getElementByKey(key) {
    return this.get(key).el;
  }
  getKeyByIndex(index) {
    var _a, _b;
    return index == null ? null : (_b = (_a = __privateGet(this, _items)[index]) == null ? void 0 : _a.key) != null ? _b : null;
  }
  all() {
    return __privateGet(this, _items);
  }
  get size() {
    return __privateGet(this, _items).length;
  }
};
_items = new WeakMap();
_itemsMap = new WeakMap();
_activeNavPos = new WeakMap();
_needsReindex = new WeakMap();
_navIndex = new WeakMap();
_searchIndex = new WeakMap();
_lastQuery = new WeakMap();
_lastResults = new WeakMap();
_isProcessing = new WeakMap();
_invalidate = new WeakSet();
invalidate_fn = function() {
  __privateSet(this, _needsReindex, true);
  __privateSet(this, _lastQuery, "");
  __privateSet(this, _lastResults, null);
  __privateMethod(this, _scheduleBatch, scheduleBatch_fn).call(this);
};
_scheduleBatch = new WeakSet();
scheduleBatch_fn = function() {
  if (__privateGet(this, _isProcessing))
    return;
  __privateSet(this, _isProcessing, true);
  this.pending.state = true;
  queueMicrotask(() => {
    __privateMethod(this, _rebuildIndexes, rebuildIndexes_fn).call(this);
    __privateSet(this, _isProcessing, false);
    this.pending.state = false;
  });
};
_rebuildIndexes = new WeakSet();
rebuildIndexes_fn = function() {
  if (!__privateGet(this, _needsReindex))
    return;
  __privateSet(this, _navIndex, []);
  for (let i = 0; i < __privateGet(this, _items).length; i++) {
    if (!__privateGet(this, _items)[i].disabled) {
      __privateGet(this, _navIndex).push(i);
    }
  }
  if (__privateGet(this, _items).length >= this.searchThreshold) {
    __privateSet(this, _searchIndex, __privateGet(this, _items).map((item) => ({
      key: item.key,
      value: String(item.value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    })));
  } else {
    __privateSet(this, _searchIndex, null);
  }
  __privateSet(this, _needsReindex, false);
};
var ComboboxCollection_default = ComboboxCollection;

// src/factories/CreateComboboxRoot.js
function CreateComboboxRoot({el, effect}) {
  const collection = new ComboboxCollection_default();
  return {
    __state: null,
    __isOpen: false,
    __isMultiple: false,
    __isTyping: false,
    __isLoading: false,
    __uid: 0,
    __static: false,
    __keepActivated: true,
    __optionsEl: void 0,
    __compareBy: void 0,
    __activedKey: void 0,
    __selectedKeys: void 0,
    __filteredKeys: null,
    __searchQuery: "",
    __add: (k, v, d) => collection.add(k, v, d),
    __forget: (k) => collection.forget(k),
    __activate: (k) => collection.activate(k),
    __isActive: (k) => collection.isActivated(k),
    __deactivate: () => collection.deactivate(),
    __getValueByKey: (k) => collection.getValueByKey(k),
    __getElementByKey: (k) => collection.getElementByKey(k),
    __activateNext: () => collection.activateNext(),
    __activatePrev: () => collection.activatePrev(),
    __activateFirst: () => collection.activateFirst(),
    __activateLast: () => collection.activateLast(),
    __isVisible(key) {
      if (this.__searchQuery === "")
        return true;
      if (!this.__filteredKeys)
        return true;
      return this.__filteredKeys.includes(key);
    },
    init() {
      effect(() => {
        this.__isLoading = collection.pending.state;
      });
      effect(() => {
        this.__activedKey = collection.getKeyByIndex(collection.activeIndex.value);
      });
      effect(() => {
        let results = collection.search(this.__searchQuery).map((result) => result.key);
        if (results.length >= 0) {
          this.__filteredKeys = results;
        } else {
          this.__filteredKeys = null;
        }
        if (this.__activedKey && this.__filteredKeys && !this.__filteredKeys.includes(this.__activedKey)) {
          collection.deactivate();
        }
        if (this.__isOpen && !collection.getActiveItem() && this.__filteredKeys && this.__filteredKeys.length) {
          collection.activate(this.__filteredKeys[0]);
        }
      });
      this.__isMultiple = Alpine.extractProp(el, "multiple", false);
      this.__isDisabled = Alpine.extractProp(el, "disabled", false);
      if (this.__isMultiple) {
        this.__selectedKeys = [];
      } else {
        this.__selectedKeys = null;
      }
      this.__compareBy = Alpine.extractProp(el, "by");
      let defaultValue = Alpine.extractProp(el, "default-value", this.__isMultiple ? [] : null);
      this.__state = defaultValue;
      this.__registerEventsDelector();
    },
    __open() {
      if (this.__isOpen)
        return;
      this.__isOpen = true;
      let input = this.$refs.__input;
      requestAnimationFrame(() => {
        input.focus({preventScroll: true});
        this.__activateSelectedOrFirst();
      });
    },
    __activateSelectedOrFirst(activateSelected = true) {
      if (!this.__isOpen)
        return;
      let activeItem = collection.getActiveItem();
      if (activeItem)
        return;
      if (activateSelected && this.__selectedKeys) {
        const keyToActivate = this.__isMultiple ? this.__selectedKeys[0] : this.__selectedKeys;
        if (keyToActivate) {
          this.__activate(keyToActivate);
          return;
        }
      }
      collection.activateFirst();
    },
    __close() {
      this.__isOpen = false;
      this.__deactivate();
    },
    __handleSelection(key) {
      let value = this.__getValueByKey(key);
      if (!this.__isMultiple) {
        this.__selectedKeys = key;
        if (this.__state === value) {
          this.__state = null;
          this.__selectedKeys = null;
        } else {
          this.__state = value;
        }
        if (!this.__static) {
        }
        return;
      }
      if (!Array.isArray(this.__selectedKeys)) {
        this.__selectedKeys = [];
      }
      if (!Array.isArray(this.__state)) {
        this.__state = [];
      }
      let index = this.__state.findIndex((j) => this.__compare(j, value));
      let keyIndex = this.__selectedKeys.indexOf(key);
      if (index === -1) {
        this.__state.push(value);
        this.__selectedKeys.push(key);
      } else {
        this.__state.splice(index, 1);
        this.__selectedKeys.splice(keyIndex, 1);
      }
    },
    __selectActive() {
      if (!this.__activedKey)
        return;
      this.__handleSelection(this.__activedKey);
    },
    __startTyping() {
      this.__isTyping = true;
    },
    __stopTyping() {
      this.__isTyping = false;
    },
    __resetInput() {
      let input = this.$refs.__input;
      if (!input)
        return;
      let value = this.__getCurrentValue();
      input.value = value;
    },
    __getCurrentValue() {
      if (!this.$refs.__input)
        return "";
      if (!this.__state)
        return "";
      if (typeof this.__state === "string")
        return this.__state;
      return "";
    },
    __compare(a, b) {
      let by = this.__compareBy;
      if (!by)
        by = (a2, b2) => Alpine.raw(a2) === Alpine.raw(b2);
      if (typeof by === "string") {
        let property = by;
        by = (a2, b2) => {
          if (!a2 || typeof a2 !== "object" || (!b2 || typeof b2 !== "object")) {
            return Alpine.raw(a2) === Alpine.raw(b2);
          }
          return a2[property] === b2[property];
        };
      }
      return by(a, b);
    },
    __nextId() {
      return ++this.__uid;
    },
    __registerEventsDelector() {
      const findClosestOption = (el2) => Alpine.findClosest(el2, (node) => node.dataset.slot === "option");
      const delegate = (handler) => {
        return function(e) {
          e.stopPropagation();
          const optionEl = findClosestOption(e.target);
          if (!optionEl)
            return;
          handler(optionEl);
        };
      };
      this.$nextTick(() => {
        this.__optionsEl = this.$refs.__options;
        if (!this.__optionsEl)
          return;
        this.__optionsEl.addEventListener("click", delegate((optionEl) => {
          this.__handleSelection(optionEl.dataset.key);
          if (!this.__isMultiple && !this.__static) {
            this.__close();
            this.__resetInput();
          }
          this.$nextTick(() => this.$refs.__input.focus({preventScroll: true}));
        }));
        this.__optionsEl.addEventListener("mouseover", delegate((optionEl) => {
          this.__activate(optionEl.dataset.key);
        }));
        this.__optionsEl.addEventListener("mousemove", delegate((optionEl) => {
          if (this.__isActive())
            return;
          this.__activate(optionEl.dataset.key);
        }));
        this.__optionsEl.addEventListener("mouseout", delegate(() => {
          if (this.__keepActivated)
            return;
          this.__deactivate();
        }));
      });
    }
  };
}

// src/index.js
function combobox() {
  window.Alpine.directive("combobox", (el, {value, modifiers, expression}, {Alpine: Alpine2, effect, cleanup}) => {
    console.log("before:");
    switch (value) {
      case null:
        handleRoot(Alpine2, el, effect);
        break;
      case "input":
        handleInput(Alpine2, el);
        break;
      case "button":
        handleButton(Alpine2, el);
        break;
      case "options":
        handleOptions(el);
        break;
      case "option":
        handleOption(Alpine2, el, effect);
        break;
      case "options-group":
        handleOptionsGroup(Alpine2, el, effect);
        break;
      case "loading":
        handleIsLoasing(Alpine2, el, modifiers, expression);
        break;
      case "separator":
        handleSeparator(Alpine2, el, modifiers, expression);
        break;
      case ("empty", "on-empty"):
        handleEmptyState(Alpine2, el, modifiers, expression);
        break;
      default:
        console.error("invalid x-combobox value", value, "use input, button, option, options or leave mepty for root level instead");
        break;
    }
  });
  function handleRoot(Alpine2, el, effect) {
    Alpine2.bind(el, {
      "x-data"() {
        return CreateComboboxRoot({el, effect});
      }
    });
  }
  function handleInput(Alpine2, el) {
    Alpine2.bind(el, {
      "x-ref": "__input",
      "x-model": "__searchQuery",
      "x-bind:id"() {
        return this.$id("combobox-input");
      },
      role: "combobox",
      tabindex: "0",
      "aria-autocomplete": "list",
      "x-data"() {
        return CreateComboboxInput();
      }
    });
  }
  function handleOptions(el) {
    Alpine.bind(el, {
      "x-ref": "__options",
      "x-bind:id"() {
        return this.$id("combobox-options");
      },
      role: "listbox",
      "x-init"() {
        this.$data.__static = Alpine.extractProp(this.$el, "static", false);
        if (Alpine.bound(this.$el, "hold")) {
          this.__keepActivated = true;
        }
        return this.$el.dataset.slot = "options";
      },
      "x-show"() {
        return this.$data.__static ? true : this.$data.__isOpen;
      }
    });
  }
  function handleOption(Alpine2, el, effect) {
    Alpine2.bind(el, {
      "x-id"() {
        return ["combobox-option"];
      },
      "x-bind:id"() {
        return this.$id("combobox-option");
      },
      role: "option",
      "x-show"() {
        return this.$data.__isVisible(this.$el.dataset.key);
      },
      "x-data"() {
        return CreateComboboxOption(Alpine2, this.__nextId(), effect);
      }
    });
  }
  function handleOptionsGroup(Alpine2, el, effect) {
    Alpine2.bind(el, {
      "x-id"() {
        return ["combobox-options-group"];
      },
      "x-bind:id"() {
        return this.$id("combobox-options-group");
      },
      role: "option",
      "x-show"() {
        return true;
      }
    });
  }
  function handleButton(Alpine2, el) {
    Alpine2.bind(el, {
      "x-ref": "__button",
      "x-bind:id"() {
        return this.$id("combobox-button");
      },
      tabindex: "-1",
      "aria-haspopup": "true",
      "x-on:click"(e) {
        if (this.__isDisabled)
          return;
        if (this.__isOpen) {
          this.__close();
          this.__resetInput();
        } else {
          e.preventDefault();
          this.__open();
        }
        requestAnimationFrame(() => this.$refs.__input.focus({preventScroll: true}));
      }
    });
  }
  function handleEmptyState(Alpine2, el) {
    Alpine2.bind(el, {
      "x-bind:id"() {
        return this.$id("combobox-button");
      },
      tabindex: "-1",
      "aria-haspopup": "true",
      "x-show"() {
        return Array.isArray(this.__filteredKeys) && this.__filteredKeys.length === 0;
      }
    });
  }
  function handleIsLoasing(Alpine2, el, modifiers) {
    let data = Alpine2.$data(el);
    if (data.__isLoading) {
    }
  }
  function handleSeparator(Alpine2, el, modifiers) {
  }
}

// builds/module.js
var module_default = combobox;
