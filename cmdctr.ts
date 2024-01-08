import type {
    CmdCtrInstance,
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
import { DEFAULT_TASK, TASK_NAME } from "./constants";

const _CmdCtr: CmdCtrFn = (baseCommand) => {
    const tasks: RegisteredTasks = new Map();
    let data = typeof baseCommand === "string" ? tasks.get(baseCommand) : baseCommand;
    if (!data) return errExit`unknown task "${baseCommand}"`;
    tasks.set(DEFAULT_TASK, { ...data, isDefault: true });
    const name = typeof baseCommand === "string" ? baseCommand : data.name;
    const self: CmdCtrInstance = {
        register: (task: TaskInstance) => tasks.set(task.name, task),
        run: (_args?: string[]) => {
            if (tasks.size === 0) return errExit`no tasks registered`;
            const args = getCliArgs(tasks, name, _args);
            const taskName = args.usingDefaultTask ? DEFAULT_TASK : args[TASK_NAME];
            const data = tasks.get(taskName);
            if (!data) return errExit`unknown task "${taskName}"`;
            data.action(getValidatedOpts(data, args));
        },
    };
    return self;
};

const _Data: DataFn = <const D extends DataInstance>(data: Strict<D, DataInstance>) => data as D;

const _Task: TaskFn = <const D extends DataInstance>(data: D, action: Action<D>) => ({
    ...data,
    action: (validatedOpts: any) => action(validatedOpts),
});

export const CmdCtr = _CmdCtr as CmdCtrConstructor;
export const Data = _Data as DataConstructor;
export const Task = _Task as TaskConstructor;
