export class UsersApiError extends Error {
    constructor(
        message,
        { status = 0, code = "unknown", payload = null } = {},
    ) {
        super(message);
        this.name = "UsersApiError";
        this.status = status;
        this.code = code;
        this.payload = payload;
    }
}
