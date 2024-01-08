import { parseArgs } from "node:util";
import type { CliArgs, RegisteredTasks, TaskOption } from "./types";

export const DEFAULT_TASK_NAME = Symbol.for("cmdctr.default_task_name");

export function getCliArgs(tasks: RegisteredTasks, name: string, _args?: string[]): CliArgs {
    const rawArgs = _args ?? process.argv.slice(2);
    let usageBase = `\nUsage: ${name} <task> <options>\nTasks:\n`;
    const tasksList = [...tasks.values()]
        .map((task) => `  ${task.name}: ${task.description}`)
        .join("\n");
    let usage = usageBase + tasksList;
    let taskNameRaw = rawArgs[0];
    let usingDefaultTask = false;
    if (!taskNameRaw) {
        if (!tasks.has(DEFAULT_TASK_NAME)) {
            return errExit`missing task\n${usage}`;
        }
        taskNameRaw = tasks.get(DEFAULT_TASK_NAME)!.name;
        usingDefaultTask = true;
    }
    let taskName = taskNameRaw ?? "";
    if (!tasks.has(taskName)) {
        if (!tasks.has(DEFAULT_TASK_NAME)) {
            return errExit`missing task\n${usage}`;
        }
        taskName = tasks.get(DEFAULT_TASK_NAME)!.name;
        usingDefaultTask = true;
    }
    let task = tasks.get(taskName);
    if (!task) {
        if (!tasks.has(DEFAULT_TASK_NAME)) {
            return errExit`missing task\n${usage}`;
        }
        task = tasks.get(DEFAULT_TASK_NAME);
        usingDefaultTask = true;
    }
    if (!task) {
        return errExit`missing task\n${usage}`;
    }
    const options = task.options;
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
    const nameAndTaskName = usingDefaultTask ? name : `${name} ${taskName}`;
    usage = `\nUsage: ${nameAndTaskName} <options>\nOptions:\n`;
    usage += usageOptions;

    const taskArgs = usingDefaultTask ? rawArgs : rawArgs.slice(1);
    const taskConfig = {
        options,
        args: taskArgs,
    };
    let parsed: ReturnType<typeof parseArgs<typeof taskConfig>>;
    try {
        parsed = parseArgs(taskConfig);
    } catch (e) {
        if (usingDefaultTask) {
            return errExit`invalid options\n${usage}`;
        }
        return errExit`invalid options for task "${String(taskName)}"\n${usage}`;
    }
    const args = parsed.values as Record<PropertyKey, unknown>;
    const errors: string[] = [];
    for (const _key in options) {
        const key = _key as keyof typeof options;
        const option = options[key] ?? ({} as TaskOption);
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

    return Object.assign(args, { taskName, usingDefaultTask });
}

/** validates the options passed to a task */
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
    if (message) {
        const errMessage = getErrorMessage();
        console.log(`${red(`${errMessage}:`)} ${message}`);
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
