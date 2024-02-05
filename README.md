# Command Center

<!-- start badges -->
[![github latest release](https://badgen.net/github/tag/trvswgnr/cmdctr?label=latest&cache=600)](https://github.com/trvswgnr/cmdctr/releases/latest)
[![npm version](https://badgen.net/npm/v/cmdctr?cache=600)](https://www.npmjs.com/package/cmdctr)
![npm weekly downloads](https://img.shields.io/npm/dw/cmdctr)
![dependencies](https://img.shields.io/badge/dependencies-0-orange)
[![license](https://img.shields.io/github/license/trvswgnr/cmdctr)](LICENSE)
[![open issues](https://badgen.net/github/open-issues/trvswgnr/cmdctr?label=issues)](https://github.com/trvswgnr/cmdctr/issues)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/cmdctr)](https://bundlephobia.com/result?p=cmdctr)
![follow on xitter](https://img.shields.io/twitter/follow/techsavvytravvy?style=social)
<!-- end badges -->

Command Center (`cmdctr`) is a [*tiny*](https://bundlephobia.com/result?p=cmdctr) no-frills library for TypeScript and JavaScript that provides a
simple, yet flexible way to create command line interfaces (CLI). It allows you to define commands
with specific options and actions, and then run these commands from the command line. Type safety is
built in, so you can be sure that your commands are being run with the correct options.

> [!WARNING]
>
> This project is still in early development and is not ready for production use.

#### What it is

`cmdctr` is a focused, streamlined tool for creating CLI apps without unnecessary complexity. It's
heavily focused on inferred types and safety, making it ideal for rapid development. `cmdctr` is
great for creating commands with specific options and actions, and executing those commands from the
command line.

`cmdctr` has zero external dependencies, making it lightweight and easy to include in any project.

#### What it isn't

You won't find some of the cool features that often come bundled with CLI builder libraries. There
are no color utilities, loading spinners, menus, events, or progress bars. Many established
libraries for those needs already exist. Instead, `cmdctr` is built to work seamlessly alongside
these specialized packages, allowing you to integrate only what you need.

## Installation

```bash
bun i cmdctr
# or
npm i cmdctr
```

Or clone the repository:

```bash
git clone https://github.com/trvswgnr/cmdctr.git
```

## Usage

Command Center provides three main functions: `CmdCtr`, `Data`, and `Command`.

### CmdCtr

`CmdCtr` creates a new command center. It takes a string argument which is the name of the base
command. This is the command that will be used to run commands.

```ts
import { CmdCtr } from "cmdctr";
const cmdCtr = CmdCtr("example");
```

### Data

`Data` creates a new command data object. This object defines the name, description, and options for
a command.

```ts
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
```

### Command

`Command` creates a new command. It takes a data object and an action function as arguments. The
action function is what will be executed when the command is run.

```ts
const command1 = Command(command1Data, (opts) => {
    const { input, output } = opts;
    console.log(`input: ${input}`);
    console.log(`output: ${output}`);
});
```

A nice feature here is the options passed to the action function (`opts` here) are validated from
the CLI and their types are known at compile-time. This means you get meaningfull type hints and
code completion in your editor and can be sure that the arguments are the types you're expecting.

### Registering and Running Commands

After creating commands, you can register them to the command center using the `register` method.
Then, you can run the commands using the `run` method.

```ts
cmdCtr.register(command1);
cmdCtr.register(command2);
cmdCtr.run();
```

### Setting the default command

You can set a default command to be run when no command is specified. This is done using the
`setDefault` method.

```ts
cmdCtr.setDefault(command1);
// or
cmdCtr.setDefault("command-1");
```

## Example

Here is a complete example of how to use Command Center:

```ts
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
cmdCtr.register(command2);
cmdCtr.setDefault(command2);
cmdCtr.run();
```

In this example, two commands are created: `command-1` and `command-2`. `command-1` takes an input
file and an output file as options, and `command-2` takes a message and a boolean flag as options.
The commands are then registered to the command center and run.

In this case, `command2` is registered AND set as the default command, so it will be run when no
command is specified but can also be run explicitly by specifying `command-2` as the command to run.
If it had not been registered, it would run when no command is specified but would not be able to be
run explicitly as a subcommand.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
