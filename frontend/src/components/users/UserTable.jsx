import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import UserAvatar from "./UserAvatar";
import { useTranslation } from "../../i18n/LanguageContext";

function displayValue(value) {
    return value === null || value === undefined || value === "" ? "—" : value;
}

function getRoleDisplay(role, t) {
    if (role === "admin") {
        return t("roles.admin");
    }

    if (role === "user") {
        return t("roles.user");
    }

    return displayValue(role);
}

function getAccessibleUserName(user, t) {
    return typeof user?.name === "string" && user.name.trim()
        ? user.name.trim()
        : t("common.user");
}

function UserTable({
    users,
    onViewProfile,
    onDelete,
    onChangeRole,
    actionsDisabled = false,
}) {
    const { t } = useTranslation();

    return (
        <TableContainer className="user-list-page__table-container">
            <Table className="user-list-page__table" aria-label={t("users.title")}>
                <TableHead>
                    <TableRow className="user-list-page__table-header">
                        <TableCell
                            className="user-list-page__photo-cell"
                            scope="col"
                        >
                            {t("users.photo")}
                        </TableCell>
                        <TableCell scope="col">{t("users.name")}</TableCell>
                        <TableCell scope="col">{t("users.email")}</TableCell>
                        <TableCell scope="col">{t("users.role")}</TableCell>
                        <TableCell scope="col">{t("users.address")}</TableCell>
                        <TableCell scope="col">{t("users.actions")}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="user-list-page__photo-cell">
                                <UserAvatar
                                    name={user.name}
                                    photo={user.photo}
                                />
                            </TableCell>
                            <TableCell className="user-list-page__name-cell">
                                {displayValue(user.name)}
                            </TableCell>
                            <TableCell className="user-list-page__email-cell">
                                {displayValue(user.email)}
                            </TableCell>
                            <TableCell className="user-list-page__role-cell">
                                {getRoleDisplay(user.role, t)}
                            </TableCell>
                            <TableCell className="user-list-page__address-cell">
                                {displayValue(user.address)}
                            </TableCell>
                            <TableCell className="user-list-page__actions-cell">
                                <Stack
                                    className="user-list-page__action-buttons"
                                    direction="row"
                                    spacing={0.75}
                                >
                                    <Tooltip title={t("users.viewProfile")} key="view-profile">
                                        <span>
                                            <IconButton
                                                className="user-list-page__action-button user-list-page__action-button--view"
                                                onClick={() => onViewProfile(user)}
                                                disabled={actionsDisabled}
                                                aria-label={t("users.viewProfileFor", {
                                                    name: getAccessibleUserName(user, t),
                                                })}
                                            >
                                                <VisibilityOutlinedIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={t("users.changeRole")} key="change-role">
                                        <span>
                                            <IconButton
                                                className="user-list-page__action-button user-list-page__action-button--role"
                                                onClick={() => onChangeRole(user)}
                                                disabled={actionsDisabled}
                                                aria-label={t("users.changeRoleFor", {
                                                    name: getAccessibleUserName(user, t),
                                                })}
                                            >
                                                <GroupOutlinedIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={t("users.delete")} key="delete">
                                        <span>
                                            <IconButton
                                                className="user-list-page__action-button user-list-page__action-button--delete"
                                                onClick={() => onDelete(user)}
                                                disabled={actionsDisabled}
                                                aria-label={t("users.deleteFor", {
                                                    name: getAccessibleUserName(user, t),
                                                })}
                                            >
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default UserTable;
