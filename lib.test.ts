import { getCliArgs } from "./lib";
import { DEFAULT_COMMAND_NAME, COMMAND_NAME } from "./constants";
import type { RegisteredCommands, CommandOption, CommandOptions } from "./types";
import { describe, expect, it, mock } from "bun:test";
console.log = mock((...args: any[]) => {});
process.exit = mock((exitCode: number) => {}) as any;

describe("getCliArgs", () => {
    const commandOptions: CommandOptions = {
        option1: {
            description: "Option 1",
            type: "string",
            required: true,
        },
        option2: {
            description: "Option 2",
            type: "boolean",
            default: true,
        },
    };

    const registeredCommands: RegisteredCommands = new Map();
    registeredCommands.set("cmd1", {
        name: "cmd1",
        description: "Command 1",
        options: commandOptions,
        action: () => {},
        registeredCommands: new Map(),
        register: () => registeredCommands,
    });
    registeredCommands.set("cmd2", {
        name: "cmd2",
        description: "Command 2",
        options: commandOptions,
        action: () => {},
        registeredCommands: new Map(),
        register: () => registeredCommands,
    });

    it("should return an error when command is missing", () => {
        expect(() => getCliArgs(registeredCommands, "test", ["cmd3"])).toThrow(/missing command/);
    });

    it("should return an error when required option is missing", () => {
        expect(() => getCliArgs(registeredCommands, "test", ["cmd1"])).toThrow(/missing required/);
    });

    it("should return parsed args when all required options are provided", () => {
        // same as `test command1 --option1 op`
        const args = getCliArgs(registeredCommands, "test", ["cmd1", "--option1", "op"]);
        expect(args).toEqual({
            option1: "op",
            option2: true,
            [COMMAND_NAME]: "cmd1",
            usingDefaultCommand: false,
        });
    });

    it("should return parsed args for default command when no command is specified", () => {
        registeredCommands.set(DEFAULT_COMMAND_NAME, {
            name: "def",
            description: "Default command",
            options: commandOptions,
            action: () => {},
            registeredCommands: new Map(),
            register: () => registeredCommands,
        });
        // same as `test --option1 op`
        const args = getCliArgs(registeredCommands, "test", ["--option1", "op"]);
        expect(args).toEqual({
            option1: "op",
            option2: true,
            [COMMAND_NAME]: "def",
            usingDefaultCommand: true,
        });
    });
});
