import type {
    Data as DataInstance,
    Task as TaskInstance,
    CmdCtrConstructor,
    DataConstructor,
    TaskConstructor,
    Strict,
    Action,
} from "./types";
import { convertToTasks, getCliArgs, getValidatedOpts, showSpinner } from "./lib";

export const CmdCtr = function (name: string) {
    const tasks = new Map<string, TaskInstance>();
    const self = {
        register: (task: TaskInstance) => {
            tasks.set(task.name, task);
            return self;
        },
        run: (_args?: string[]) => {
            if (tasks.size === 0) throw "no tasks registered";
            const args = getCliArgs(tasks, name, _args);
            const taskName = args.taskName;
            const data = tasks.get(taskName);
            if (!data) throw `unknown task "${taskName}"`;
            data.action(getValidatedOpts(data, args));
        },
    };
    return self;
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
