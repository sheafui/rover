// src/factories/CreateRoverOption.ts
function CreateRoverOption(Alpine2) {
  return {
    init() {
      let disabled = Alpine2.extractProp(this.$el, "disabled", false, false);
      let value = Alpine2.extractProp(this.$el, "value", "");
      const rawSearch = Alpine2.extractProp(this.$el, "data-search", value);
      const normalizedSearch = String(rawSearch).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      this.$el.dataset.value = value;
      this.__add(value, normalizedSearch, disabled);
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
    this.currentQuery = "";
    this.currentResults = [];
    this.navIndex = [];
    this.activeNavPos = -1;
    this.needsReindex = false;
    this.isProcessing = false;
    this.pending = Alpine.reactive({state: false});
    this.activeIndex = Alpine.reactive({value: void 0});
    this.searchThreshold = options.searchThreshold ?? 500;
  }
  add(value, searchable, disabled = false) {
    const item = {value, disabled, searchable};
    this.items.push(item);
    this.invalidate();
  }
  forget(value) {
    const index = this.items.findIndex((item) => item.value === value);
    if (index === -1)
      return;
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
    this.scheduleBatchAsANextMicroTask();
  }
  scheduleBatchAsANextMicroTask() {
    if (this.isProcessing)
      return;
    this.isProcessing = true;
    this.pending.state = true;
    queueMicrotask(() => {
      this.rebuildNavIndex();
      this.isProcessing = false;
      this.pending.state = false;
    });
  }
  rebuildNavIndex() {
    this.navIndex = [];
    const itemsToIndex = this.currentResults.length > 0 ? this.currentResults : this.items;
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i]?.disabled && itemsToIndex.includes(this.items[i])) {
        this.navIndex.push(i);
      }
    }
  }
  toggleIsPending() {
    this.pending.state = !this.pending.state;
  }
  search(query) {
    if (query === "") {
      this.currentQuery = "";
      this.currentResults = [];
      this.rebuildNavIndex();
      return this.items;
    }
    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (this.currentQuery && normalizedQuery.startsWith(this.currentQuery) && this.currentResults.length > 0) {
      const filtered = this.currentResults.filter((item) => {
        return item.searchable.includes(normalizedQuery);
      });
      this.currentQuery = normalizedQuery;
      this.currentResults = filtered;
      this.rebuildNavIndex();
      return filtered;
    }
    const results = this.items.filter((item) => {
      return item.searchable.includes(normalizedQuery);
    });
    this.currentQuery = normalizedQuery;
    this.currentResults = results;
    this.rebuildNavIndex();
    return results;
  }
  get(value) {
    return this.items.find((item) => item.value === value);
  }
  getByIndex(index) {
    if (index == null || index === void 0)
      return null;
    return this.items[index] ?? null;
  }
  all() {
    return this.items;
  }
  get size() {
    return this.items.length;
  }
  activate(value) {
    const index = this.items.findIndex((item2) => item2.value === value);
    if (index === -1)
      return;
    const item = this.items[index];
    if (item?.disabled)
      return;
    this.rebuildNavIndex();
    if (this.activeIndex.value === index)
      return;
    this.activeIndex.value = index;
    this.activeNavPos = this.navIndex.indexOf(index);
  }
  deactivate() {
    this.activeIndex.value = void 0;
    this.activeNavPos = -1;
  }
  isActivated(value) {
    const index = this.items.findIndex((item) => item.value === value);
    if (index === -1)
      return false;
    return index === this.activeIndex.value;
  }
  getActiveItem() {
    if (this.activeIndex.value === void 0)
      return null;
    return this.items[this.activeIndex.value] ?? null;
  }
  activateFirst() {
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
  activateByKey(char) {
    if (!char)
      return;
    const lowerChar = char.toLowerCase();
    const target = this.items.find((item) => !item.disabled && item.value.toLowerCase().startsWith(lowerChar));
    if (target) {
      this.activate(target.value);
    }
  }
};
var RoverCollection_default = RoverCollection;

// src/Managers/utils.ts
function bindListener(el, eventKey, listener, controller) {
  el.addEventListener(eventKey, listener, {
    signal: controller.signal
  });
}

