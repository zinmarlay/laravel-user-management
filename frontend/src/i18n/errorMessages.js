export function getLocalizedErrorMessage(
    error,
    t,
    fallbackKey = "errors.generic",
) {
    if (error?.code === "network") {
        return t("errors.network");
    }

    if (error?.code === "invalid-response") {
        return t("errors.invalidResponse");
    }

    if (error?.code === "unauthenticated") {
        return t("errors.unauthorized");
    }

    return t(fallbackKey);
}

export function getLocalizedValidationErrors(error, fieldMap = {}) {
    const errors = error?.payload?.errors;

    if (!errors || typeof errors !== "object") {
        return {};
    }

    return Object.fromEntries(
        Object.keys(errors)
            .filter((backendField) => fieldMap[backendField])
            .map((backendField) => [
                fieldMap[backendField],
                "validation.invalidField",
            ]),
    );
}
