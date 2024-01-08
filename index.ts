import type {
    Data as DataInstance,
    Task as TaskInstance,
    CmdCtrConstructor,
    DataConstructor,
    TaskConstructor,
    Strict,
    Action,
    CmdCtrFn,
    RegisteredTasks,
    DataFn,
    TaskFn,
} from "./types";
import { type SpinnersKey, getCliArgs, getValidatedOpts, spinner } from "./lib";

const _CmdCtr: CmdCtrFn = (name: string) => {
    const tasks: RegisteredTasks = new Map();
    return {
        register: (task: TaskInstance) => {
            tasks.set(task.name, task);
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
};
export const CmdCtr = _CmdCtr as CmdCtrConstructor;

const _Data: DataFn = <const D extends DataInstance>(data: Strict<D, DataInstance>) => data as D;
export const Data = _Data as DataConstructor;

const _Task: TaskFn = <const D extends DataInstance>(data: D, action: Action<D>) => ({
    ...data,
    action: (validatedOpts: any) => action(validatedOpts),
});
export const Task = _Task as TaskConstructor;

export async function withSpinner<T>(
    text: string,
    fn: () => Promise<T>,
    sequence?: SpinnersKey | string[],
) {
    const spin = spinner(text, sequence || "simpleDots");
    return fn().finally(spin.stop);
}