// src/Managers/InputManager.ts
function createInputManager(rootDataStack) {
  const inputEl = rootDataStack.$root.querySelector("[x-rover\\:input]");
  const inputElExists = () => {
    if (!inputEl) {
      console.warn(`Input element with [x-rover\\:input] not found`);
      return false;
    }
    return true;
  };
  return {
    controller: new AbortController(),
    on(eventKey, handler) {
      if (!inputElExists())
        return;
      const listener = (event) => {
        handler(event, rootDataStack.__activatedValue ?? void 0);
      };
      bindListener(inputEl, eventKey, listener, this.controller);
    },
    get value() {
      return inputEl ? inputEl.value : "";
    },
    set value(val) {
      if (inputEl)
        inputEl.value = val;
    },
    focus(preventScroll = true) {
      requestAnimationFrame(() => inputEl?.focus({preventScroll}));
    },
    enableDefaultInputHandlers(disabledEvents = []) {
      if (!inputElExists())
        return;
      if (!disabledEvents.includes("focus")) {
        this.on("focus", () => rootDataStack.__startTyping());
      }
      if (!disabledEvents.includes("blur")) {
        this.on("blur", () => rootDataStack.__stopTyping());
      }
      if (!disabledEvents.includes("keydown")) {
        this.on("keydown", (e) => {
          switch (e.key) {
            case "ArrowDown":
              e.preventDefault();
              e.stopPropagation();
              rootDataStack.__activateNext();
              break;
            case "ArrowUp":
              e.preventDefault();
              e.stopPropagation();
              rootDataStack.__activatePrev();
              break;
            case "Escape":
              e.preventDefault();
              e.stopPropagation();
              requestAnimationFrame(() => this.focus(true));
              break;
            case "Home":
              e.preventDefault();
              rootDataStack.__activateFirst();
              break;
            case "End":
              e.preventDefault();
              rootDataStack.__activateLast();
              break;
            case "Tab":
              rootDataStack.__stopTyping();
              break;
          }
        });
      }
    },
    destroy() {
      this.controller.abort();
    }
  };
}

// src/Managers/OptionManager.ts
function createOptionManager(root) {
  const getAllOptions = () => Array.from(root.$el.querySelectorAll("[x-rover\\:option]"));
  return {
    controller: new AbortController(),
    on(eventKey, handler) {
      root.$nextTick(() => {
        const optionsEls = getAllOptions();
        if (!optionsEls)
          return;
        const listener = (event) => {
          handler(event, root.__activatedValue ?? void 0);
        };
        optionsEls.forEach((option) => {
          bindListener(option, eventKey, listener, this.controller);
        });
      });
    },
    destroy() {
      this.controller.abort();
    }
  };
}

// src/Managers/OptionsManager.ts
function createOptionsManager(root) {
  const optionsEl = root.$el.querySelector("[x-rover\\:options]");
  if (!optionsEl)
    console.warn("Options container not found");
  const findClosestOption = (el) => {
    if (!el || !(el instanceof HTMLElement))
      return;
    return Alpine.findClosest(el, (node) => node.hasAttribute("x-rover:option"));
  };
  return {
    controller: new AbortController(),
    on(eventKey, handler) {
      if (!optionsEl)
        return;
      const listener = (event) => {
        const optionEl = findClosestOption(event.target);
        handler(event, optionEl, root.__activatedValue ?? null);
      };
      bindListener(optionsEl, eventKey, listener, this.controller);
    },
    findClosestOption,
    enableDefaultOptionsHandlers(disabledEvents = []) {
      if (!optionsEl)
        return;
      optionsEl.tabIndex = 0;
      if (!disabledEvents.includes("mouseover")) {
        this.on("mouseover", (_event, optionEl) => {
          if (!optionEl?.dataset.value)
            return;
          root.__activate(optionEl.dataset.value);
        });
      }
      if (!disabledEvents.includes("mousemove")) {
        this.on("mousemove", (_event, optionEl) => {
          if (!optionEl?.dataset.value)
            return;
          if (root.__isActive(optionEl.dataset.value))
            return;
          root.__activate(optionEl.dataset.value);
        });
      }
      if (!disabledEvents.includes("mouseout")) {
        this.on("mouseout", () => {
          if (root.__keepActivated)
            return;
          root.__deactivate();
        });
      }
      if (!disabledEvents.includes("keydown")) {
        this.on("keydown", (event) => {
          event.stopPropagation();
          switch (event.key) {
            case "ArrowDown":
              event.preventDefault();
              root.__activateNext();
              break;
            case "ArrowUp":
              event.preventDefault();
              root.__activatePrev();
              break;
            case "Home":
              event.preventDefault();
              root.__activateFirst();
              break;
            case "End":
              event.preventDefault();
              root.__activateLast();
              break;
            case "Escape":
              event.preventDefault();
              root.__deactivate();
              break;
            case "Tab":
              root.__deactivate();
              break;
          }
        });
      }
    },
    get all() {
      let allOptions = root.__optionsEls;
      if (!allOptions)
        return [];
      return Array.from(allOptions);
    },
    destroy() {
      this.controller.abort();
    }
  };
}

