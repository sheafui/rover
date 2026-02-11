var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};

// builds/module.js
__markAsModule(exports);
__export(exports, {
  default: () => module_default
});

// src/factories/CreateRoverInput.ts
var SLOT_NAME = "rover-input";
function CreateRoverInput(Alpine2) {
  return {
    init() {
      let displayValueFn = Alpine2.extractProp(this.$el, "display-value", "");
      if (displayValueFn)
        this.__displayValue = displayValueFn;
      this.$el.dataset.slot = SLOT_NAME;
      this.__handleEvents();
    },
    __handleEvents() {
      this.$el.addEventListener("focus", () => {
        this.__startTyping();
      });
      this.$el.addEventListener("input", (e) => {
        e.stopPropagation();
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
          default:
            if (this.__static)
              return;
            this.__open();
            break;
        }
      });
    }
  };
}

// src/factories/CreateRoverOption.ts
var SLOT_NAME2 = "rover-option";
function CreateRoverOption(Alpine2, id) {
  return {
    __uniqueKey: "option-" + id,
    __isVisible: true,
    init() {
      this.$el.dataset.slot = SLOT_NAME2;
      this.$el.dataset.key = this.__uniqueKey;
      let value = Alpine2.extractProp(this.$el, "value", "");
      console.log("Option init:", this.__uniqueKey, "with value:", value);
      let disabled = Alpine2.extractProp(this.$el, "disabled", false, false);
      this.$el.dataset.value = value;
      this.__add(this.__uniqueKey, value, disabled);
      this.__pushOptionToItems(String(id));
      this.$nextTick(() => {
        if (disabled) {
          this.$el.setAttribute("tabindex", "-1");
        }
      });
    },
    destroy() {
      this.__forget(this.__uniqueKey);
    }
  };
}

