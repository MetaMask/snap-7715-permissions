/**
 * Makes all properties in an object type required recursively.
 * This includes nested objects and arrays.
 */
export type DeepRequired<TParent> = TParent extends (infer U)[]
  ? DeepRequired<U>[]
  : TParent extends object
    ? {
        [P in keyof TParent]-?: DeepRequired<TParent[P]>;
      }
    : TParent;
