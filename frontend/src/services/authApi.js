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

function getChangePasswordEndpoint() {
    return `${API_BASE_URL}/api/change-password`;
}

function getStoredToken() {
    try {
        return window.localStorage.getItem("token") || "";
    } catch {
        return "";
    }
}

function getRegisterEndpoint() {
    return API_BASE_URL + "/api/register";
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

function getRegisterError(status, payload) {
    if (status === 422) {
        return new UsersApiError(
            "Please correct the highlighted fields and try again.",
            { status, code: "validation", payload },
        );
    }

    if (status === 401 || status === 403) {
        return new UsersApiError(
            "Registration could not be completed. Please try again.",
            { status, code: "request-failed", payload },
        );
    }

    if (status === 404) {
        return new UsersApiError(
            "Registration is currently unavailable. Please try again later.",
            { status, code: "request-failed", payload },
        );
    }

    return new UsersApiError("Registration failed. Please try again.", {
        status,
        code: "request-failed",
        payload,
    });
}

function getChangePasswordError(status, payload) {
    if (status === 401) {
        return new UsersApiError(
            "Your session has expired. Please sign in again.",
            { status, code: "unauthenticated", payload },
        );
    }

    if (status === 403) {
        return new UsersApiError(
            "You are not authorized to change your password.",
            { status, code: "forbidden", payload },
        );
    }

    if (status === 422) {
        return new UsersApiError(
            "Please correct the highlighted fields and try again.",
            { status, code: "validation", payload },
        );
    }

    if (status === 404) {
        return new UsersApiError(
            "Password change is currently unavailable. Please try again later.",
            { status, code: "request-failed", payload },
        );
    }

    return new UsersApiError("Password change failed. Please try again.", {
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

async function parseRegisterPayload(response) {
    if (response.status === 204) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function parseChangePasswordPayload(response) {
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

export async function changePassword(
    currentPassword,
    newPassword,
    passwordConfirmation,
    signal,
) {
    const token = getStoredToken();
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };

    if (token.trim()) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(getChangePasswordEndpoint(), {
            method: "POST",
            headers,
            body: JSON.stringify({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: passwordConfirmation,
            }),
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

    const payload = await parseChangePasswordPayload(response);

    if (!response.ok) {
        throw getChangePasswordError(response.status, payload);
    }

    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload) ||
        typeof payload.message !== "string" ||
        !payload.message.trim()
    ) {
        throw new UsersApiError(
            "The server returned an invalid password-change response. Please try again.",
            { status: response.status, code: "invalid-response", payload },
        );
    }

    return { message: payload.message };
}

export async function registerUser(formData, signal) {
    let response;

    try {
        response = await fetch(getRegisterEndpoint(), {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: formData,
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

    const payload = await parseRegisterPayload(response);

    if (!response.ok) {
        throw getRegisterError(response.status, payload);
    }

    if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload) ||
        typeof payload.token !== "string" ||
        !payload.token.trim() ||
        !payload.user ||
        typeof payload.user !== "object" ||
        Array.isArray(payload.user)
    ) {
        throw new UsersApiError(
            "The server returned an invalid registration response. Please try again.",
            { status: response.status, code: "invalid-response", payload },
        );
    }

    return payload;
}
