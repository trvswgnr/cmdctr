import type {
    CmdCtrInstance,
    DataInstance,
    CommandInstance,
    CmdCtrConstructor,
    DataConstructor,
    CommandConstructor,
    Strict,
    Action,
    CmdCtrFn,
    RegisteredCommands,
    DataFn,
    CommandFn,
} from "./types";
import { errExit, getCliArgs, getValidatedOpts } from "./lib";
import { DEFAULT_TASK, TASK_NAME } from "./constants";

const _CmdCtr: CmdCtrFn = (baseCommand) => {
    const tasks: RegisteredCommands = new Map();
    const name = typeof baseCommand === "string" ? baseCommand : "";
    if (typeof baseCommand !== "string") {
        const data = baseCommand;
        if (!data) return errExit`unknown task "${baseCommand}"`;
        tasks.set(DEFAULT_TASK, { ...data, isDefault: true });
        if (data.registeredCommands.size > 0) {
            let name: string = "";
            for (const [taskname, cmd] of data.registeredCommands.entries()) {
                name += ` ${String(taskname)}`;
                tasks.set(name.trim(), cmd);
            }
        }
    }
    const self: CmdCtrInstance = {
        register: (task: CommandInstance) => {
            console.log("registering", task.name);
            let name: string = task.registeredCommands.size > 0 ? "" : task.name;
            for (const [taskname, cmd] of task.registeredCommands.entries()) {
                console.log("registering", taskname);
                name += ` ${String(taskname)}`;
                tasks.set(name.trim(), cmd);
            }
            return tasks;
        },
        run: (_args?: string[]) => {
            if (tasks.size === 0) return errExit`no tasks registered`;
            const args = getCliArgs(tasks, name, _args);
            const taskName = args.usingDefaultCommand ? DEFAULT_TASK : args[TASK_NAME];
            const data = tasks.get(taskName);
            if (!data) return errExit`unknown task "${taskName}"`;
            data.action(getValidatedOpts(data, args));
        },
    };
    return self;
};

const _Data: DataFn = <const D extends DataInstance>(data: Strict<D, DataInstance>) => data as D;

const _Command: CommandFn = <const D extends DataInstance>(data: D, action: Action<D>) => {
    const registeredCommands: RegisteredCommands = new Map();
    return {
        ...data,
        action: (validatedOpts: any) => action(validatedOpts),
        register: (cmd: CommandInstance) => registeredCommands.set(cmd.name, cmd),
        registeredCommands,
    };
};

export const CmdCtr = _CmdCtr as CmdCtrConstructor;
export const Data = _Data as DataConstructor;
export const Command = _Command as CommandConstructor;
