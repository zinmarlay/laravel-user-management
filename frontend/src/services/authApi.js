import { UsersApiError } from "./apiError";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/+$/,
    "",
);

function getLoginEndpoint() {
    return `${API_BASE_URL}/api/login`;
}

function getLogoutEndpoint() {
    return `${API_BASE_URL}/api/logout`;
}

function getStoredToken() {
    try {
        return window.localStorage.getItem("token") || "";
    } catch {
        return "";
    }
}

function getLoginError(status, payload) {
    if (status === 401) {
        return new UsersApiError("Invalid email or password.", {
            status,
            code: "invalid-credentials",
            payload,
        });
    }

    if (status === 422) {
        return new UsersApiError(
            "Please correct the highlighted fields and try again.",
            { status, code: "validation", payload },
        );
    }

    return new UsersApiError("Sign-in failed. Please try again.", {
        status,
        code: "request-failed",
        payload,
    });
}

function getLogoutError(status, payload) {
    if (status === 401) {
        return new UsersApiError(
            "Your session has expired. Please sign in again.",
            { status, code: "unauthenticated", payload },
        );
    }

    return new UsersApiError("We could not sign you out. Please try again.", {
        status,
        code: "request-failed",
        payload,
    });
}

async function parseLoginPayload(response) {
    if (response.status === 204) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function parseLogoutPayload(response) {
    if (response.status === 204) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}

export async function loginUser(email, password, signal) {
    let response;

    try {
        response = await fetch(getLoginEndpoint(), {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
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

    const payload = await parseLoginPayload(response);

    if (!response.ok) {
        throw getLoginError(response.status, payload);
    }

    if (
        !payload ||
        typeof payload !== "object" ||
        typeof payload.token !== "string" ||
        !payload.token.trim()
    ) {
        throw new UsersApiError(
            "The server returned an invalid sign-in response. Please try again.",
            { status: response.status, code: "invalid-response", payload },
        );
    }

    return payload;
}

export async function logoutUser(signal) {
    const token = getStoredToken();

    if (!token.trim()) {
        return { skipped: true };
    }

    let response;

    try {
        response = await fetch(getLogoutEndpoint(), {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
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

    const payload = await parseLogoutPayload(response);

    if (!response.ok) {
        throw getLogoutError(response.status, payload);
    }

    if (payload !== null && (typeof payload !== "object" || Array.isArray(payload))) {
        throw new UsersApiError(
            "The server returned an invalid sign-out response. Please try again.",
            { status: response.status, code: "invalid-response", payload },
        );
    }

    return payload;
}
