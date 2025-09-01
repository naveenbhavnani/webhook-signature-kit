"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/replay/memory.ts
var memory_exports = {};
__export(memory_exports, {
  MemoryReplayStore: () => MemoryReplayStore
});
module.exports = __toCommonJS(memory_exports);
var MemoryReplayStore = class {
  constructor(maxEntries = 1e4) {
    this.max = maxEntries;
    this.map = /* @__PURE__ */ new Map();
  }
  async putOnce(key, ttlSeconds) {
    const now = Date.now();
    if (this.map.size > this.max) {
      const cutoff = now;
      for (const [k, v] of this.map) if (v.expires <= cutoff) this.map.delete(k);
      while (this.map.size > this.max) {
        const firstKey = this.map.keys().next().value;
        if (firstKey !== void 0) {
          this.map.delete(firstKey);
        } else {
          break;
        }
      }
    }
    const existing = this.map.get(key);
    if (existing && existing.expires > now) return false;
    this.map.set(key, { expires: now + ttlSeconds * 1e3 });
    return true;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MemoryReplayStore
});
