import { parseArgs } from "node:util";
import type { CliArgs, RegisteredTasks, TaskOption } from "./types";

export function getCliArgs(tasks: RegisteredTasks, name: string, _args?: string[]): CliArgs {
    const rawArgs = _args ?? process.argv.slice(2);
    let usage = `Usage: ${name} <task> <options>\nTasks:\n`;
    usage += [...tasks.values()].map((task) => `  ${task.name}: ${task.description}`).join("\n");
    if (rawArgs.length < 1) {
        return errExit`missing task\n${usage}`;
    }
    const taskName = rawArgs[0] ?? "";
    if (!tasks.has(taskName)) {
        return errExit`unknown task "${String(taskName)}"\n${usage}`;
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
        return errExit`invalid options for task "${String(taskName)}" - ${err.message}\n${usage}`;
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

    return Object.assign(args, { taskName });
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
    const strings =
        _strings === undefined ? [] : typeof _strings === "string" ? [_strings] : _strings;
    const message = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
    if (message) {
        console.log(`ERROR: ${message}`);
    }
    return process.exit(1);
}
