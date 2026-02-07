// Mock Alpine.reactive since RoverCollection depends on it
global.Alpine = {
  reactive: <T>(obj: T): T => {
    return new Proxy(obj as any, {
      set(target, property, value) {
        target[property] = value;
        return true;
      },
      get(target, property) {
        return target[property];
      }
    });
  }
} as any;