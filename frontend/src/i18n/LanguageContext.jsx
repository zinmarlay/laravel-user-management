import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
    DEFAULT_LANGUAGE,
    LANGUAGE_STORAGE_KEY,
    SUPPORTED_LANGUAGES,
    getTranslationValue,
} from "./translations";

const LanguageContext = createContext(null);

function getStoredLanguage() {
    try {
        const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return SUPPORTED_LANGUAGES.includes(storedLanguage)
            ? storedLanguage
            : DEFAULT_LANGUAGE;
    } catch {
        return DEFAULT_LANGUAGE;
    }
}

function interpolate(value, variables) {
    if (!variables || typeof variables !== "object") {
        return value;
    }

    return value.replace(/{{\s*(\w+)\s*}}/g, (_match, name) =>
        variables[name] === undefined || variables[name] === null
            ? ""
            : String(variables[name]),
    );
}

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(getStoredLanguage);

    const setLanguage = useCallback((nextLanguage) => {
        if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
            return;
        }

        setLanguageState(nextLanguage);

        try {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        } catch {
            // The in-memory language selection remains available.
        }
    }, []);

    const t = useCallback(
        (key, variables) =>
            interpolate(getTranslationValue(language, key), variables),
        [language],
    );

    const value = useMemo(
        () => ({ language, setLanguage, t }),
        [language, setLanguage, t],
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// oxlint-disable-next-line react/only-export-components
export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error("useLanguage must be used inside LanguageProvider");
    }

    return context;
}

// oxlint-disable-next-line react/only-export-components
export function useTranslation() {
    const { language, t } = useLanguage();
    return { language, t };
}
