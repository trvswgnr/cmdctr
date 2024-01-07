import { parseArgs } from "node:util";
import { Explicit, type CliArgs, type RegisteredTasks, type Task as Task } from "./types";

export function getCliArgs(tasks: RegisteredTasks, name: string, _args?: string[]): CliArgs {
    const rawArgs = _args ?? process.argv.slice(2);
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

export function convertToTasks(args: unknown[]) {
    return args.flat(Infinity) as Task[];
}

export function showSpinner(text: string, sequence?: string[]) {}

export function spinner(text: string, sequence: KeyofSpinnerSequences | string[]) {
    let spinnerChars =
        typeof sequence === "string" ? (spinnerSequences as any)[sequence] : sequence;
    let i = 0;
    const spin = () => {
        const spinner = spinnerChars[i];
        i = (i + 1) % spinnerChars.length;
        return spinner;
    };
    const stop = () => clearLine();
    const start = hideCursor(() => {
        process.stdout.write(text);
        const interval = setInterval(() => {
            hideCursor();
            process.stdout.write("\r" + text + spin());
        }, 100);
        return () => {
            showCursor();
            clearInterval(interval);
            stop();
        };
    });
    return start;
}

function clearLine() {
    process.stdout.write("\r\x1b[K");
}

function hideCursor(): boolean;
function hideCursor<const F extends () => any>(fn: F): F;
function hideCursor<const F extends () => any>(fn?: F): F | boolean {
    if (!fn) {
        return process.stdout.write("\x1b[?25l");
    }
    hideCursor();
    const x = fn();
    showCursor();
    return x;
}

function showCursor() {
    process.stdout.write("\x1b[?25h");
}

function listify(items: string[]) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

export type SpinnerSequences = typeof spinnerSequences;
export type KeyofSpinnerSequences = keyof SpinnerSequences;
export const spinnerSequences = {
    dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
    line: ["-", "\\", "|", "/"],
    line2: ["⠂", "-", "–", "—", "–", "-"],
    pipe: ["┤", "┘", "┴", "└", "├", "┌", "┬", "┐"],
    simpleDots: [".  ", ".. ", "...", "   "],
    simpleDotsScrolling: [".  ", ".. ", "...", " ..", "  .", "   "],
    star: ["✶", "✸", "✹", "✺", "✹", "✷"],
    star2: ["+", "x", "*"],
    flip: ["_", "_", "_", "-", "`", "`", "'", "´", "-", "_", "_", "_"],
    hamburger: ["☱", "☲", "☴"],
    growVertical: ["▁", "▃", "▄", "▅", "▆", "▇", "▆", "▅", "▄", "▃"],
    growHorizontal: ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "▊", "▋", "▌", "▍", "▎"],
    balloon: [" ", ".", "o", "O", "@", "*", " ", " ", " ", " ", " "],
    balloon2: [".", "o", "O", "°", "O", "o", "."],
    noise: ["▓", "▒", "░"],
    bounce: ["⠁", "⠂", "⠄", "⠂"],
    boxBounce: ["▖", "▘", "▝", "▗"],
    boxBounce2: ["▌", "▀", "▐", "▄"],
    triangle: ["◢", "◣", "◤", "◥"],
    arc: ["◜", "◠", "◝", "◞", "◡", "◟"],
    circle: ["◡", "⊙", "◠"],
    squareCorners: ["◰", "◳", "◲", "◱"],
    circleQuarters: ["◴", "◷", "◶", "◵"],
    circleHalves: ["◐", "◓", "◑", "◒"],
    squish: ["╫", "╪"],
    toggle: ["⊶", "⊷"],
    toggle2: ["□", "■"],
    arrow: ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"],
    arrow2: ["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸"],
    bird: ["︷", "︵", "︹", "︺", "︶", "︸", "︶", "︺", "︹", "︵"],
    bouncingBar: [
        "[    ]",
        "[=   ]",
        "[==  ]",
        "[=== ]",
        "[ ===]",
        "[  ==]",
        "[   =]",
        "[    ]",
        "[   =]",
        "[  ==]",
        "[ ===]",
        "[====]",
        "[=== ]",
        "[==  ]",
        "[=   ]",
    ],
    bouncingBall: [
        "( ●    )",
        "(  ●   )",
        "(   ●  )",
        "(    ● )",
        "(     ●)",
        "(    ● )",
        "(   ●  )",
        "(  ●   )",
        "( ●    )",
        "(●     )",
    ],
    pong: [
        "▐●            ▌",
        "▐  ●          ▌",
        "▐    ●        ▌",
        "▐     ●       ▌",
        "▐       ●     ▌",
        "▐        ●    ▌",
        "▐          ●  ▌",
        "▐            ●▌",
        "▐          ●  ▌",
        "▐        ●    ▌",
        "▐       ●     ▌",
        "▐     ●       ▌",
        "▐    ●        ▌",
        "▐  ●          ▌",
    ],
    shark: [
        "◣˷˷˷˷˷˷˷˷˷˷˷˷",
        "˷◣˷˷˷˷˷˷˷˷˷˷˷",
        "˷˷◣˷˷˷˷˷˷˷˷˷˷",
        "˷˷˷◣˷˷˷˷˷˷˷˷˷",
        "˷˷˷˷◣˷˷˷˷˷˷˷˷",
        "˷˷˷˷˷◣˷˷˷˷˷˷˷",
        "˷˷˷˷˷˷◣˷˷˷˷˷˷",
        "˷˷˷˷˷˷˷◣˷˷˷˷˷",
        "˷˷˷˷˷˷˷˷◣˷˷˷˷",
        "˷˷˷˷˷˷˷˷˷◣˷˷˷",
        "˷˷˷˷˷˷˷˷˷˷◣˷˷",
        "˷˷˷˷˷˷˷˷˷˷˷◣˷",
        "˷˷˷˷˷˷˷˷˷˷˷˷◣",
        "˷˷˷˷˷˷˷˷˷˷˷˷◢",
        "˷˷˷˷˷˷˷˷˷˷˷◢˷",
        "˷˷˷˷˷˷˷˷˷˷◢˷˷",
        "˷˷˷˷˷˷˷˷˷◢˷˷˷",
        "˷˷˷˷˷˷˷˷◢˷˷˷˷",
        "˷˷˷˷˷˷˷◢˷˷˷˷˷",
        "˷˷˷˷˷˷◢˷˷˷˷˷˷",
        "˷˷˷˷˷◢˷˷˷˷˷˷˷",
        "˷˷˷˷◢˷˷˷˷˷˷˷˷",
        "˷˷˷◢˷˷˷˷˷˷˷˷˷",
        "˷˷◢˷˷˷˷˷˷˷˷˷˷",
        "˷◢˷˷˷˷˷˷˷˷˷˷˷",
        "◢˷˷˷˷˷˷˷˷˷˷˷˷",
    ],
    dqpb: ["d", "q", "p", "b"],
    grenade: [
        "،   ",
        "′   ",
        " ´ ",
        " ‾ ",
        "  ⸌",
        "  ⸊",
        "  |",
        "  ⁎",
        "  ⁕",
        " ෴ ",
        "  ⁓",
        "   ",
        "   ",
        "   ",
    ],
    point: ["∙∙∙", "●∙∙", "∙●∙", "∙∙●", "∙∙∙"],
    pointBounce: ["●∙∙∙∙", "∙●∙∙∙", "∙∙●∙∙", "∙∙∙●∙", "∙∙∙∙●", "∙∙∙●∙", "∙∙●∙∙", "∙●∙∙∙"],
    layer: ["-", "=", "≡"],
    betaWave: ["ρββββββ", "βρβββββ", "ββρββββ", "βββρβββ", "ββββρββ", "βββββρβ", "ββββββρ"],
} as const;