// src/core/RoverCollection.ts
var RoverCollection = class {
  constructor(options = {}) {
    this.items = [];
    this.itemsMap = new Map();
    this.searchIndex = [];
    this.currentQuery = "";
    this.currentResults = [];
    this.navIndex = [];
    this.activeNavPos = -1;
    this.needsReindex = false;
    this.isProcessing = false;
    var _a;
    this.pending = Alpine.reactive({state: false});
    this.activeIndex = Alpine.reactive({value: void 0});
    this.searchThreshold = (_a = options.searchThreshold) != null ? _a : 500;
  }
  add(key, value, disabled = false) {
    if (this.itemsMap.has(key))
      return;
    const item = {key, value, disabled};
    this.items.push(item);
    this.itemsMap.set(key, item);
    this.invalidate();
  }
  forget(key) {
    const item = this.itemsMap.get(key);
    if (!item)
      return;
    const index = this.items.indexOf(item);
    this.itemsMap.delete(key);
    this.items.splice(index, 1);
    if (this.activeIndex.value === index) {
      this.activeIndex.value = void 0;
      this.activeNavPos = -1;
    } else if (this.activeIndex.value !== void 0 && this.activeIndex.value > index) {
      this.activeIndex.value--;
    }
    this.invalidate();
  }
  invalidate() {
    this.needsReindex = true;
    this.currentQuery = "";
    this.currentResults = [];
    this.scheduleBatch();
  }
  scheduleBatch() {
    if (this.isProcessing)
      return;
    this.isProcessing = true;
    this.pending.state = true;
    queueMicrotask(() => {
      this.rebuildSearchIndex();
      this.rebuildNavIndex();
      this.isProcessing = false;
      this.pending.state = false;
    });
  }
  rebuildSearchIndex() {
    if (!this.needsReindex)
      return;
    this.searchIndex = this.items.map((item) => ({
      key: item.key,
      value: String(item.value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }));
    this.needsReindex = false;
  }
  rebuildNavIndex() {
    var _a;
    this.navIndex = [];
    const itemsToIndex = this.currentResults.length > 0 ? this.currentResults : this.items;
    for (let i = 0; i < this.items.length; i++) {
      if (!((_a = this.items[i]) == null ? void 0 : _a.disabled) && itemsToIndex.includes(this.items[i])) {
        this.navIndex.push(i);
      }
    }
  }
  toggleIsPending() {
    this.pending.state = !this.pending.state;
  }
  search(query) {
    if (!query) {
      this.currentQuery = "";
      this.currentResults = [];
      this.rebuildNavIndex();
      return this.items;
    }
    const q = query.toLowerCase();
    if (this.currentQuery && q.startsWith(this.currentQuery) && this.currentResults.length > 0) {
      const filtered = this.currentResults.filter((item) => String(item.value).toLowerCase().includes(q));
      this.currentQuery = q;
      this.currentResults = filtered;
      this.rebuildNavIndex();
      return filtered;
    }
    this.rebuildSearchIndex();
    const normalized = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const results = [];
    for (const {key, value} of this.searchIndex) {
      if (value.includes(normalized)) {
        const item = this.itemsMap.get(key);
        if (item)
          results.push(item);
      }
    }
    this.currentQuery = q;
    this.currentResults = results;
    this.rebuildNavIndex();
    return results;
  }
  get(key) {
    return this.itemsMap.get(key);
  }
  getValueByKey(key) {
    var _a;
    return (_a = this.get(key)) == null ? void 0 : _a.value;
  }
  getKeyByIndex(index) {
    var _a, _b;
    if (index == null || index === void 0)
      return null;
    return (_b = (_a = this.items[index]) == null ? void 0 : _a.key) != null ? _b : null;
  }
  all() {
    return this.items;
  }
  get size() {
    return this.items.length;
  }
  activate(key) {
    const item = this.get(key);
    if (!item || item.disabled)
      return;
    this.rebuildSearchIndex();
    this.rebuildNavIndex();
    const index = this.items.indexOf(item);
    if (this.activeIndex.value === index)
      return;
    this.activeIndex.value = index;
    this.activeNavPos = this.navIndex.indexOf(index);
  }
  deactivate() {
    this.activeIndex.value = void 0;
    this.activeNavPos = -1;
  }
  isActivated(key) {
    const item = this.get(key);
    if (!item)
      return false;
    return this.items.indexOf(item) === this.activeIndex.value;
  }
  getActiveItem() {
    var _a;
    if (this.activeIndex.value === void 0)
      return null;
    return (_a = this.items[this.activeIndex.value]) != null ? _a : null;
  }
  activateFirst() {
    this.rebuildSearchIndex();
    this.rebuildNavIndex();
    if (!this.navIndex.length)
      return;
    const firstIndex = this.navIndex[0];
    if (firstIndex !== void 0) {
      this.activeIndex.value = firstIndex;
      this.activeNavPos = 0;
    }
  }
  activateLast() {
    this.rebuildSearchIndex();
    this.rebuildNavIndex();
    if (!this.navIndex.length)
      return;
    this.activeNavPos = this.navIndex.length - 1;
    const lastIndex = this.navIndex[this.activeNavPos];
    if (typeof lastIndex === "number") {
      this.activeIndex.value = lastIndex;
    }
  }
  activateNext() {
    this.rebuildSearchIndex();
    this.rebuildNavIndex();
    if (!this.navIndex.length)
      return;
    if (this.activeNavPos === -1) {
      this.activateFirst();
      return;
    }
    this.activeNavPos = (this.activeNavPos + 1) % this.navIndex.length;
    const nextIndex = this.navIndex[this.activeNavPos];
    if (nextIndex !== void 0) {
      this.activeIndex.value = nextIndex;
    }
  }
  activatePrev() {
    this.rebuildSearchIndex();
    this.rebuildNavIndex();
    if (!this.navIndex.length)
      return;
    if (this.activeNavPos === -1) {
      this.activateLast();
      return;
    }
    this.activeNavPos = this.activeNavPos === 0 ? this.navIndex.length - 1 : this.activeNavPos - 1;
    const prevIndex = this.navIndex[this.activeNavPos];
    if (prevIndex !== void 0) {
      this.activeIndex.value = prevIndex;
    }
  }
};
var RoverCollection_default = RoverCollection;

// src/factories/CreateRoverRoot.ts
function CreateRoverRoot({
  el,
  effect
}) {
  const collection = new RoverCollection_default();
  const SLOT_NAME3 = "rover-root";
  return {
    __optionsEls: void 0,
    __groupsEls: void 0,
    __state: null,
    __isOpen: false,
    __isMultiple: false,
    __isTyping: false,
    __isLoading: false,
    __o_id: -1,
    __g_id: -1,
    __s_id: -1,
    __static: false,
    __keepActivated: true,
    __optionsEl: void 0,
    __compareBy: void 0,
    __activatedKey: void 0,
    __selectedKeys: void 0,
    __isDisabled: false,
    __items: [],
    __searchQuery: "",
    __filteredKeys: null,
    __filteredKeysSet: new Set(),
    __add: (k, v, d) => collection.add(k, v, d),
    __forget: (k) => collection.forget(k),
    __activate: (k) => collection.activate(k),
    __deactivate: () => collection.deactivate(),
    __isActive: (k) => collection.isActivated(k),
    __getValueByKey: (k) => collection.getValueByKey(k),
    __getActiveItem: () => collection.getActiveItem(),
    __activateNext: () => collection.activateNext(),
    __activatePrev: () => collection.activatePrev(),
    __activateFirst: () => collection.activateFirst(),
    __activateLast: () => collection.activateLast(),
    __searchUsingQuery: (query) => collection.search(query),
    __getKeyByIndex: (index) => collection.getKeyByIndex(index),
    init() {
      this.$el.dataset.slot = SLOT_NAME3;
      effect(() => {
        this.__isLoading = collection.pending.state;
      });
      effect(() => {
        this.__activatedKey = this.__getKeyByIndex(collection.activeIndex.value);
      });
      effect(() => {
        if (String(this.__searchQuery).length > 0) {
          let results = this.__searchUsingQuery(this.__searchQuery).map((result) => result.key);
          if (results.length >= 0) {
            this.__filteredKeys = results;
          }
        } else {
          this.__filteredKeys = null;
        }
        if (this.__activatedKey && this.__filteredKeys && !this.__filteredKeys.includes(this.__activatedKey)) {
          this.__deactivate();
        }
        if (this.__isOpen && !this.__getActiveItem() && this.__filteredKeys && this.__filteredKeys.length) {
          this.__activate(this.__filteredKeys[0]);
        }
      });
      this.$nextTick(() => {
        this.__optionsEls = Array.from(this.$el.querySelectorAll("[data-slot=rover-option]"));
        this.__groupsEls = Array.from(this.$el.querySelectorAll("[data-slot=rover-group]"));
        effect(() => {
          const activeKey = this.__activatedKey;
          const visibleKeys = this.__filteredKeys ? new Set(this.__filteredKeys) : null;
          const selectedKeys = new Set(Array.isArray(this.__selectedKeys) ? this.__selectedKeys : this.__selectedKeys ? [this.__selectedKeys] : []);
          requestAnimationFrame(() => {
            const options = this.__optionsEls;
            console.log(this.__optionsEls);
            options.forEach((opt) => {
              const htmlOpt = opt;
              const key = htmlOpt.dataset.key;
              if (!key)
                return;
              if (visibleKeys !== null) {
                htmlOpt.hidden = !visibleKeys.has(key);
              } else {
                htmlOpt.hidden = false;
              }
              if (key === activeKey) {
                htmlOpt.setAttribute("data-active", "true");
                htmlOpt.setAttribute("aria-current", "true");
                htmlOpt.scrollIntoView({block: "nearest"});
              } else {
                htmlOpt.removeAttribute("data-active");
                htmlOpt.removeAttribute("aria-current");
              }
              if (selectedKeys.has(key)) {
                htmlOpt.setAttribute("aria-selected", "true");
                htmlOpt.setAttribute("data-selected", "true");
              } else {
                htmlOpt.setAttribute("aria-selected", "false");
                htmlOpt.removeAttribute("data-selected");
              }
            });
            const groups = this.__groupsEls;
            groups.forEach((group) => {
              const htmlGroup = group;
              const options2 = htmlGroup.querySelectorAll("[data-slot=rover-option]");
              const hasVisibleOption = Array.from(options2).some((opt) => {
                const htmlOpt = opt;
                return visibleKeys ? visibleKeys.has(htmlOpt.dataset.key || "") : true;
              });
              htmlGroup.hidden = !hasVisibleOption;
            });
          });
        });
      });
      if (this.__isMultiple) {
        this.__selectedKeys = [];
      } else {
        this.__selectedKeys = null;
      }
      this.__isMultiple = Alpine.extractProp(el, "multiple", false);
      this.__isDisabled = Alpine.extractProp(el, "disabled", false);
      this.__compareBy = Alpine.extractProp(el, "by", "");
      const initialValueFallback = this.__isMultiple ? [] : "";
      let initialValue = Alpine.extractProp(el, "initial-value", initialValueFallback);
      this.__registerEventsDelector();
      this.$nextTick(() => {
        if (!this.$refs.__input) {
          this.__isOpen = true;
        }
      });
    },
    __open() {
      if (this.__isOpen)
        return;
      this.__isOpen = true;
      let input = this.$refs.__input;
      requestAnimationFrame(() => {
        input == null ? void 0 : input.focus({preventScroll: true});
        this.__activateSelectedOrFirst();
      });
    },
    __pushSeparatorToItems(key) {
      this.__items.push({
        type: "s",
        key
      });
    },
    __pushGroupToItems(key) {
      this.__items.push({
        type: "g",
        key
      });
    },
    __pushOptionToItems(key) {
      this.__items.push({
        type: "o",
        key
      });
    },
    __activateSelectedOrFirst(activateSelected = true) {
      if (!this.__isOpen)
        return;
      let activeItem = this.__getActiveItem();
      if (activeItem)
        return;
      if (activateSelected && this.__selectedKeys) {
        const keyToActivate = this.__isMultiple ? this.__selectedKeys[0] : this.__selectedKeys;
        if (keyToActivate) {
          this.__activate(keyToActivate);
          return;
        }
      }
      this.__activateFirst();
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
          this.__close();
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
      if (!this.__activatedKey)
        return;
      this.__handleSelection(this.__activatedKey);
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
      if (!this.__compareBy) {
        by = (a2, b2) => Alpine.raw(a2) === Alpine.raw(b2);
      } else if (typeof this.__compareBy === "string") {
        const property = this.__compareBy;
        by = (a2, b2) => {
          if (!a2 || typeof a2 !== "object" || (!b2 || typeof b2 !== "object")) {
            return Alpine.raw(a2) === Alpine.raw(b2);
          }
          const objA = a2;
          const objB = b2;
          return objA[property] === objB[property];
        };
      }
      return by(a, b);
    },
    __nextOptionId() {
      return ++this.__o_id;
    },
    __nextGroupId() {
      return ++this.__g_id;
    },
    __nextSeparatorId() {
      return ++this.__s_id;
    },
    __registerEventsDelector() {
      const findClosestOption = (el2) => Alpine.findClosest(el2, (node) => node.dataset.slot === SLOT_NAME2);
      const delegate = (handler) => {
        return function(e) {
          e.stopPropagation();
          if (!(e.target instanceof Element))
            return;
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
          if (!optionEl.dataset.key)
            return;
          this.__handleSelection(optionEl.dataset.key);
          if (!this.__isMultiple && !this.__static) {
            this.__close();
            this.__resetInput();
          }
          this.$nextTick(() => {
            var _a, _b;
            return (_b = (_a = this.$refs) == null ? void 0 : _a.__input) == null ? void 0 : _b.focus({preventScroll: true});
          });
        }));
        this.__optionsEl.addEventListener("mouseover", delegate((optionEl) => {
          if (!optionEl.dataset.key)
            return;
          this.__activate(optionEl.dataset.key);
        }));
        this.__optionsEl.addEventListener("mousemove", delegate((optionEl) => {
          if (this.__isActive(optionEl.dataset.key || ""))
            return;
          if (!optionEl.dataset.key)
            return;
          this.__activate(optionEl.dataset.key);
        }));
        this.__optionsEl.addEventListener("mouseout", delegate(() => {
          if (this.__keepActivated)
            return;
          this.__deactivate();
        }));
        this.$root.addEventListener("keydown", (e) => {
          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              e.stopPropagation();
              this.__activateNext();
              break;
            case "ArrowUp":
              e.preventDefault();
              e.stopPropagation();
              this.__activatePrev();
              break;
            case "Enter":
              e.preventDefault();
              e.stopPropagation();
              this.__selectActive();
              if (!this.__isMultiple) {
                this.__close();
                this.__resetInput();
              }
              break;
            case "Escape":
              e.preventDefault();
              e.stopPropagation();
              this.__close();
              this.$nextTick(() => {
                var _a, _b;
                return (_b = (_a = this.$refs) == null ? void 0 : _a.__input) == null ? void 0 : _b.focus({preventScroll: true});
              });
              break;
            default:
              if (this.__static)
                return;
              this.__open();
              break;
          }
        });
      });
    }
  };
}

