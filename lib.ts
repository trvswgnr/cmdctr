import { parseArgs } from "node:util";
import type { CliArgs, RegisteredCommands, CommandOption } from "./types";
import { DEFAULT_COMMAND_NAME, ParseError, COMMAND_NAME } from "./constants";

export function getCliArgs(commands: RegisteredCommands, name: string, _args?: string[]): CliArgs {
    const rawArgs = _args ?? process.argv.slice(2);
    let usageBase = `\nUsage: ${name} <command> <options>\nCommands:\n`;
    const commandsList = [...commands.values()]
        .map((command) => `  ${command.name}: ${command.description}`)
        .join("\n");
    let usage = usageBase + commandsList;
    let [commandNameRaw, lastCommandNameIndex] = tryToGetCommandName(rawArgs, commands);
    let usingDefaultCommand = false;
    if (!commandNameRaw) {
        if (!commands.has(DEFAULT_COMMAND_NAME)) {
            return errExit`1missing command\n${usage}`;
        }
        commandNameRaw = commands.get(DEFAULT_COMMAND_NAME)!.name;
        usingDefaultCommand = true;
    }
    let commandName = commandNameRaw ?? "";
    if (!commands.has(commandName)) {
        if (!commands.has(DEFAULT_COMMAND_NAME)) {
            return errExit`2missing command\n${usage}`;
        }
        commandName = commands.get(DEFAULT_COMMAND_NAME)!.name;
        usingDefaultCommand = true;
    }
    let command = commands.get(commandName);
    if (!command) {
        if (!commands.has(DEFAULT_COMMAND_NAME)) {
            return errExit`3missing command\n${usage}`;
        }
        command = commands.get(DEFAULT_COMMAND_NAME);
        usingDefaultCommand = true;
    }
    if (!command) {
        return errExit`4missing command\n${usage}`;
    }
    const options = command.options;
    const usageOptions = Object.entries(options)
        .map(([long, option]) => {
            let usageOption = `  --${long}`;
            if (option.short) {
                usageOption += `, -${option.short}`;
            }
            usageOption += `: ${option.description}`;
            if (!("required" in option) || !option.required) {
                usageOption += ` (default: ${option.default})`;
            }
            return usageOption;
        })
        .join("\n");
    const nameAndCommandName = usingDefaultCommand ? name : `${name} ${commandName}`;
    usage = `\nUsage: ${nameAndCommandName} <options>\nOptions:\n`;
    usage += usageOptions;

    const commandArgs = rawArgs.slice(lastCommandNameIndex);
    const commandConfig = {
        options,
        args: commandArgs,
    };
    let parsed: ReturnType<typeof parseArgs<typeof commandConfig>>;
    try {
        parsed = parseArgs(commandConfig);
    } catch (e) {
        const err = ParseError.from(e, usingDefaultCommand ? name : commandName);
        return errExit`${err.message}\n${usage}`;
    }
    const args = parsed.values as Record<PropertyKey, unknown>;
    const errors: string[] = [];
    for (const _key in options) {
        const key = _key as keyof typeof options;
        const option = options[key] ?? ({} as CommandOption);
        if (!("required" in option) || !option.required) {
            args[key] ??= option.default;
        }
        if (args[key] === undefined) {
            errors.push(`"${String(key)}"`);
        }
    }
    if (errors.length > 0) {
        const s = errors.length > 1 ? "s" : "";
        return errExit`missing required option${s} ${listify(errors)}\n${usage}`;
    }

    return Object.assign(args, { [COMMAND_NAME]: commandName, usingDefaultCommand });
}

// command name could be the first argument, or it could be a series of commands and subcommands
function tryToGetCommandName(args: string[], commands: RegisteredCommands) {
    if (args.length === 0) return [null, 0] as const;
    const firstArg = args[0] ?? "";
    if (commands.has(firstArg)) return [firstArg, 1] as const;
    const commandNames = new Set(commands.keys());
    let commandName = "";
    let i = 0;
    for (const arg of args) {
        i++;
        commandName += arg;
        if (commandNames.has(commandName)) return [commandName, i] as const;
        commandName += " ";
    }
    return [null, 0] as const;
}

/** validates the options passed to a command */
export function getValidatedOpts<const T>(data: any, args: T) {
    if (typeof args !== "object" || args === null) {
        return errExit`args is not an object`;
    }
    for (const key in data.options) {
        if (!(key in args)) {
            return errExit`missing option "${key}"`;
        }
        const option = data.options[key];
        if (typeof (args as any)[key] !== option.type) {
            return errExit`option "${key}" should be of type "${option.type}"`;
        }
    }
    return args;
}

function listify(items: string[]) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

export function errExit(_strings?: string | TemplateStringsArray, ...values: unknown[]) {
    const red = (str: string) => `\x1b[31m${str}\x1b[0m`;
    const strings =
        _strings === undefined ? [] : typeof _strings === "string" ? [_strings] : _strings;
    const message = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
    let m = "unknown error";
    if (message) {
        const errMessage = getErrorMessage();
        m = `${red(`${errMessage}:`)} ${message}`;
        console.log(m);
    }
    if (process.env.NODE_ENV === "test") {
        throw new Error(m);
    }
    return process.exit(1);
}

function getErrorMessage() {
    const messages = [
        "¯\\_(ツ)_/¯",
        "oh no",
        "oops!",
        "uh oh",
        "lol whoops",
        "ahhh!",
        "[screaming]",
        "this isn't good",
        "it's so bad",
        "i can't believe you've done this",
        "ughhh",
        "x_x",
        "f",
        "rip",
        "worst case ontario",
        "this is fine",
        "(╯°□°）╯︵ ┻━┻",
        "┻━┻︵ \\(°□°)/ ︵ ┻━┻",
        "i'm sorry, dave, i'm afraid i can't do that",
        "¯\\_(ツ)_/¯",
        "hmm",
        "uhhh",
    ];
    const index = Math.floor(Math.random() * messages.length);
    return Math.random() >= 0.7 ? messages[index] : "error";
}
