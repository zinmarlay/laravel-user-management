import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import UserAvatar from "./UserAvatar";
import { updateUser } from "../../services/usersApi";
import { useTranslation } from "../../i18n/LanguageContext";
import { getLocalizedValidationErrors } from "../../i18n/errorMessages";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function getInitialDraft(user) {
    return {
        name: user?.name || "",
        email: user?.email || "",
        address: user?.address || "",
    };
}

function validateDraft(draft, photoError) {
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

    if (photoError) {
        errors.photo = photoError;
    }

    return errors;
}

function validatePhoto(file) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return "validation.photoType";
    }

    if (file.size > MAX_PHOTO_SIZE) {
        return "validation.photoSize";
    }

    return "";
}

function UserEditDialog({
    open,
    user,
    onClose,
    onSaved,
    onUnauthenticated,
}) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(() => getInitialDraft(user));
    const [fieldErrors, setFieldErrors] = useState({});
    const [actionError, setActionError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
    const [photoError, setPhotoError] = useState("");
    const [photoRemoved, setPhotoRemoved] = useState(false);
    const previewUrlRef = useRef("");

    function revokePhotoPreview() {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = "";
        }

        setPhotoPreviewUrl("");
    }

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!user || !open) {
            return;
        }

        // Intentional synchronization when the selected profile opens or changes.
        // oxlint-disable-next-line react/set-state-in-effect
        setDraft(getInitialDraft(user));
        setFieldErrors({});
        setActionError(null);
        setSaving(false);
        setPhotoFile(null);
        setPhotoError("");
        setPhotoRemoved(false);
        revokePhotoPreview();
    }, [user, open]);

    if (!user) {
        return null;
    }

    function updateField(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        setActionError(null);
    }

    function handlePhotoChange(event) {
        const file = event.target.files?.[0] || null;
        event.target.value = "";

        if (!file) {
            return;
        }

        const nextPhotoError = validatePhoto(file);
        revokePhotoPreview();
        setPhotoFile(null);
        setPhotoRemoved(false);
        setPhotoError(nextPhotoError);
        setFieldErrors((current) => ({
            ...current,
            photo: nextPhotoError || undefined,
        }));
        setActionError(null);

        if (nextPhotoError) {
            return;
        }

        const nextPreviewUrl = URL.createObjectURL(file);
        previewUrlRef.current = nextPreviewUrl;
        setPhotoFile(file);
        setPhotoPreviewUrl(nextPreviewUrl);
    }

    function handleRemovePhoto() {
        revokePhotoPreview();
        setPhotoFile(null);
        setPhotoError("");
        setPhotoRemoved(Boolean(user.photo));
        setFieldErrors((current) => ({ ...current, photo: undefined }));
        setActionError(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) {
            return;
        }

        const validationErrors = validateDraft(draft, photoError);
        setFieldErrors(validationErrors);
        setActionError(null);

        if (Object.keys(validationErrors).length > 0) {
            setActionError({
                key: "validation.form",
            });
            return;
        }

        setSaving(true);
        setFieldErrors({});

        const profileFields = {
            name: draft.name.trim(),
            email: draft.email.trim(),
            address: draft.address.trim() || null,
        };
        let payload = profileFields;

        if (photoFile || photoRemoved) {
            payload = new FormData();
            payload.append("_method", "PUT");
            payload.append("name", profileFields.name);
            payload.append("email", profileFields.email);
            payload.append("address", profileFields.address || "");

            if (photoFile) {
                payload.append("photo", photoFile, photoFile.name);
            } else {
                payload.append("remove_photo", "1");
            }
        }

        try {
            const updatedUser = await updateUser(user.id, payload);
            await onSaved(updatedUser);
        } catch (error) {
            if (error.code === "unauthenticated") {
                onUnauthenticated();
                return;
            }

            setFieldErrors(
                error?.code === "validation"
                    ? getLocalizedValidationErrors(error, {
                          name: "name",
                          email: "email",
                          address: "address",
                          photo: "photo",
                      })
                    : {},
            );
            setActionError({
                code: error?.code,
                key:
                    error?.code === "validation"
                        ? "validation.invalidField"
                        : "errors.edit",
            });
        } finally {
            setSaving(false);
        }
    }

    function handleClose() {
        if (!saving) {
            revokePhotoPreview();
            onClose();
        }
    }

    const errorMessage = actionError?.key ? t(actionError.key) : "";
    const photoSource = photoPreviewUrl || (!photoRemoved ? user.photo : "");
    const hasPhoto = Boolean(photoSource);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            disableEscapeKeyDown={saving}
            aria-labelledby="edit-user-dialog-title"
        >
            <form onSubmit={handleSubmit} noValidate>
                <DialogTitle id="edit-user-dialog-title">
                    {t("dialogs.editTitle")}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {errorMessage && (
                            <Alert
                                severity={
                                    actionError?.code === "unauthenticated"
                                        ? "warning"
                                        : "error"
                                }
                            >
                                {errorMessage}
                            </Alert>
                        )}
                        <Box className="user-profile-page__edit-photo">
                            <UserAvatar
                                name={user.name}
                                photo={photoSource}
                                className="user-profile-page__edit-avatar"
                            />
                            <Box className="user-profile-page__photo-actions">
                                <Button
                                    component="label"
                                    variant="outlined"
                                    disabled={saving}
                                >
                                    {hasPhoto
                                        ? t("auth.replacePhoto")
                                        : t("auth.choosePhoto")}
                                    <input
                                        type="file"
                                        hidden
                                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                        aria-label={t("auth.choosePhotoLabel")}
                                        onChange={handlePhotoChange}
                                        disabled={saving}
                                    />
                                </Button>
                                {hasPhoto && (
                                    <Button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        disabled={saving}
                                    >
                                        {t("auth.removePhoto")}
                                    </Button>
                                )}
                            </Box>
                            <Typography variant="caption">
                                {t("auth.photoHelp")}
                            </Typography>
                            {(fieldErrors.photo || photoError) && (
                                <Typography color="error" variant="caption">
                                    {t(fieldErrors.photo || photoError)}
                                </Typography>
                            )}
                        </Box>
                        <TextField
                            autoFocus
                            fullWidth
                            required
                            label={t("profile.name")}
                            value={draft.name}
                            onChange={(event) =>
                                updateField("name", event.target.value)
                            }
                            error={Boolean(fieldErrors.name)}
                            helperText={fieldErrors.name ? t(fieldErrors.name) : " "}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            required
                            type="email"
                            label={t("profile.email")}
                            value={draft.email}
                            onChange={(event) =>
                                updateField("email", event.target.value)
                            }
                            error={Boolean(fieldErrors.email)}
                            helperText={fieldErrors.email ? t(fieldErrors.email) : " "}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label={t("profile.address")}
                            value={draft.address}
                            onChange={(event) =>
                                updateField("address", event.target.value)
                            }
                            error={Boolean(fieldErrors.address)}
                            helperText={fieldErrors.address ? t(fieldErrors.address) : " "}
                            disabled={saving}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={
                            saving ? <CircularProgress size={16} /> : undefined
                        }
                    >
                        {saving ? t("dialogs.saving") : t("dialogs.saveChanges")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default UserEditDialog;
