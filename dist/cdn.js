(() => {
  // src/factories/CreateRoverOption.ts
  function CreateRoverOption(Alpine2, id) {
    return {
      __uniqueKey: "option-" + id,
      init() {
        this.$el.dataset.key = this.__uniqueKey;
        let value;
        value = Alpine2.extractProp(this.$el, "value", "");
        if (Object.hasOwn(this.$el.dataset, "key")) {
          this.$el.dataset.key = this.__uniqueKey;
        }
        let disabled = Alpine2.extractProp(this.$el, "disabled", false, false);
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
      this.pending = Alpine.reactive({state: false});
      this.activeIndex = Alpine.reactive({value: void 0});
      this.searchThreshold = options.searchThreshold ?? 500;
    }
    getMap() {
      return this.itemsMap;
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
      return this.get(key)?.value;
    }
    getKeyByIndex(index) {
      if (index == null || index === void 0)
        return null;
      return this.items[index]?.key ?? null;
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
      if (this.activeIndex.value === void 0)
        return null;
      return this.items[this.activeIndex.value] ?? null;
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

  // src/Managers/utils.ts
  function bindListener(el, eventKey, listener, controller) {
    el.addEventListener(eventKey, listener, {
      signal: controller.signal
    });
  }

  // src/Managers/InputManager.ts
  function createInputManager(rootDataStack) {
    const inputEl = rootDataStack.$el.querySelector("[x-rover\\:input]");
    if (!inputEl) {
      console.warn(`Input element with [x-rover\\:input] not found`);
    }
    return {
      controller: new AbortController(),
      on(eventKey, handler) {
        if (!inputEl)
          return;
        const listener = (event) => {
          const activeKey = rootDataStack.__activatedKey ?? void 0;
          handler(event, activeKey);
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
      enableDefaultInputHandlers(disabledEvents = []) {
        if (!inputEl)
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
                requestAnimationFrame(() => inputEl?.focus({preventScroll: true}));
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
            const activeKey = root.__activatedKey ?? void 0;
            handler(event, activeKey);
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
          const activeKey = root.__activatedKey ?? null;
          handler(event, optionEl, activeKey);
        };
        bindListener(optionsEl, eventKey, listener, this.controller);
      },
      findClosestOption,
      enableDefaultOptionsHandlers(disabledEvents = []) {
        const events = {
          click: (optionEl) => {
            if (!optionEl.dataset.key)
              return;
            root.$nextTick(() => root.$refs.__input?.focus({preventScroll: true}));
          },
          mouseover: (optionEl) => {
            if (!optionEl.dataset.key)
              return;
            root.__activate(optionEl.dataset.key);
          },
          mousemove: (optionEl) => {
            if (!optionEl.dataset.key || root.__isActive(optionEl.dataset.key))
              return;
            root.__activate(optionEl.dataset.key);
          },
          mouseout: () => {
            if (root.__keepActivated)
              return;
            root.__deactivate();
          }
        };
        Object.entries(events).forEach(([key, handler]) => {
          if (!disabledEvents.includes(key)) {
            this.on(key, (event, optionEl) => {
              event.stopPropagation();
              if (!optionEl)
                return;
              handler(optionEl);
            });
          }
        });
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
          const activeKey = root.__activatedKey ?? void 0;
          handler(event, activeKey);
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
    const SLOT_NAME = "rover-root";
    return {
      __collection: collection,
      __optionsEls: void 0,
      __groupsEls: void 0,
      __isOpen: false,
      __isTyping: false,
      __isLoading: false,
      __o_id: -1,
      __g_id: -1,
      __s_id: -1,
      __static: false,
      __keepActivated: true,
      __optionsEl: void 0,
      __activatedKey: void 0,
      __selectedKeys: void 0,
      __items: [],
      _x__searchQuery: "",
      __filteredKeys: null,
      __filteredKeysSet: new Set(),
      __inputManager: void 0,
      __optionsManager: void 0,
      __optionManager: void 0,
      __buttonManager: void 0,
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
        this.$el.dataset.slot = SLOT_NAME;
        this.__setupManagers();
        effect(() => {
          this.__isLoading = collection.pending.state;
        });
        effect(() => {
          this.__activatedKey = this.__getKeyByIndex(collection.activeIndex.value);
        });
        effect(() => {
          if (String(this._x__searchQuery).length > 0) {
            let results = this.__searchUsingQuery(this._x__searchQuery).map((result) => result.key);
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
          this.__optionsEls = Array.from(this.$el.querySelectorAll("[x-rover\\:option]"));
          this.__groupsEls = Array.from(this.$el.querySelectorAll("[x-rover\\:group]"));
          effect(() => {
            const activeKey = this.__activatedKey;
            const visibleKeys = this.__filteredKeys ? new Set(this.__filteredKeys) : null;
            requestAnimationFrame(() => {
              const options = this.__optionsEls;
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
              });
              const groups = this.__groupsEls;
              groups.forEach((group) => {
                const htmlGroup = group;
                const options2 = htmlGroup.querySelectorAll("[x-rover\\:option]");
                const hasVisibleOption = Array.from(options2).some((opt) => {
                  const htmlOpt = opt;
                  return visibleKeys ? visibleKeys.has(htmlOpt.dataset.key || "") : true;
                });
                htmlGroup.hidden = !hasVisibleOption;
              });
            });
          });
        });
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
          this.$refs?.__input?.focus({preventScroll: true});
        });
        this.__onOpenCallback();
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
      __startTyping() {
        this.__isTyping = true;
      },
      __stopTyping() {
        this.__isTyping = false;
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
      destroy() {
        this.__inputManager?.destroy();
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
      activate(key) {
        data.__collection.activate(key);
      },
      deactivate() {
        data.__collection.deactivate();
      },
      getValueByKey(key) {
        return data.__collection.getValueByKey(key);
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
      searchUsing(query) {
        return data.__collection.search(query);
      },
      getKeyByIndex(index) {
        return data.__collection.getKeyByIndex(index);
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
    getValueByKey(key) {
      return dataStack.__collection.getValueByKey(key);
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
    },
    getKeyByIndex(index) {
      return dataStack.__collection.getKeyByIndex(index);
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
        "x-ref": "_x__input",
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
          return Array.isArray(this.__filteredKeys) && this.__filteredKeys.length === 0 && this._x__searchQuery.length > 0;
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
          const id = String(this.__nextSeparatorId());
          this.$el.dataset.key = id;
          this.__pushSeparatorToItems(id);
          this.$el.setAttribute("role", "separator");
          this.$el.setAttribute("aria-orientation", "horizontal");
        }
      });
    }
  }

  // builds/cdn.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(rover2);
  });
})();
