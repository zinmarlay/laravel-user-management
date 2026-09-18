import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { loginUser } from "../../services/authApi";
import { useTranslation } from "../../i18n/LanguageContext";
import { getLocalizedValidationErrors } from "../../i18n/errorMessages";

function validateForm(email, password) {
    const errors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
        errors.email = "validation.emailRequired";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        errors.email = "validation.validEmail";
    }

    if (!password) {
        errors.password = "validation.passwordRequired";
    }

    return errors;
}

function getLoginErrorKey(error) {
    if (error?.code === "invalid-credentials") {
        return "errors.invalidCredentials";
    }

    if (error?.code === "network") {
        return "errors.network";
    }

    if (error?.code === "invalid-response") {
        return "errors.signIn";
    }

    return "errors.signIn";
}

function LoginForm({ onAuthenticated }) {
    const { t } = useTranslation();
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
                error?.code === "validation"
                    ? getLocalizedValidationErrors(error, {
                          email: "email",
                          password: "password",
                      })
                    : {},
            );
            setLoginError({
                key:
                    error?.code === "validation"
                        ? "validation.invalidField"
                        : getLoginErrorKey(error),
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
                        {t(loginError.key)}
                    </Alert>
                )}

                <TextField
                    autoFocus
                    fullWidth
                    required
                    type="email"
                    label={t("auth.emailAddress")}
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                        updateField("email", event.target.value)
                    }
                    error={Boolean(fieldErrors.email)}
                    helperText={fieldErrors.email ? t(fieldErrors.email) : " "}
                    disabled={loading}
                />

                <TextField
                    fullWidth
                    required
                    type={showPassword ? "text" : "password"}
                    label={t("auth.password")}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                        updateField("password", event.target.value)
                    }
                    error={Boolean(fieldErrors.password)}
                    helperText={
                        fieldErrors.password ? t(fieldErrors.password) : " "
                    }
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
                                                ? t("auth.hidePassword")
                                                : t("auth.showPassword")
                                        }
                                        disabled={loading}
                                        size="small"
                                    >
                                        <span aria-hidden="true">
                                            {showPassword
                                                ? t("auth.hidePassword")
                                                : t("auth.showPassword")}
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
                    {loading ? t("auth.signingIn") : t("auth.signInTitle")}
                </Button>
            </Stack>
        </form>
    );
}

export default LoginForm;
