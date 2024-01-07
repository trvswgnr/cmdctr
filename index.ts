import type {
    Data as DataInstance,
    Task as TaskInstance,
    CmdCtrConstructor,
    DataConstructor,
    TaskConstructor,
    Strict,
    Action,
} from "./types";
import { getCliArgs, getValidatedOpts, showSpinner } from "./lib";

const createCmdCtr = function (...args: unknown[]) {
    const tasksArr = convertToTasks(args);
    const tasks = new Map<string, TaskInstance>(tasksArr.map((task) => [task.name, task]));
    const self = {
        register: (...args: unknown[]) => {
            const tasksArr = convertToTasks(args);
            tasksArr.forEach((task) => tasks.set(task.name, task));
            return self;
        },
        exec: () => {
            if (tasks.size === 0) throw "no tasks registered";
            const args = getCliArgs(tasks);
            const taskName = args.taskName;
            const data = tasks.get(taskName);
            if (!data) throw `unknown task "${taskName}"`;
            data.action(getValidatedOpts(data, args));
        },
    };
    return self;
};
function convertToTasks(args: unknown[]) {
    return args.flat(Infinity) as TaskInstance[];
}
export const CmdCtr = function (...args: unknown[]) {
    return createCmdCtr(...args);
} as CmdCtrConstructor;

export const Data = function <const D extends DataInstance>(data: Strict<D, DataInstance>) {
    return data;
} as DataConstructor;

export const Task = function <const D extends DataInstance>(data: D, action: Action<D>) {
    return {
        ...data,
        action: (validatedOpts: any) => action(validatedOpts),
    };
} as TaskConstructor;

export async function withSpinner<T>(text: string, f: () => Promise<T>) {
    const stopSpinner = showSpinner(text);
    try {
        return await f();
    } finally {
        stopSpinner();
    }
}
