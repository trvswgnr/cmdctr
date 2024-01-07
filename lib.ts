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

export function getCliArgs(tasks: RegisteredTasks): CliArgs {
    const argv = process.argv;
    const cmd = argv[1].split("/").pop();
    const rawArgs = argv.slice(2);
    let usage = `Usage: ${cmd} <task> <options>`;
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
    usage = `Usage: ${cmd} ${String(taskName)} <options>\nOptions:\n`;
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
    for (const _key in options) {
        const key = _key as keyof typeof options;
        const option = options[key];
        if (!("required" in option) || !option.required) {
            args[key] ??= option.default;
        }
        if (args[key] === undefined) {
            throw `missing option "${String(key)}"\n` + usage;
        }
    }
    return Object.assign(args, { taskName });
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
