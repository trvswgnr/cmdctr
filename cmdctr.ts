import type {
    DataInstance,
    TaskInstance,
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
import { errExit, getCliArgs, getValidatedOpts } from "./lib";

const _CmdCtr: CmdCtrFn = (name: string) => {
    const tasks: RegisteredTasks = new Map();
    return {
        register: (task: TaskInstance) => tasks.set(task.name, task),
        run: (_args?: string[]) => {
            if (tasks.size === 0) return errExit`no tasks registered`;
            const args = getCliArgs(tasks, name, _args);
            const taskName = args.taskName;
            const data = tasks.get(taskName);
            if (!data) return errExit`unknown task "${taskName}"`;
            data.action(getValidatedOpts(data, args));
        },
    };
};

const _Data: DataFn = <const D extends DataInstance>(data: Strict<D, DataInstance>) => data as D;

const _Task: TaskFn = <const D extends DataInstance>(data: D, action: Action<D>) => ({
    ...data,
    action: (validatedOpts: any) => action(validatedOpts),
});

export const CmdCtr = _CmdCtr as CmdCtrConstructor;
export const Data = _Data as DataConstructor;
export const Task = _Task as TaskConstructor;
