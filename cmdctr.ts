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
import { DEFAULT_COMMAND_NAME, COMMAND_NAME } from "./constants";

const _CmdCtr: CmdCtrFn = (baseCommand) => {
    const commands: RegisteredCommands = new Map();
    const name = typeof baseCommand === "string" ? baseCommand : "";
    if (typeof baseCommand !== "string") {
        const data = baseCommand;
        if (!data) return errExit`unknown command "${baseCommand}"`;
        commands.set(DEFAULT_COMMAND_NAME, { ...data, isDefault: true });
        if (data.registeredCommands.size > 0) {
            let name: string = "";
            for (const [commandname, cmd] of data.registeredCommands.entries()) {
                name += ` ${String(commandname)}`;
                commands.set(name.trim(), cmd);
            }
        }
    }
    const self: CmdCtrInstance = {
        register: (command: CommandInstance) => {
            console.log("registering", command.name);
            let name: string = command.registeredCommands.size > 0 ? "" : command.name;
            for (const [commandname, cmd] of command.registeredCommands.entries()) {
                console.log("registering", commandname);
                name += ` ${String(commandname)}`;
                commands.set(name.trim(), cmd);
            }
            return commands;
        },
        run: (_args?: string[]) => {
            if (commands.size === 0) return errExit`no commands registered`;
            const args = getCliArgs(commands, name, _args);
            const commandName = args.usingDefaultCommand ? DEFAULT_COMMAND_NAME : args[COMMAND_NAME];
            const data = commands.get(commandName);
            if (!data) return errExit`unknown command "${commandName}"`;
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
