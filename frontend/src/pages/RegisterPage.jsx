import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import RegisterForm from "../components/auth/RegisterForm";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { useTranslation } from "../i18n/LanguageContext";
import "../App.css";

function RegisterPage({ onAuthenticated, onLogin }) {
    const { t } = useTranslation();

    return (
        <main className="login-page register-page">
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
                        {t("auth.registerTitle")}
                    </Typography>
                    <Typography className="login-page__description">
                        {t("auth.registerDescription")}
                    </Typography>
                    <RegisterForm onAuthenticated={onAuthenticated} />
                    <Typography className="login-page__switch" component="p">
                        {t("auth.loginPrompt")}{" "}
                        <Button
                            type="button"
                            className="login-page__switch-button"
                            onClick={onLogin}
                        >
                            {t("auth.signInLink")}
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

export default RegisterPage;
