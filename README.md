# Command Center

Command Center (`cmdctr`) is a TypeScript project that provides a simple and flexible way to create
command line interfaces (CLI). It allows you to define tasks with specific options and actions, and
then run these tasks from the command line. Type safety is built in, so you can be sure that your
tasks are being run with the correct options.

> [!WARNING]
>
> This project is still in early development and is not ready for production use.

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
import { Task, Data, CmdCtr, withSpinner } from "cmdctr";

const cmdCtr = CmdCtr("example");

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
    const text = await withSpinner("thinking...", () => {
        return new Promise<string>((resolve) => {
            setTimeout(() => {
                resolve(`oh yeah, ${message}`);
            }, 2000);
        });
    });
    console.log(loud ? text.toUpperCase() : text);
});

cmdCtr.register(task1);
cmdCtr.register(task2);
cmdCtr.run();
```

In this example, two tasks are created: `task-1` and `task-2`. `task-1` takes an input file and an
output file as options, and `task-2` takes a message and a boolean flag as options. The tasks are
then registered to the command center and run.

Command Center also provides a utility function `withSpinner` that can be used to display a spinner
in the console while a task is running. This is useful for tasks that may take some time to
complete.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
