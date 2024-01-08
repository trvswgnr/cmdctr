import { parseArgs } from "node:util";
import { type CliArgs, type RegisteredTasks, type Task as Task } from "./types";

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

/** validates the options passed to a task */
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

function listify(items: string[]) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(" and ");
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

/** terminal utilities */
export const term = {
    clearLine: () => process.stdout.write("\r\x1b[K"),
    hideCursor: () => process.stdout.write("\x1b[?25l"),
    showCursor: () => process.stdout.write("\x1b[?25h"),
};

/**
 * show a text spinner while `fn` is running
 *
 * @example
 * ```ts
 * const obj = spinner("thinking ", "simpleDots");
 * const text = await fn();
 * obj.stop();
 * ```
 *
 * @param text the text to be printed before the spinner
 * @param sequence the name of the spinner sequence, or an array of strings to be used as the spinner
 * @returns an object with a `stop` method
 */
export function spinner(text: string, sequence?: SpinnersKey | string[]) {
    let spinnerChars = typeof sequence === "string" ? (spinners as any)[sequence] : sequence;
    if (!spinnerChars) {
        spinnerChars = spinners.simpleDots;
    }
    let i = 0;
    const spin = () => {
        const spinner = spinnerChars![i];
        i = (i + 1) % spinnerChars!.length;
        return spinner;
    };
    const stop = (text?: string) => {
        term.clearLine();
        term.showCursor();
        if (text) {
            process.stdout.write(text);
        }
    };
    term.hideCursor();
    process.stdout.write(text);
    const interval = setInterval(() => process.stdout.write("\r" + text + spin()), 100);
    return {
        /** stop the spinner and clear the line */
        stop: (text?: string) => {
            clearInterval(interval);
            stop(text);
        },
    };
}
process.on("SIGINT", () => {
    term.showCursor();
    process.stdout.write("\n");
    process.exit(130);
});

export type Spinners = typeof spinners;
export type SpinnersKey = keyof Spinners;

/**  @see https://wiki.tcl-lang.org/page/Text+Spinner */
export const spinners = {
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
};