// src/factories/CreateRoverOptions.ts
function CreateRoverOptions(Alpine2) {
  const SLOT_NAME3 = "rover-options";
  return {
    init() {
      this.$data.__static = Alpine2.extractProp(this.$el, "static", false);
      if (Alpine2.bound(this.$el, "keepActivated")) {
        this.__keepActivated = true;
      }
      return this.$el.dataset.slot = SLOT_NAME3;
    },
    __handleClickAway(event) {
      if (this.__static)
        return;
      let target = event.target;
      if (target.dataset.slot && target.dataset.slot === SLOT_NAME) {
        return;
      }
      this.__close();
    }
  };
}

// src/index.ts
function rover(Alpine2) {
  Alpine2.directive("rover", (el, {value, modifiers}, {Alpine: Alpine3, effect}) => {
    switch (value) {
      case null:
        handleRoot(Alpine3, el, effect);
        break;
      case "input":
        handleInput(Alpine3, el);
        break;
      case "button":
        handleButton(Alpine3, el);
        break;
      case "options":
        handleOptions(el);
        break;
      case "option":
        handleOption(Alpine3, el);
        break;
      case "group":
        handleOptionsGroup(Alpine3, el);
        break;
      case "loading":
        handleIsLoading(Alpine3, el, modifiers);
        break;
      case "separator":
        handleSeparator(Alpine3, el);
        break;
      case "empty":
        handleEmptyState(Alpine3, el);
        break;
      default:
        console.error("invalid x-rover value", value, "use input, button, option, options, group or leave mepty for root level instead");
        break;
    }
  });
  function handleRoot(Alpine3, el, effect) {
    Alpine3.bind(el, {
      "x-on:keydown.escape"(e) {
        if (this.__isOpen) {
          e.preventDefault();
          this.__close();
        }
      },
      "x-bind:key"() {
        return this.__reRenderKey;
      },
      "x-data"() {
        return CreateRoverRoot({el, effect});
      }
    });
  }
  function handleInput(Alpine3, el) {
    Alpine3.bind(el, {
      "x-ref": "__input",
      "x-model": "__searchQuery",
      "x-bind:id"() {
        return this.$id("rover-input");
      },
      role: "combobox",
      tabindex: "0",
      "aria-autocomplete": "list",
      "x-data"() {
        return CreateRoverInput(Alpine3);
      }
    });
  }
  function handleOptions(el) {
    Alpine2.bind(el, {
      "x-ref": "__options",
      "x-bind:id"() {
        return this.$id("rover-options");
      },
      role: "listbox",
      "x-on:click.away"($event) {
        this.__handleClickAway($event);
      },
      "x-data"() {
        return CreateRoverOptions(Alpine2);
      },
      "x-show"() {
        return this.$data.__static ? true : this.$data.__isOpen;
      }
    });
  }
  function handleOption(Alpine3, el) {
    Alpine3.bind(el, {
      "x-id"() {
        return ["rover-option"];
      },
      "x-bind:id"() {
        return this.$id("rover-option");
      },
      role: "option",
      "x-show"() {
        return this.$data.__isVisible;
      },
      "x-data"() {
        return CreateRoverOption(Alpine3, this.__nextOptionId());
      }
    });
  }
  function handleOptionsGroup(Alpine3, el) {
    Alpine3.bind(el, {
      "x-id"() {
        return ["rover-group"];
      },
      "x-bind:id"() {
        return this.$id("rover-group");
      },
      role: "group",
      "x-init"() {
        const groupId = this.$id("rover-group");
        this.$el.dataset.slot = "rover-group";
        this.$el.setAttribute("aria-labelledby", `${groupId}-label`);
        const id = String(this.__nextGroupId());
        this.$el.dataset.key = id;
        this.__pushGroupToItems(id);
      }
    });
  }
  function handleButton(Alpine3, el) {
    Alpine3.bind(el, {
      "x-ref": "__button",
      "x-bind:id"() {
        return this.$id("rover-button");
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
  function handleEmptyState(Alpine3, el) {
    Alpine3.bind(el, {
      "x-bind:id"() {
        return this.$id("rover-button");
      },
      tabindex: "-1",
      "aria-haspopup": "true",
      "x-show"() {
        return Array.isArray(this.__filteredKeys) && this.__filteredKeys.length === 0 && this.__searchQuery.length > 0;
      }
    });
  }
  function handleIsLoading(Alpine3, el, modifiers) {
    let data = Alpine3.$data(el);
    if (modifiers.filter((item) => item === "hide")) {
    }
    if (data) {
    }
  }
  function handleSeparator(Alpine3, el) {
    Alpine3.bind(el, {
      "x-init"() {
        this.$el.dataset.slot = "rover-separator";
        const id = String(this.__nextSeparatorId());
        this.$el.dataset.key = id;
        this.__pushSeparatorToItems(id);
        this.$el.setAttribute("role", "separator");
        this.$el.setAttribute("aria-orientation", "horizontal");
      }
    });
  }
}

// builds/module.js
var module_default = rover;
