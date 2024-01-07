export type CmdCtr = {
    register: {
        (tasks: Iterable<Task>): CmdCtr;
        (...tasks: Task[]): CmdCtr;
    };
    exec: () => void | Promise<void>;
};

export type CmdCtrConstructor = {
    (tasks: Iterable<Task>): CmdCtr;
    new (tasks: Iterable<Task>): CmdCtr;
    (...tasks: Task[]): CmdCtr;
    new (...tasks: Task[]): CmdCtr;
};

/** data for a task including its options and information about it */
export type Data = {
    name: StartsWithAlpha;
    description: string;
    options: TaskOptions;
};

// prettier-ignore
type Alpha = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
           | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";

type StartsWithAlpha = Explicit<`${Alpha}${string}`>;

/** the constructor of a data object, which can be called with `new` or without */
export type DataConstructor = {
    <const D extends Data>(data: Strict<D, Data>): D;
    new <const D extends Data>(data: Strict<D, Data>): D;
};

/** a task that can be registered and run */
export type Task = Data & { action: (validatedOpts: any) => void };

/** the constructor of a task, which can be called with `new` or without */
export type TaskConstructor = {
    <const D extends Data>(data: D, action: Action<D>): Task;
    new <const D extends Data>(data: D, action: Action<D>): Task;
};

/** the action function of a task */
export type Action<T extends Data> = (args: MaskOpts<ValidatedOpts<T>>) => void | Promise<void>;

export type RegisteredTasks = Map<string, Task>;

/** the possible options for a task */
export type TaskOptions = {
    [long: string]:
        | {
              type: "string" | "boolean";
              short?: string;
              description: string;
              required: true;
          }
        | {
              type: "boolean";
              short?: string;
              description: string;
              required?: false;
              default: boolean;
          }
        | {
              type: "string";
              short?: string;
              description: string;
              required?: false;
              default: string;
          };
};

/** the key of the `taskName` property of the `CliArgs` type */
type TaskNameKey = "taskName";

/** the validated options passed to the task action */
export type ValidatedOpts<T extends Data> = OptionsFromData<T>;

/** extracts the argument types from the `options` property of `Data` */
export type OptionsFromData<T extends Data> = {
    [K in keyof T["options"]]: T["options"][K] extends { type: "boolean" } ? boolean : string;
} & { [K in TaskNameKey]: string };

/** the arguments passed to the CLI */
export type CliArgs = Record<PropertyKey, unknown> & { [K in TaskNameKey]: string };

/** widens the type `T` to be compatible with the type `U` if it has the same keys */
export type Widen<T, U> = { [K in keyof T]: K extends keyof U ? U[K] : T[K] };

/** ensures that the type `T` contains all and **_only_** the properties of type `U` */
export type Strict<T, U> = U extends Widen<T, U> ? T : `ERROR: only known properties are allowed`;

/** removes the `TaskNameKey` property from the type `T` */
export type MaskOpts<T> = T extends infer U
    ? { [K in keyof U as K extends TaskNameKey ? never : K]: U[K] }
    : never;

// ! hack to make the type show as its name instead of its definition
type Explicit<T> = ExplicitHelper1<ExplicitHelper2<T>>;
type ExplicitHelper1<T> = T & { [EXPLICIT1]?: never };
type ExplicitHelper2<T> = { [K in keyof T]: T[K] } & { [EXPLICIT2]?: never };
declare const EXPLICIT1: unique symbol;
declare const EXPLICIT2: unique symbol;
