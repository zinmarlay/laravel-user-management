import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useLanguage } from "../../i18n/LanguageContext";
import { translations } from "../../i18n/translations";

function LanguageSwitcher() {
    const { language, setLanguage, t } = useLanguage();
    const inputId = useId().replace(/:/g, "");
    const labelId = `language-switcher-label-${inputId}`;

    return (
        <FormControl className="language-switcher" size="small">
            <InputLabel id={labelId}>
                {t("language.label")}
            </InputLabel>
            <Select
                labelId={labelId}
                value={language}
                label={t("language.label")}
                onChange={(event) => setLanguage(event.target.value)}
                inputProps={{ "aria-label": t("language.switchTo") }}
            >
                <MenuItem value="en">{translations.en.language.english}</MenuItem>
                <MenuItem value="ja">{translations.ja.language.japanese}</MenuItem>
            </Select>
        </FormControl>
    );
}

export default LanguageSwitcher;
import { useId } from "react";
