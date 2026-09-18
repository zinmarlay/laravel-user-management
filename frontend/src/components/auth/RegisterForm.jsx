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
import { useTranslation } from "../../i18n/LanguageContext";
import { getLocalizedValidationErrors } from "../../i18n/errorMessages";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function validatePhoto(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return "validation.photoType";
    }

    if (file.size > MAX_PHOTO_SIZE) {
        return "validation.photoSize";
    }

    return "";
}

function validateDraft(draft, photoValidationError) {
    const errors = {};
    const name = draft.name.trim();
    const email = draft.email.trim();

    if (!name) {
        errors.name = "validation.nameRequired";
    } else if (name.length > 255) {
        errors.name = "validation.nameMax";
    }

    if (!email) {
        errors.email = "validation.emailRequired";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "validation.validEmail";
    }

    if (!draft.password) {
        errors.password = "validation.passwordRequired";
    } else if (draft.password.length < 8) {
        errors.password = "validation.passwordMin";
    }

    if (!draft.passwordConfirmation) {
        errors.passwordConfirmation = "validation.confirmPassword";
    } else if (draft.password !== draft.passwordConfirmation) {
        errors.passwordConfirmation = "validation.passwordsMismatch";
    }

    if (photoValidationError) {
        errors.photo = photoValidationError;
    }

    return errors;
}

function getRegisterErrorKey(error) {
    if (error?.code === "network") {
        return "errors.network";
    }

    if (error?.code === "invalid-response") {
        return "errors.registration";
    }

    return error?.code === "validation"
        ? "validation.invalidField"
        : "errors.registration";
}

function RegisterForm({ onAuthenticated }) {
    const { t } = useTranslation();
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
                key: "validation.form",
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
                error?.code === "validation"
                    ? getLocalizedValidationErrors(error, {
                          name: "name",
                          email: "email",
                          password: "password",
                          password_confirmation: "passwordConfirmation",
                          address: "address",
                          photo: "photo",
                      })
                    : {},
            );
            setRegisterError({
                key: getRegisterErrorKey(error),
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
                        {t(registerError.key)}
                    </Alert>
                )}

                <TextField
                    autoFocus
                    fullWidth
                    required
                    label={t("auth.name")}
                    name="name"
                    autoComplete="name"
                    value={draft.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name ? t(fieldErrors.name) : " "}
                    disabled={loading}
                />

                <Box className="register-form__photo">
                    <Typography component="p" variant="body2">
                        {t("auth.photoOptional")}
                    </Typography>
                    <Box className="register-form__photo-actions">
                        <Button
                            component="label"
                            variant="outlined"
                            disabled={loading}
                        >
                            {photoFile ? t("auth.replacePhoto") : t("auth.choosePhoto")}
                            <input
                                type="file"
                                hidden
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                aria-label={t("auth.choosePhotoLabel")}
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
                                {t("auth.removePhoto")}
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
                            alt={t("auth.photoPreview")}
                        />
                    )}
                    <Typography
                        className="register-form__photo-help"
                        variant="caption"
                    >
                        {t("auth.photoHelp")}
                    </Typography>
                    {fieldErrors.photo && (
                        <Typography color="error" variant="caption">
                            {t(fieldErrors.photo)}
                        </Typography>
                    )}
                </Box>

                <TextField
                    fullWidth
                    required
                    type="email"
                    label={t("auth.emailAddress")}
                    name="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) => updateField("email", event.target.value)}
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
                    autoComplete="new-password"
                    value={draft.password}
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

                <TextField
                    fullWidth
                    required
                    type={showConfirmation ? "text" : "password"}
                    label={t("auth.confirmPassword")}
                    name="password_confirmation"
                    autoComplete="new-password"
                    value={draft.passwordConfirmation}
                    onChange={(event) =>
                        updateField("passwordConfirmation", event.target.value)
                    }
                    error={Boolean(fieldErrors.passwordConfirmation)}
                    helperText={
                        fieldErrors.passwordConfirmation
                            ? t(fieldErrors.passwordConfirmation)
                            : " "
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
                                            setShowConfirmation((current) => !current)
                                        }
                                        aria-label={
                                            showConfirmation
                                                ? t("auth.hidePasswordConfirmation")
                                                : t("auth.showPasswordConfirmation")
                                        }
                                        disabled={loading}
                                        size="small"
                                    >
                                        <span aria-hidden="true">
                                            {showConfirmation
                                                ? t("auth.hidePasswordConfirmation")
                                                : t("auth.showPasswordConfirmation")}
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
                    label={t("auth.address")}
                    name="address"
                    autoComplete="street-address"
                    value={draft.address}
                    onChange={(event) =>
                        updateField("address", event.target.value)
                    }
                    error={Boolean(fieldErrors.address)}
                    helperText={
                        fieldErrors.address
                            ? t(fieldErrors.address)
                            : t("common.optional")
                    }
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
                    {loading
                        ? t("auth.creatingAccount")
                        : t("auth.createAccount")}
                </Button>
            </Stack>
        </form>
    );
}

export default RegisterForm;
