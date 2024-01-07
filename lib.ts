import { parseArgs } from "node:util";
import { type CliArgs, type RegisteredTasks, type Task as Task } from "./types";

export function getValidatedOpts<const T>(data: any, args: T) {
    if (typeof args !== "object" || args === null) {
        throw "args is not an object";
    }
    for (const key in data.options) {
        if (!(key in args)) {
            throw `missing option "${key}"`;
        }
        const option = data.options[key];
        if (typeof (args as any)[key] !== option.type) {
            throw `option "${key}" should be of type "${option.type}"`;
        }
    }
    return args;
}

export function getCliArgs(tasks: RegisteredTasks, name: string, _args?: string[]): CliArgs {
    const rawArgs = _args ?? process.argv;
    let usage = `Usage: ${name} <task> <options>\nTasks:\n`;
    usage += [...tasks.values()].map((task) => `  ${task.name}: ${task.description}`).join("\n");
    if (rawArgs.length < 1) {
        throw "missing task\n" + usage;
    }
    const taskName = rawArgs[0];
    if (!tasks.has(taskName)) {
        throw `unknown task "${String(taskName)}"\n` + usage;
    }
    const options = tasks.get(taskName)!.options;
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
    usage = `Usage: ${name} ${String(taskName)} <options>\nOptions:\n`;
    usage += usageOptions;

    const taskArgs = rawArgs.slice(1);
    const taskConfig = {
        options,
        args: taskArgs,
    };
    let parsed: ReturnType<typeof parseArgs<typeof taskConfig>>;
    try {
        parsed = parseArgs(taskConfig);
    } catch (e) {
        const err = e instanceof Error ? e : new Error("unknown error");
        console.log(err.name);
        throw `invalid options for task "${String(taskName)}" - ${err.message}\n` + usage;
    }
    const args = parsed.values as Record<PropertyKey, unknown>;
    const errors = [] as string[];
    for (const _key in options) {
        const key = _key as keyof typeof options;
        const option = options[key];
        if (!("required" in option) || !option.required) {
            args[key] ??= option.default;
        }
        if (args[key] === undefined) {
            errors.push(`"${String(key)}"`);
        }
    }
    if (errors.length > 0) {
        const s = errors.length > 1 ? "s" : "";
        throw `missing required option${s} ${listify(errors)}\n` + usage;
    }

    return Object.assign(args, { taskName });
}

function listify(items: string[]) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

export function convertToTasks(args: unknown[]) {
    return args.flat(Infinity) as Task[];
}

export function showSpinner(text: string) {
    const spin = spinner(text).start();
    return () => spin.stop();
}

function spinner(text: string, sequence = ["|", "/", "-", "\\"]) {
    const spinnerChars = sequence;
    let i = 0;
    const spin = () => {
        const spinner = spinnerChars[i];
        i = (i + 1) % spinnerChars.length;
        return spinner;
    };
    const stop = () => {
        clearLine();
    };
    const start = () => {
        process.stdout.write(text + " ");
        const interval = setInterval(() => {
            process.stdout.write("\r" + text + " " + spin());
            hideCursor();
        }, 100);
        return {
            stop: () => {
                clearInterval(interval);
                stop();
            },
        };
    };
    return {
        start,
        stop,
    };
}

function clearLine() {
    process.stdout.write("\r\x1b[K");
}

function hideCursor() {
    process.stdout.write("\x1b[?25l");
}
