import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { registerUser } from "../../services/authApi";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function getValidationErrors(error) {
    const errors = error?.payload?.errors;
    if (!errors || typeof errors !== "object") {
        return {};
    }

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field === "password_confirmation" ? "passwordConfirmation" : field,
            Array.isArray(messages) ? messages.join(" ") : String(messages),
        ]),
    );
}

function validatePhoto(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return "Choose a JPEG, PNG, or WebP image.";
    }

    if (file.size > MAX_PHOTO_SIZE) {
        return "Photo must be 2 MB or smaller.";
    }

    return "";
}

function validateDraft(draft, photoValidationError) {
    const errors = {};
    const name = draft.name.trim();
    const email = draft.email.trim();

    if (!name) {
        errors.name = "Name is required.";
    } else if (name.length > 255) {
        errors.name = "Name must be 255 characters or fewer.";
    }

    if (!email) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!draft.password) {
        errors.password = "Password is required.";
    } else if (draft.password.length < 8) {
        errors.password = "Password must be at least 8 characters.";
    }

    if (!draft.passwordConfirmation) {
        errors.passwordConfirmation = "Please confirm your password.";
    } else if (draft.password !== draft.passwordConfirmation) {
        errors.passwordConfirmation = "Passwords do not match.";
    }

    if (photoValidationError) {
        errors.photo = photoValidationError;
    }

    return errors;
}

function getRegisterErrorMessage(error) {
    if (error?.code === "network") {
        return "We could not connect to the server. Check your connection and try again.";
    }

    if (error?.code === "invalid-response") {
        return "Registration failed. Please try again.";
    }

    return error?.code === "validation"
        ? error.message
        : "Registration failed. Please try again.";
}

function RegisterForm({ onAuthenticated }) {
    const [draft, setDraft] = useState({
        name: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        address: "",
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
    const [photoValidationError, setPhotoValidationError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [registerError, setRegisterError] = useState(null);
    const [loading, setLoading] = useState(false);
    const previewUrlRef = useRef("");

    useEffect(
        () => () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        },
        [],
    );

    function releasePhotoPreview() {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = "";
        }

        setPhotoPreviewUrl("");
    }

    function updateField(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        setRegisterError(null);
    }

    function handlePhotoChange(event) {
        const file = event.target.files?.[0] || null;
        event.target.value = "";

        if (!file) {
            return;
        }

        const validationError = validatePhoto(file);
        releasePhotoPreview();
        setPhotoFile(null);
        setPhotoValidationError(validationError);
        setFieldErrors((current) => ({
            ...current,
            photo: validationError || undefined,
        }));
        setRegisterError(null);

        if (validationError) {
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        previewUrlRef.current = previewUrl;
        setPhotoFile(file);
        setPhotoPreviewUrl(previewUrl);
    }

    function removePhoto() {
        releasePhotoPreview();
        setPhotoFile(null);
        setPhotoValidationError("");
        setFieldErrors((current) => ({ ...current, photo: undefined }));
        setRegisterError(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (loading) {
            return;
        }

        const validationErrors = validateDraft(draft, photoValidationError);
        setFieldErrors(validationErrors);
        setRegisterError(null);

        if (Object.keys(validationErrors).length > 0) {
            setRegisterError({
                message: "Please correct the highlighted fields.",
            });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("name", draft.name.trim());
        formData.append("email", draft.email.trim());
        formData.append("password", draft.password);
        formData.append("password_confirmation", draft.passwordConfirmation);
        formData.append("address", draft.address.trim());

        if (photoFile) {
            formData.append("photo", photoFile, photoFile.name);
        }

        try {
            const response = await registerUser(formData);
            await onAuthenticated(response);
        } catch (error) {
            setDraft((current) => ({
                ...current,
                password: "",
                passwordConfirmation: "",
            }));
            setFieldErrors(
                error?.code === "validation" ? getValidationErrors(error) : {},
            );
            setRegisterError({
                message: getRegisterErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.25}>
                {registerError && (
                    <Alert severity="error" role="alert">
                        {registerError.message}
                    </Alert>
                )}

                <TextField
                    autoFocus
                    fullWidth
                    required
                    label="Name"
                    name="name"
                    autoComplete="name"
                    value={draft.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name || " "}
                    disabled={loading}
                />

                <Box className="register-form__photo">
                    <Typography component="p" variant="body2">
                        Photo (optional)
                    </Typography>
                    <Box className="register-form__photo-actions">
                        <Button
                            component="label"
                            variant="outlined"
                            disabled={loading}
                        >
                            {photoFile ? "Replace photo" : "Choose photo"}
                            <input
                                type="file"
                                hidden
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                aria-label="Choose profile photo"
                                onChange={handlePhotoChange}
                                disabled={loading}
                            />
                        </Button>
                        {photoFile && (
                            <Button
                                type="button"
                                variant="text"
                                onClick={removePhoto}
                                disabled={loading}
                            >
                                Remove photo
                            </Button>
                        )}
                        {photoFile && (
                            <Typography
                                className="register-form__photo-filename"
                                variant="body2"
                                title={photoFile.name}
                            >
                                {photoFile.name}
                            </Typography>
                        )}
                    </Box>
                    {photoPreviewUrl && (
                        <img
                            className="register-form__photo-preview"
                            src={photoPreviewUrl}
                            alt="Preview of selected profile photo"
                        />
                    )}
                    <Typography
                        className="register-form__photo-help"
                        variant="caption"
                    >
                        Choose a JPEG, PNG, or WebP image up to 2 MB.
                    </Typography>
                    {fieldErrors.photo && (
                        <Typography color="error" variant="caption">
                            {fieldErrors.photo}
                        </Typography>
                    )}
                </Box>

                <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email address"
                    name="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) => updateField("email", event.target.value)}
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
                    autoComplete="new-password"
                    value={draft.password}
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

                <TextField
                    fullWidth
                    required
                    type={showConfirmation ? "text" : "password"}
                    label="Confirm password"
                    name="password_confirmation"
                    autoComplete="new-password"
                    value={draft.passwordConfirmation}
                    onChange={(event) =>
                        updateField("passwordConfirmation", event.target.value)
                    }
                    error={Boolean(fieldErrors.passwordConfirmation)}
                    helperText={fieldErrors.passwordConfirmation || " "}
                    disabled={loading}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        type="button"
                                        edge="end"
                                        onClick={() =>
                                            setShowConfirmation((current) => !current)
                                        }
                                        aria-label={
                                            showConfirmation
                                                ? "Hide password confirmation"
                                                : "Show password confirmation"
                                        }
                                        disabled={loading}
                                        size="small"
                                    >
                                        <span aria-hidden="true">
                                            {showConfirmation ? "Hide" : "Show"}
                                        </span>
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Address"
                    name="address"
                    autoComplete="street-address"
                    value={draft.address}
                    onChange={(event) =>
                        updateField("address", event.target.value)
                    }
                    error={Boolean(fieldErrors.address)}
                    helperText={fieldErrors.address || "Optional"}
                    disabled={loading}
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
                    {loading ? "Creating account…" : "Create account"}
                </Button>
            </Stack>
        </form>
    );
}

export default RegisterForm;
