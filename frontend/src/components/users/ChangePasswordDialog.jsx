import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { changePassword } from "../../services/authApi";
import { useTranslation } from "../../i18n/LanguageContext";
import { getLocalizedValidationErrors } from "../../i18n/errorMessages";

function validateDraft(draft) {
    const errors = {};

    if (!draft.currentPassword) {
        errors.currentPassword = "validation.currentPasswordRequired";
    }

    if (!draft.newPassword) {
        errors.newPassword = "validation.newPasswordRequired";
    } else if (draft.newPassword.length < 8) {
        errors.newPassword = "validation.newPasswordMin";
    }

    if (!draft.passwordConfirmation) {
        errors.passwordConfirmation = "validation.confirmNewPassword";
    } else if (draft.newPassword !== draft.passwordConfirmation) {
        errors.passwordConfirmation = "validation.passwordsMismatch";
    }

    return errors;
}

function getErrorKey(error) {
    if (error?.code === "network") {
        return "errors.network";
    }

    if (error?.code === "forbidden") {
        return "errors.changePasswordForbidden";
    }

    if (error?.code === "validation") {
        return "validation.invalidField";
    }

    if (error?.code === "request-failed" || error?.code === "invalid-response") {
        return "errors.changePassword";
    }

    return "errors.changePassword";
}

function ChangePasswordDialog({
    open,
    onClose,
    onChanged,
    onUnauthenticated,
}) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState({
        currentPassword: "",
        newPassword: "",
        passwordConfirmation: "",
    });
    const [visibleFields, setVisibleFields] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [actionError, setActionError] = useState(null);
    const [saving, setSaving] = useState(false);

    function clearDraft() {
        setDraft({
            currentPassword: "",
            newPassword: "",
            passwordConfirmation: "",
        });
        setVisibleFields({});
    }

    function handleClose() {
        if (saving) {
            return;
        }

        clearDraft();
        setFieldErrors({});
        setActionError(null);
        onClose();
    }

    function updateField(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        setActionError(null);
    }

    function toggleVisibility(field) {
        setVisibleFields((current) => ({
            ...current,
            [field]: !current[field],
        }));
    }

    function renderVisibilityControl(field) {
        const visible = Boolean(visibleFields[field]);

        return (
            <InputAdornment position="end">
                <IconButton
                    type="button"
                    edge="end"
                    onClick={() => toggleVisibility(field)}
                    aria-label={
                        visible ? t("auth.hidePassword") : t("auth.showPassword")
                    }
                    disabled={saving}
                    size="small"
                >
                    <span aria-hidden="true">
                        {visible ? t("auth.hidePassword") : t("auth.showPassword")}
                    </span>
                </IconButton>
            </InputAdornment>
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) {
            return;
        }

        const validationErrors = validateDraft(draft);
        setFieldErrors(validationErrors);
        setActionError(null);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setSaving(true);

        try {
            await changePassword(
                draft.currentPassword,
                draft.newPassword,
                draft.passwordConfirmation,
            );
            clearDraft();
            setFieldErrors({});
            setActionError(null);
            await onChanged();
        } catch (error) {
            clearDraft();

            if (error?.code === "unauthenticated") {
                onUnauthenticated();
                return;
            }

            setFieldErrors(
                error?.code === "validation"
                    ? getLocalizedValidationErrors(error, {
                          current_password: "currentPassword",
                          password: "newPassword",
                          password_confirmation: "passwordConfirmation",
                      })
                    : {},
            );
            setActionError({ key: getErrorKey(error) });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            disableEscapeKeyDown={saving}
            aria-labelledby="change-password-dialog-title"
        >
            <form onSubmit={handleSubmit} noValidate>
                <DialogTitle id="change-password-dialog-title">
                    {t("dialogs.changePasswordTitle")}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {actionError && (
                            <Alert severity="error" role="alert">
                                {t(actionError.key)}
                            </Alert>
                        )}

                        <TextField
                            autoFocus
                            fullWidth
                            required
                            type={
                                visibleFields.currentPassword
                                    ? "text"
                                    : "password"
                            }
                            label={t("dialogs.currentPassword")}
                            name="current_password"
                            autoComplete="current-password"
                            value={draft.currentPassword}
                            onChange={(event) =>
                                updateField("currentPassword", event.target.value)
                            }
                            error={Boolean(fieldErrors.currentPassword)}
                            helperText={
                                fieldErrors.currentPassword
                                    ? t(fieldErrors.currentPassword)
                                    : " "
                            }
                            disabled={saving}
                            slotProps={{
                                input: {
                                    endAdornment: renderVisibilityControl(
                                        "currentPassword",
                                    ),
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            required
                            type={visibleFields.newPassword ? "text" : "password"}
                            label={t("dialogs.newPassword")}
                            name="password"
                            autoComplete="new-password"
                            value={draft.newPassword}
                            onChange={(event) =>
                                updateField("newPassword", event.target.value)
                            }
                            error={Boolean(fieldErrors.newPassword)}
                            helperText={
                                fieldErrors.newPassword
                                    ? t(fieldErrors.newPassword)
                                    : " "
                            }
                            disabled={saving}
                            slotProps={{
                                input: {
                                    endAdornment: renderVisibilityControl(
                                        "newPassword",
                                    ),
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            required
                            type={
                                visibleFields.passwordConfirmation
                                    ? "text"
                                    : "password"
                            }
                            label={t("dialogs.confirmNewPassword")}
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={draft.passwordConfirmation}
                            onChange={(event) =>
                                updateField(
                                    "passwordConfirmation",
                                    event.target.value,
                                )
                            }
                            error={Boolean(fieldErrors.passwordConfirmation)}
                            helperText={
                                fieldErrors.passwordConfirmation
                                    ? t(fieldErrors.passwordConfirmation)
                                    : " "
                            }
                            disabled={saving}
                            slotProps={{
                                input: {
                                    endAdornment: renderVisibilityControl(
                                        "passwordConfirmation",
                                    ),
                                },
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button type="button" onClick={handleClose} disabled={saving}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={
                            saving ? <CircularProgress color="inherit" size={18} /> : null
                        }
                    >
                        {saving
                            ? t("dialogs.changingPassword")
                            : t("dialogs.changePassword")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default ChangePasswordDialog;