// src/Managers/ButtonManager.ts
function createButtonManager(root) {
  const buttonEl = root.$el.querySelector("[x-rover\\:button]");
  return {
    controller: new AbortController(),
    on(eventKey, handler) {
      if (!buttonEl)
        return;
      const listener = (event) => {
        handler(event, root.__activatedValue ?? void 0);
      };
      bindListener(buttonEl, eventKey, listener, this.controller);
    },
    destroy() {
      this.controller.abort();
    }
  };
}

// src/factories/CreateRoverRoot.ts
function CreateRoverRoot({
  effect
}) {
  const collection = new RoverCollection_default();
  return {
    __collection: collection,
    __optionsEls: void 0,
    __groupsEls: void 0,
    __optionIndex: void 0,
    __isOpen: false,
    __isTyping: false,
    __isLoading: false,
    __g_id: -1,
    __s_id: -1,
    __static: false,
    __keepActivated: true,
    __optionsEl: void 0,
    __prevActivatedValue: void 0,
    __activatedValue: void 0,
    __items: [],
    _x__searchQuery: "",
    __filteredValues: null,
    __prevVisibleArray: null,
    __prevActiveValue: void 0,
    __effectRAF: null,
    __inputManager: void 0,
    __optionsManager: void 0,
    __optionManager: void 0,
    __buttonManager: void 0,
    __add: (value, search, disabled) => collection.add(value, search, disabled),
    __forget: (value) => collection.forget(value),
    __activate: (value) => collection.activate(value),
    __deactivate: () => collection.deactivate(),
    __isActive: (value) => collection.isActivated(value),
    __getActiveItem: () => collection.getActiveItem(),
    __activateNext: () => collection.activateNext(),
    __activatePrev: () => collection.activatePrev(),
    __activateFirst: () => collection.activateFirst(),
    __activateLast: () => collection.activateLast(),
    __searchUsingQuery: (query) => collection.search(query),
    __getByIndex: (index) => collection.getByIndex(index),
    init() {
      this.__setupManagers();
      effect(() => {
        this.__isLoading = collection.pending.state;
      });
      this.$watch("_x__searchQuery", (query) => {
        if (query.length > 0) {
          const results = this.__searchUsingQuery(query).map((r) => r.value);
          const prev = this.__filteredValues;
          const changed = !prev || prev.length !== results.length || results.some((v, i) => v !== prev[i]);
          if (changed) {
            this.__filteredValues = results;
          }
        } else {
          if (this.__filteredValues !== null) {
            this.__filteredValues = null;
          }
        }
        if (this.__activatedValue && this.__filteredValues && !this.__filteredValues.includes(this.__activatedValue)) {
          this.__deactivate();
        }
        if (!this.__getActiveItem() && this.__filteredValues && this.__filteredValues.length) {
          this.__activate(this.__filteredValues[0]);
        }
      });
      this.$nextTick(() => {
        this.__optionsEls = Array.from(this.$el.querySelectorAll("[x-rover\\:option]"));
        this.__optionIndex = new Map();
        this.__optionsEls.forEach((el) => {
          const v = el.dataset.value;
          if (v)
            this.__optionIndex.set(v, el);
        });
        effect(() => {
          const activeItem = this.__getByIndex(collection.activeIndex.value);
          const activeValue = this.__activatedValue = activeItem?.value;
          const visibleValuesArray = this.__filteredValues;
          requestAnimationFrame(() => {
            this.__patchItemsVisibility(visibleValuesArray);
            this.__patchItemsActivity(activeValue);
            this.__handleSeparatorsVisibility();
            this.__handleGroupsVisibility();
          });
        });
      });
    },
    __handleGroupsVisibility() {
    },
    __handleSeparatorsVisibility() {
    },
    __patchItemsVisibility(visibleValuesArray) {
      if (!this.__optionsEls || !this.__optionIndex)
        return;
      const prevArray = this.__prevVisibleArray;
      if (visibleValuesArray === prevArray)
        return;
      if (visibleValuesArray === null) {
        if (prevArray === null)
          return;
        this.__optionsEls.forEach((opt) => {
          opt.style.display = "";
        });
        this.__prevVisibleArray = null;
        return;
      }
      const currentSet = new Set(visibleValuesArray);
      const prevSet = prevArray ? new Set(prevArray) : null;
      if (prevSet === null) {
        this.__optionsEls.forEach((opt) => {
          const value = opt.dataset.value;
          if (!value)
            return;
          const shouldHide = !currentSet.has(value);
          if (opt.style.display !== (shouldHide ? "none" : "")) {
            opt.style.display = shouldHide ? "none" : "";
          }
        });
        this.__prevVisibleArray = visibleValuesArray;
        return;
      }
      for (const value of prevSet) {
        if (!currentSet.has(value)) {
          const el = this.__optionIndex.get(value);
          if (el)
            el.style.display = "none";
        }
      }
      for (const value of currentSet) {
        if (!prevSet.has(value)) {
          const el = this.__optionIndex.get(value);
          if (el)
            el.style.display = "";
        }
      }
      this.__prevVisibleArray = visibleValuesArray;
    },
    __patchItemsActivity(activeValue) {
      const prevActiveValue = this.__prevActiveValue;
      if (prevActiveValue === activeValue)
        return;
      if (prevActiveValue) {
        const prevOpt = this.__optionIndex.get(prevActiveValue);
        if (prevOpt) {
          prevOpt.removeAttribute("data-active");
          prevOpt.removeAttribute("aria-current");
        }
      }
      if (activeValue) {
        const activeOpt = this.__optionIndex.get(activeValue);
        if (activeOpt) {
          activeOpt.setAttribute("data-active", "true");
          activeOpt.setAttribute("aria-current", "true");
          requestAnimationFrame(() => {
            activeOpt.scrollIntoView({block: "nearest"});
          });
        }
      }
      this.__prevActiveValue = activeValue;
    },
    __setupManagers() {
      this.__inputManager = createInputManager(this);
      this.__optionManager = createOptionManager(this);
      this.__optionsManager = createOptionsManager(this);
      this.__buttonManager = createButtonManager(this);
    },
    __open() {
      if (this.__isOpen)
        return;
      this.__isOpen = true;
      requestAnimationFrame(() => {
        this.$refs?._x__input?.focus({preventScroll: true});
      });
    },
    __pushSeparatorToItems(id) {
      this.__items.push({type: "s", id});
    },
    __pushGroupToItems(id) {
      this.__items.push({type: "g", id});
    },
    __startTyping() {
      this.__isTyping = true;
    },
    __stopTyping() {
      this.__isTyping = false;
    },
    __nextGroupId() {
      return ++this.__g_id;
    },
    __nextSeparatorId() {
      return ++this.__s_id;
    },
    destroy() {
      this.__inputManager?.destroy();
      this.__optionManager?.destroy();
      this.__optionsManager?.destroy();
      this.__buttonManager?.destroy();
    }
  };
}

