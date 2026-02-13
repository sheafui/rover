(() => {
  // src/factories/CreateRoverOption.ts
  var SLOT_NAME = "rover-option";
  function CreateRoverOption(Alpine2, id, dirValue) {
    return {
      __uniqueKey: "option-" + id,
      __isVisible: true,
      init() {
        this.$el.dataset.slot = SLOT_NAME;
        this.$el.dataset.key = this.__uniqueKey;
        let value;
        if (dirValue !== null) {
          value = dirValue;
        } else {
          value = Alpine2.extractProp(this.$el, "value", "");
        }
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
      this.pending = Alpine.reactive({state: false});
      this.activeIndex = Alpine.reactive({value: void 0});
      this.searchThreshold = options.searchThreshold ?? 500;
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

  // src/Managers/InputManager.ts
  function createInputManager(root) {
    const cleanup = [];
    return {
      on(eventKey, handler) {
        root.$nextTick(() => {
          const inputEl = root.$refs.__input;
          if (!inputEl)
            return;
          const listener = (event) => {
            const activeKey = root.__activatedKey ?? null;
            handler(event, activeKey);
          };
          inputEl.addEventListener(eventKey, listener);
          cleanup.push(() => {
            inputEl.removeEventListener(eventKey, listener);
          });
        });
      },
      set value(val) {
        root.$nextTick(() => {
          const inputEl = root.$refs.__input;
          if (inputEl) {
            inputEl.value = val;
          }
        });
      },
      get value() {
        const inputEl = root.$refs.__input;
        return inputEl ? inputEl.value : "";
      },
      destroy() {
        cleanup.forEach((fn) => fn());
      }
    };
  }

  // src/factories/CreateRoverRoot.ts
  function CreateRoverRoot({
    effect
  }) {
    const collection = new RoverCollection_default();
    const SLOT_NAME2 = "rover-root";
    return {
      collection,
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
      __searchQuery: "",
      __filteredKeys: null,
      __filteredKeysSet: new Set(),
      __inputManager: null,
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
      __onOpenCallback: () => {
      },
      __onOpen(callback) {
        this.__onOpenCallback = callback;
      },
      __onCloseCallback: () => {
      },
      __onClose(callback) {
        this.__onCloseCallback = callback;
      },
      init() {
        this.$el.dataset.slot = SLOT_NAME2;
        this.__inputManager = createInputManager(this);
        this.__handleSharedInputEvents();
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
      __close() {
        this.__isOpen = false;
        this.__deactivate();
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
        const findClosestOption = (el) => Alpine.findClosest(el, (node) => node.dataset.slot === SLOT_NAME);
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
            this.$nextTick(() => this.$refs?.__input?.focus({preventScroll: true}));
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
        });
      },
      __handleSharedInputEvents() {
        this.__inputManager.on("focus", () => {
          this.__startTyping();
        });
        this.__inputManager.on("input", () => {
          if (this.__isTyping) {
            this.__open();
          }
        });
        this.__inputManager.on("blur", () => {
          this.__stopTyping();
        });
        this.__inputManager.on("keydown", (e) => {
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
            case "Escape":
              e.preventDefault();
              e.stopPropagation();
              this.__close();
              this.$nextTick(() => this.$refs?.__input?.focus({preventScroll: true}));
              break;
            default:
              break;
          }
        });
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
      get isOpen() {
        return data.__isOpen;
      },
      get collection() {
        return data.collection;
      },
      onOpen(callback) {
        data.__onOpen(callback);
      },
      get input() {
        return data.__inputManager;
      },
      onClose(callback) {
        data.__onClose(callback);
      },
      activate(key) {
        data.collection.activate(key);
      },
      deactivate() {
        data.collection.deactivate();
      },
      getValueByKey(key) {
        return data.collection.getValueByKey(key);
      },
      getActiveItem() {
        return data.collection.getActiveItem();
      },
      activateNext() {
        data.collection.activateNext();
      },
      activatePrev() {
        data.collection.activatePrev();
      },
      activateFirst() {
        data.collection.activateFirst();
      },
      activateLast() {
        data.collection.activateLast();
      },
      searchUsing(query) {
        return data.collection.search(query);
      },
      getKeyByIndex(index) {
        return data.collection.getKeyByIndex(index);
      }
    };
  };

  // src/magics/roverOption.ts
  var roverOption = (dataStack) => ({
    activate(key) {
      dataStack.collection.activate(key);
    },
    deactivate() {
      dataStack.collection.deactivate();
    },
    getValueByKey(key) {
      return dataStack.collection.getValueByKey(key);
    },
    getActiveItem() {
      return dataStack.collection.getActiveItem();
    },
    activateNext() {
      dataStack.collection.activateNext();
    },
    activatePrev() {
      dataStack.collection.activatePrev();
    },
    activateFirst() {
      dataStack.collection.activateFirst();
    },
    activateLast() {
      dataStack.collection.activateLast();
    },
    searchUsing(query) {
      return dataStack.collection.search(query);
    },
    getKeyByIndex(index) {
      return dataStack.collection.getKeyByIndex(index);
    }
  });

  // src/magics/roverOptions.ts
  var roverOptions = (dataStack) => ({
    isOpen() {
      return dataStack.__isOpen;
    },
    open() {
      dataStack.__open();
    },
    close() {
      dataStack.__close();
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
    Alpine2.directive("rover", (el, {value, modifiers, expression}, {Alpine: Alpine3, effect, evaluate}) => {
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
          handleOption(Alpine3, el, expression, evaluate);
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
        "x-ref": "__input",
        "x-model": "__searchQuery",
        "x-bind:id"() {
          return this.$id("rover-input");
        },
        role: "combobox",
        tabindex: "0",
        "aria-autocomplete": "list",
        "x-init"() {
          this.$el.dataset.slot = "rover-input";
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
        "x-init"() {
          this.$data.__static = Alpine2.extractProp(this.$el, "static", false);
          if (Alpine2.bound(this.$el, "keepActivated")) {
            this.__keepActivated = true;
          }
          this.$el.dataset.slot = "rover-options";
        },
        "x-show"() {
          return this.$data.__static ? true : this.$data.__isOpen;
        }
      });
    }
    function handleOption(Alpine3, el, expression, evaluate) {
      Alpine3.bind(el, {
        "x-id"() {
          return ["rover-option"];
        },
        "x-bind:id"() {
          return this.$id("rover-option");
        },
        role: "option",
        "x-data"() {
          let value = null;
          if (expression !== "") {
            value = evaluate(expression);
          }
          return CreateRoverOption(Alpine3, this.__nextOptionId(), value);
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

  // builds/cdn.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(rover2);
  });
})();
