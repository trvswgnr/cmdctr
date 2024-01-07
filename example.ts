#!/usr/bin/env bun

import { Task, Data, CmdCtr, withSpinner } from ".";

const cmdCtr = CmdCtr(); // or new CmdCtr()

const example1Data = Data({
    name: "example-1",
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

const example1 = Task(example1Data, (opts) => {
    const { input, output } = opts;
    console.log(`input: ${input}`);
    console.log(`output: ${output}`);
});

const example2Data = Data({
    name: "example-2",
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

const example2 = Task(example2Data, async (opts) => {
    const { message, loud } = opts;
    const text = await withSpinner("thinking...", () => {
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                resolve(`oh yeah, ${message}`);
            }, 2000);
        });
    });
    console.log(loud ? text.toUpperCase() : text);
});

cmdCtr.register(example1, example2).exec();

/*
// could also be written as:
CmdCtr(example1, example2).exec();
// or
const cmdCtr = CmdCtr(example1, example2);
cmdCtr.exec();
// or
const cmdCtr = CmdCtr();
cmdCtr.register(example1);
cmdCtr.register(example2);
cmdCtr.exec();
// or
const cmdCtr = new CmdCtr(example1, example2);
cmdCtr.exec();
// or
*/