// src/magics/rover.ts
var rover = (el) => {
  let data = Alpine.$data(el);
  return {
    get collection() {
      return data.__collection;
    },
    get input() {
      return data.__inputManager;
    },
    get option() {
      return data.__optionManager;
    },
    get options() {
      return data.__optionsManager;
    },
    get button() {
      return data.__buttonManager;
    },
    get isLoading() {
      return data.__isLoading;
    },
    get inputEl() {
      return data.$root.querySelector("[x-rover\\:input]");
    },
    reindex() {
    },
    getOptionElByValue(value) {
      return data.__optionIndex?.get(value);
    },
    activate(key) {
      data.__collection.activate(key);
    },
    deactivate() {
      data.__collection.deactivate();
    },
    getActiveItem() {
      return data.__collection.getActiveItem();
    },
    activateNext() {
      data.__collection.activateNext();
    },
    activatePrev() {
      data.__collection.activatePrev();
    },
    activateFirst() {
      data.__collection.activateFirst();
    },
    activateLast() {
      data.__collection.activateLast();
    },
    activateByKey(key) {
      data.__collection.activateByKey(key);
    },
    searchUsing(query) {
      return data.__collection.search(query);
    }
  };
};

// src/magics/roverOption.ts
var roverOption = (dataStack) => ({
  activate(key) {
    dataStack.__collection.activate(key);
  },
  deactivate() {
    dataStack.__collection.deactivate();
  },
  getActiveItem() {
    return dataStack.__collection.getActiveItem();
  },
  activateNext() {
    dataStack.__collection.activateNext();
  },
  activatePrev() {
    dataStack.__collection.activatePrev();
  },
  activateFirst() {
    dataStack.__collection.activateFirst();
  },
  activateLast() {
    dataStack.__collection.activateLast();
  },
  searchUsing(query) {
    return dataStack.__collection.search(query);
  }
});

