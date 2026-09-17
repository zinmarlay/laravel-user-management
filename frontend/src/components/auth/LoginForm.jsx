import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { loginUser } from "../../services/authApi";

function getValidationErrors(error) {
    const errors = error?.payload?.errors;
    if (!errors || typeof errors !== "object") {
        return {};
    }

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages.join(" ") : String(messages),
        ]),
    );
}

function validateForm(email, password) {
    const errors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        errors.email = "Enter a valid email address.";
    }

    if (!password) {
        errors.password = "Password is required.";
    }

    return errors;
}

function getLoginErrorMessage(error) {
    if (error?.code === "invalid-credentials") {
        return "Invalid email or password.";
    }

    if (error?.code === "network") {
        return "We could not connect to the server. Check your connection and try again.";
    }

    if (error?.code === "invalid-response") {
        return "Sign-in failed. Please try again.";
    }

    return "Sign-in failed. Please try again.";
}

function LoginForm({ onAuthenticated }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [loginError, setLoginError] = useState(null);
    const [loading, setLoading] = useState(false);

    function updateField(field, value) {
        if (field === "email") {
            setEmail(value);
        } else {
            setPassword(value);
        }

        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        setLoginError(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (loading) {
            return;
        }

        const validationErrors = validateForm(email, password);
        setFieldErrors(validationErrors);
        setLoginError(null);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setLoading(true);

        try {
            const response = await loginUser(email.trim(), password);
            await onAuthenticated(response);
        } catch (error) {
            setPassword("");
            setFieldErrors(
                error?.code === "validation" ? getValidationErrors(error) : {},
            );
            setLoginError({
                message:
                    error?.code === "validation"
                        ? error.message
                        : getLoginErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.25}>
                {loginError && (
                    <Alert severity="error" role="alert">
                        {loginError.message}
                    </Alert>
                )}

                <TextField
                    autoFocus
                    fullWidth
                    required
                    type="email"
                    label="Email address"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                        updateField("email", event.target.value)
                    }
                    error={Boolean(fieldErrors.email)}
                    helperText={fieldErrors.email || " "}
                    disabled={loading}
                />

                <TextField
                    fullWidth
                    required
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                        updateField("password", event.target.value)
                    }
                    error={Boolean(fieldErrors.password)}
                    helperText={fieldErrors.password || " "}
                    disabled={loading}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        type="button"
                                        edge="end"
                                        onClick={() =>
                                            setShowPassword((current) => !current)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        disabled={loading}
                                        size="small"
                                    >
                                        <span aria-hidden="true">
                                            {showPassword ? "Hide" : "Show"}
                                        </span>
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    className="login-page__submit"
                    startIcon={
                        loading ? <CircularProgress color="inherit" size={18} /> : null
                    }
                >
                    {loading ? "Signing in…" : "Sign in"}
                </Button>
            </Stack>
        </form>
    );
}

export default LoginForm;
