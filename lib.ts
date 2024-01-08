import { parseArgs } from "node:util";
import type { CliArgs, RegisteredTasks, TaskOption, TaskOptions } from "./types";
export const DEFAULT_TASK_NAME = Symbol.for("cmdctr.default_task_name");


type TaskConfig = {
    options: TaskOptions;
    args: string[];
}
export function getCliArgs(tasks: RegisteredTasks, name: string, _args?: string[]): CliArgs {
    const rawArgs = _args ?? process.argv.slice(2);
    let usageBase = `\nUsage: ${name} <task> <options>\nTasks:\n`;
    const tasksList = [...tasks.values()]
        .map((task) => `  ${task.name}: ${task.description}`)
        .join("\n");
    let usage = usageBase + tasksList;

    const taskName = (rawArgs[0] || DEFAULT_TASK_NAME) ?? '';

    const task = tasks.get(taskName);
    if (!task) {
        return errExit`missing task\n${usage}`;
    }
    const usingDefaultTask = tasks.get(DEFAULT_TASK_NAME) === task;
    const taskNameString = String(taskName)
    const nameAndTaskName = usingDefaultTask ? name : `${name} ${taskNameString}`

    const options = task.options;
    const taskArgs = usingDefaultTask ? rawArgs : rawArgs.slice(1);
    const taskConfig = {
        options,
        args: taskArgs,
    };
    const args = parseArgsChecked(taskConfig, usingDefaultTask, nameAndTaskName, taskNameString)


    const errors: string[] = checkMissingOptions(options, args);
    if (errors.length > 0) {
        const s = errors.length > 1 ? "s" : "";
        return errExit`missing required option${s} ${listify(errors)}\n${getArgumentUsageExplanation(options, nameAndTaskName)}`;
    }

    return Object.assign(args, { taskName: taskNameString, usingDefaultTask });
}


function parseArgsChecked(taskConfig: TaskConfig, usingDefaultTask: boolean, nameAndTaskName: string, taskNameString: string) {
    try {
        return parseArgs(taskConfig).values;
    } catch (e) {
        if (usingDefaultTask) {
            return errExit`invalid options\n${getArgumentUsageExplanation(taskConfig.options, nameAndTaskName)}`;
        }
        return errExit`invalid options for task "${taskNameString}"\n${getArgumentUsageExplanation(taskConfig.options, nameAndTaskName)}`;
    }

}

function checkMissingOptions(options: TaskOptions, args: Record<PropertyKey, unknown>) {
    const errors: string[] = [];
    for (const key in options) {
        const option: TaskOption | undefined = options[key];
        if (option && option?.required !== true) {
            args[key] ??= option.default;
        }
        if (args[key] === undefined) {
            errors.push(`"${String(key)}"`);
        }
    }
    return errors
}

function getArgumentUsageExplanation(options: TaskOptions, nameAndTaskName: string) {
    const usageOptions = Object.entries(options)
        .map(([long, option]) => {
            let usageOption = `  --${long}`;
            if (option.short) {
                usageOption += `, -${option.short}`;
            }
            usageOption += `: ${option.description}`;
            if (option.required !== true) {
                usageOption += ` (default: ${option.default})`;
            }
            return usageOption;
        })
        .join("\n");
    return `\nUsage: ${nameAndTaskName} <options>\nOptions:\n${usageOptions}`;
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
