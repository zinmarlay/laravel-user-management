import { UsersApiError } from "./apiError";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/+$/,
    "",
);

export { UsersApiError };

function getUsersEndpoint() {
    return `${API_BASE_URL}/api/users`;
}

function getUserEndpoint(userId) {
    return `${API_BASE_URL}/api/users/${userId}`;
}

function getStoredToken() {
    try {
        return window.localStorage.getItem("token") || "";
    } catch {
        return "";
    }
}

function getErrorForStatus(status, payload) {
    if (status === 401) {
        return new UsersApiError(
            "Your session has expired. Please sign in again.",
            { status, code: "unauthenticated", payload },
        );
    }

    if (status === 403) {
        return new UsersApiError("You are not authorized to view users.", {
            status,
            code: "forbidden",
            payload,
        });
    }

    return new UsersApiError("We could not load users. Please try again.", {
        status,
        code: "request-failed",
        payload,
    });
}

function getMutationError(status, payload, operation) {
    const operationLabels = {
        edit: "save changes",
        delete: "delete this user",
        role: "change this user's role",
    };

    if (status === 401) {
        return new UsersApiError(
            "Your session has expired. Please sign in again.",
            { status, code: "unauthenticated", payload },
        );
    }

    if (status === 403) {
        return new UsersApiError(
            operation === "edit"
                ? "You are not authorized to edit this user."
                : operation === "delete"
                  ? "You are not authorized to delete this user."
                  : "You are not authorized to change this user's role.",
            { status, code: "forbidden", payload },
        );
    }

    if (status === 404) {
        return new UsersApiError(
            "The selected user could not be found.",
            { status, code: "not-found", payload },
        );
    }

    if (status === 422) {
        return new UsersApiError(
            `Please correct the fields and try to ${operationLabels[operation]}.`,
            { status, code: "validation", payload },
        );
    }

    return new UsersApiError(
        `We could not ${operationLabels[operation]}. Please try again.`,
        { status, code: "request-failed", payload },
    );
}

function getProfileError(status, payload) {
    if (status === 401) {
        return new UsersApiError(
            "Your session has expired. Please sign in again.",
            { status, code: "unauthenticated", payload },
        );
    }

    if (status === 403) {
        return new UsersApiError(
            "You are not authorized to view this user.",
            { status, code: "forbidden", payload },
        );
    }

    if (status === 404) {
        return new UsersApiError("The selected user could not be found.", {
            status,
            code: "not-found",
            payload,
        });
    }

    return new UsersApiError(
        "We could not load this user's profile. Please try again.",
        { status, code: "request-failed", payload },
    );
}

async function parseResponsePayload(response) {
    if (response.status === 204) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function sendMutation(url, options, operation) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (error) {
        if (error.name === "AbortError") {
            throw error;
        }

        throw new UsersApiError(
            "We could not connect to the server. Please try again.",
            { code: "network" },
        );
    }

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
        throw getMutationError(response.status, payload, operation);
    }

    if (operation !== "delete" && payload === null) {
        throw new UsersApiError(
            "The server returned an invalid response. Please try again.",
            { status: response.status, code: "invalid-response" },
        );
    }

    return payload;
}

function getMutationHeaders(token, contentType = false) {
    const headers = {
        Accept: "application/json",
    };
    const authToken = token ?? getStoredToken();

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    if (contentType) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function isFormDataPayload(data) {
    return typeof FormData !== "undefined" && data instanceof FormData;
}

function unwrapUserResource(payload) {
    if (
        payload &&
        typeof payload === "object" &&
        payload.data &&
        typeof payload.data === "object" &&
        !Array.isArray(payload.data)
    ) {
        return payload.data;
    }

    return payload;
}

function isListEmptyResponse(response, payload) {
    return (
        response.status === 404 &&
        payload &&
        payload.message === "User not found."
    );
}

function normalizePaginator(payload) {
    if (
        !payload ||
        !Array.isArray(payload.data) ||
        payload.data.some(
            (user) => !user || typeof user !== "object" || Array.isArray(user),
        ) ||
        !Number.isInteger(payload.current_page) ||
        !Number.isInteger(payload.last_page) ||
        payload.current_page < 1 ||
        payload.last_page < 1
    ) {
        throw new UsersApiError(
            "The users response was not in the expected format.",
            { code: "invalid-response", payload },
        );
    }

    return {
        rows: payload.data,
        currentPage: payload.current_page,
        lastPage: payload.last_page,
        total: Number.isInteger(payload.total)
            ? payload.total
            : payload.data.length,
        perPage: Number.isInteger(payload.per_page) ? payload.per_page : 5,
    };
}

export async function fetchUsers({
    search = "",
    page = 1,
    token,
    signal,
} = {}) {
    const params = new URLSearchParams({ page: String(page) });
    if (search) {
        params.set("search", search);
    }

    const headers = {
        Accept: "application/json",
    };
    const authToken = token ?? getStoredToken();
    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    let response;
    let payload;

    try {
        response = await fetch(`${getUsersEndpoint()}?${params.toString()}`, {
            headers,
            signal,
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw error;
        }

        throw new UsersApiError(
            "We could not connect to the server. Please try again.",
            { code: "network" },
        );
    }

    try {
        payload = await response.json();
    } catch {
        if (!response.ok) {
            throw getErrorForStatus(response.status, null);
        }

        throw new UsersApiError("The users response was not valid JSON.", {
            status: response.status,
            code: "invalid-response",
        });
    }

    if (isListEmptyResponse(response, payload)) {
        return {
            rows: [],
            currentPage: 1,
            lastPage: 1,
            total: 0,
            perPage: 5,
        };
    }

    if (!response.ok) {
        throw getErrorForStatus(response.status, payload);
    }

    return normalizePaginator(payload);
}

export async function fetchUser(userId, token, signal) {
    const headers = getMutationHeaders(token);
    let response;

    try {
        response = await fetch(getUserEndpoint(userId), {
            headers,
            signal,
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw error;
        }

        throw new UsersApiError(
            "We could not connect to the server. Please try again.",
            { code: "network" },
        );
    }

    const payload = await parseResponsePayload(response);

    if (!response.ok) {
        throw getProfileError(response.status, payload);
    }

    const profile = unwrapUserResource(payload);

    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
        throw new UsersApiError(
            "The profile response was not in the expected format.",
            { status: response.status, code: "invalid-response", payload },
        );
    }

    return profile;
}

export async function updateUser(userId, data, token, signal) {
    const formData = isFormDataPayload(data);

    return sendMutation(getUserEndpoint(userId), {
        method: formData ? "POST" : "PUT",
        body: formData ? data : JSON.stringify(data),
        headers: getMutationHeaders(token, !formData),
        signal,
    }, "edit").then(unwrapUserResource);
}

export async function deleteUser(userId, token, signal) {
    return sendMutation(getUserEndpoint(userId), {
        method: "DELETE",
        headers: getMutationHeaders(token),
        signal,
    }, "delete");
}

export async function updateUserRole(userId, role, token, signal) {
    if (role !== "user" && role !== "admin") {
        throw new UsersApiError("Please choose a valid user role.", {
            status: 422,
            code: "validation",
        });
    }

    return sendMutation(`${getUserEndpoint(userId)}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
        headers: getMutationHeaders(token, true),
        signal,
    }, "role");
}
