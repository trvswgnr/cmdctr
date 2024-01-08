# Command Center

Command Center (`cmdctr`) is a no-frills library for TypeScript and JavaScript that provides a simple, yet flexible way to create
command line interfaces (CLI). It allows you to define tasks with specific options and actions, and
then run these tasks from the command line. Type safety is built in, so you can be sure that your
tasks are being run with the correct options.

> [!WARNING]
>
> This project is still in early development and is not ready for production use.

#### What it is

`cmdctr` is a focused, streamlined tool for creating CLI apps without unnecessary complexity. It's heavily focused on inferred types and safety, making it ideal for rapid development. `cmdctr` is great for creating tasks with specific options and actions, and executing those tasks from the command line.

`cmdctr` has zero external dependencies, making it lightweight and easy to include in any project.

#### What it isn't

You won't find some of the cool features that often come bundled with CLI builder libraries. There are no color utilities, loading spinners, menus, events, or progress bars. Many established libraries for those needs already exist. Instead, `cmdctr` is built to work seamlessly alongside these specialized packages, allowing you to integrate only what you need.

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

Command Center provides three main functions: `CmdCtr`, `Data`, and `Task`.

### CmdCtr

`CmdCtr` creates a new command center. It takes a string argument which is the name of the base
command. This is the command that will be used to run tasks.

```ts
import { CmdCtr } from "cmdctr";
const cmdCtr = CmdCtr("example");
```

### Data

`Data` creates a new task data object. This object defines the name, description, and options for a
task.

```ts
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
```

### Task

`Task` creates a new task. It takes a data object and an action function as arguments. The action
function is what will be executed when the task is run.

```ts
const task1 = Task(task1Data, (opts) => {
    const { input, output } = opts;
    console.log(`input: ${input}`);
    console.log(`output: ${output}`);
});
```

A nice feature here is the options passed to the action function (`opts` here) are validated from the CLI and their types are known at compile-time. This means you get meaningfull type hints and code completion in your editor and can be sure that the arguments are the types you're expecting.

### Registering and Running Tasks

After creating tasks, you can register them to the command center using the `register` method. Then,
you can run the tasks using the `run` method.

```ts
cmdCtr.register(task1);
cmdCtr.register(task2);
cmdCtr.run();
```

### Setting the default task

You can set a default task to be run when no task is specified. This is done using the `setDefault`
method.

```ts
cmdCtr.setDefault(task1);
// or
cmdCtr.setDefault("task-1");
```

## Example

Here is a complete example of how to use Command Center:

```ts
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
cmdCtr.setDefault(task2);
cmdCtr.run();
```

In this example, two tasks are created: `task-1` and `task-2`. `task-1` takes an input file and an
output file as options, and `task-2` takes a message and a boolean flag as options. The tasks are
then registered to the command center and run.

In this case, `task2` is registered AND set as the default task, so it will be run when no task is
specified but can also be run explicitly by specifying `task-2` as the task to run. If it had not
been registered, it would run when no task is specified but would not be able to be run explicitly
as a subcommand.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
