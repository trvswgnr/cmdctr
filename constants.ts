import type { NoFns } from "./types";

/** the key of the default command that is run when no command name is specified */
export const DEFAULT_COMMAND_NAME = Symbol.for("cmdctr.default_command_name");
export type DEFAULT_COMMAND_NAME = typeof DEFAULT_COMMAND_NAME;

/** the property holding the name of the command inthe `CliArgs` type */
export const COMMAND_NAME = Symbol.for("cmdctr.command_name_key");
export type COMMAND_NAME = typeof COMMAND_NAME;

const ParseErrorEnum = {
    /**
     * thrown when a `boolean` value is provided for an option of type "string", or if a `string`
     * value is provided for an option of type "boolean" (and `strict` is set to `true`)
     */
    INVALID_OPTION_VALUE: "ERR_PARSE_ARGS_INVALID_OPTION_VALUE",
    /** thrown when a positional argument is provided (and `allowPositionals` is set to `false`) */
    UNEXPECTED_POSITIONAL: "ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL",
    /** thrown if an argument is not configured in `options` (and `strict` is set to `true`) */
    UNKNOWN_OPTION: "ERR_PARSE_ARGS_UNKNOWN_OPTION",
    /** thrown if some other error occurs while parsing arguments */
    CMDCTR_PARSE_ERROR: "ERR_CMDCTR_PARSE_ERROR",
} as const;

export type ParseErrorType = (typeof ParseErrorEnum)[keyof typeof ParseErrorEnum];
class ParseErrorClass extends Error {
    public code: ParseErrorType;
    constructor(message: string, code: string) {
        super(message);
        this.code = Object.values(ParseErrorEnum).includes(code as ParseErrorType)
            ? (code as ParseErrorType)
            : ParseErrorEnum.CMDCTR_PARSE_ERROR;
    }

    /** creates a `ParseError` from an unknown value that may or may not be a `ParseError` */
    static from(e: unknown, name?: string): ParseError {
        if (typeof e === "object" && e !== null && "code" in e && typeof e.code === "string") {
            let message = "message" in e ? String(e.message) : "unknown error";
            message = name ? message.replace("This command", `Command "${name}"`) : message;
            return new ParseError(message, e.code);
        }
        return new ParseError("unknown error", ParseError.CMDCTR_PARSE_ERROR);
    }
}

export const ParseError = Object.assign(ParseErrorClass, ParseErrorEnum);
export type ParseError = ParseErrorClass;
