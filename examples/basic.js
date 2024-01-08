// @ts-check
import { CmdCtr, Data, Task } from "cmdctr";
import ora from "ora"; // loading spinner (for funzies)

const cmdCtr = CmdCtr("example"); // or new CmdCtr(), if that's your thing

const task1Data = Data({
    name: "task-1",
    description: "A task that does something",
    options: {
        input: {
            short: "i",
            type: "string",
            description: "The input file to be processed",
            required: true,
        },
        output: {
            short: "o",
            type: "string",
            description: "The output file to be written",
            required: true,
        },
    },
});

const task1 = Task(task1Data, (opts) => {
    const { input, output } = opts;
    console.log(`input: ${input}`);
    console.log(`output: ${output}`);
});

const task2Data = Data({
    name: "task-2",
    description: "A task that does something else",
    options: {
        message: {
            short: "m",
            type: "string",
            description: "The message to be printed",
            required: true,
        },
        loud: {
            short: "l",
            type: "boolean",
            description: "Whether the message should be printed loudly",
            default: false,
        },
    },
});

const task2 = Task(task2Data, async (opts) => {
    const { message, loud } = opts;
    const loadingMsg = "...what was i saying again?";
    const spinner = ora(loadingMsg).start();
    const text = await new Promise((resolve) => {
        setTimeout(() => resolve(`oh yeah, ${loud ? message.toUpperCase() : message}`), 2000);
    });
    spinner.stop();
    console.log(text);
});

cmdCtr.register(task1);
cmdCtr.register(task2);
cmdCtr.run();