// src/magics/roverOptions.ts
var roverOptions = (dataStack) => ({
  isOpen() {
    return dataStack.__isOpen;
  },
  isStatic() {
    return dataStack.__static;
  }
});

// src/magics/index.ts
function registerMagics(Alpine2) {
  Alpine2.magic("rover", (el) => {
    let optionEl = Alpine2.findClosest(el, (i) => {
      return i.hasAttribute("x-rover");
    });
    if (!optionEl)
      throw "No x-rover directive found, this magic meant to be used under x-rover root context...";
    return rover(optionEl);
  });
  Alpine2.magic("roverOption", (el) => {
    let optionEl = Alpine2.findClosest(el, (i) => {
      return i.hasAttribute("x-rover:option");
    });
    if (!optionEl)
      throw "No x-rover:option directive found, this magic meant to be used per option context...";
    let dataStack = Alpine2.$data(optionEl);
    return roverOption(dataStack);
  });
  Alpine2.magic("roverOptions", (el) => {
    let optionEls = Alpine2.findClosest(el, (i) => {
      return i.hasAttribute("x-option:options");
    });
    if (!optionEls)
      throw "No x-rover:options directive found, this magic meant to be used per options context...";
    let dataStack = Alpine2.$data(optionEls);
    return roverOptions(dataStack);
  });
}

// src/index.ts
function rover2(Alpine2) {
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
  }).before("data");
  registerMagics(Alpine2);
  function handleRoot(Alpine3, el, effect) {
    Alpine3.bind(el, {
      "x-data"() {
        return {
          ...CreateRoverRoot({effect})
        };
      }
    });
  }
  function handleInput(Alpine3, el) {
    Alpine3.bind(el, {
      "x-model": "_x__searchQuery",
      "x-bind:id"() {
        return this.$id("rover-input");
      },
      role: "combobox",
      tabindex: "0",
      "aria-autocomplete": "list"
    });
  }
  function handleOptions(el) {
    Alpine2.bind(el, {
      "x-ref": "__options",
      "x-bind:id"() {
        return this.$id("rover-options");
      },
      role: "listbox",
      "x-init"() {
        if (Alpine2.bound(this.$el, "keepActivated")) {
          this.__keepActivated = true;
        }
      },
      "x-bind:data-loading"() {
        return this.__isLoading;
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
      "x-data"() {
        return CreateRoverOption(Alpine3);
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
        this.$el.setAttribute("aria-labelledby", `${groupId}-label`);
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
      "aria-haspopup": "true"
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
        return Array.isArray(this.__filteredValues) && this.__filteredValues.length === 0 && this._x__searchQuery.length > 0;
      }
    });
  }
  function handleIsLoading(Alpine3, el, modifiers) {
    const shouldHide = modifiers.includes("hide");
    Alpine3.bind(el, {
      "x-show"() {
        return shouldHide ? !this.__isLoading : this.__isLoading;
      },
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true"
    });
  }
  function handleSeparator(Alpine3, el) {
    Alpine3.bind(el, {
      "x-init"() {
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
var module_default = rover2;
export {
  module_default as default
};
