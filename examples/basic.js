// @ts-check
import { CmdCtr, Data, Command } from "cmdctr";
import ora from "ora"; // loading spinner (for funzies)

const cmdCtr = CmdCtr("example"); // or new CmdCtr(), if that's your thing

const command1Data = Data({
    name: "command-1",
    description: "A command that does something",
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

const command1 = Command(command1Data, (opts) => {
    const { input, output } = opts;
    console.log(`input: ${input}`);
    console.log(`output: ${output}`);
});

const command2Data = Data({
    name: "command-2",
    description: "A command that does something else",
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

const command2 = Command(command2Data, async (opts) => {
    const { message, loud } = opts;
    const loadingMsg = "...what was i saying again?";
    const spinner = ora(loadingMsg).start();
    const text = await new Promise((resolve) => {
        setTimeout(() => resolve(`oh yeah, ${loud ? message.toUpperCase() : message}`), 2000);
    });
    spinner.stop();
    console.log(text);
});

cmdCtr.register(command1);
cmdCtr.setDefault(command2);
cmdCtr.run();
