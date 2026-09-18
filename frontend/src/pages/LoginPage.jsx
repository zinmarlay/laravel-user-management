import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LoginForm from "../components/auth/LoginForm";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { useTranslation } from "../i18n/LanguageContext";
import "../App.css";

function LoginPage({ onAuthenticated, onRegister, notice = "" }) {
    const { t } = useTranslation();

    return (
        <main className="login-page">
            <Box className="login-page__language">
                <LanguageSwitcher />
            </Box>
            <Box className="login-page__content">
                <Paper className="login-page__card" elevation={0}>
                    <Box className="login-page__brand-mark" aria-hidden="true">
                        UM
                    </Box>
                    <Typography className="login-page__brand" component="p">
                        {t("auth.brand")}
                    </Typography>
                    <Typography
                        className="login-page__title"
                        component="h1"
                        variant="h3"
                    >
                        {t("auth.signInTitle")}
                    </Typography>
                    <Typography className="login-page__description">
                        {t("auth.signInDescription")}
                    </Typography>
                    {notice && (
                        <Alert severity="success" role="status">
                            {t(notice)}
                        </Alert>
                    )}
                    <LoginForm onAuthenticated={onAuthenticated} />
                    <Typography className="login-page__switch" component="p">
                        {t("auth.registerPrompt")}{" "}
                        <Button
                            type="button"
                            className="login-page__switch-button"
                            onClick={onRegister}
                        >
                            {t("auth.register")}
                        </Button>
                    </Typography>
                </Paper>
                <Typography className="login-page__footer" component="p">
                    {t("auth.footer")}
                </Typography>
            </Box>
        </main>
    );
}

export default LoginPage;
