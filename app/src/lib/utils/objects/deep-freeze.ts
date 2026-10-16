export function deepFreeze<T extends object>(obj: T): Readonly<T> {
    Object.freeze(obj);
  
    for (const key of Reflect.ownKeys(obj)) {
      const value = (obj as Record<PropertyKey, unknown>)[key];
      if (
        value !== null &&
        (typeof value === "object" || typeof value === "function") &&
        !Object.isFrozen(value)
      ) {
        deepFreeze(value);
      }
    }
  
    return obj;
  }