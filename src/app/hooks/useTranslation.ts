import { useState, useEffect } from 'react';
import { translations, Language } from '../i18n/translations';

export const useTranslation = () => {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('uri-tomo-system-language') as Language) || 'ja';
    });

    useEffect(() => {
        const handleLanguageChange = () => {
            const newLang = (localStorage.getItem('uri-tomo-system-language') as Language) || 'ja';
            setLanguage(newLang);
        };

        window.addEventListener('language-updated', handleLanguageChange);
        window.addEventListener('storage', handleLanguageChange); // Listen for cross-tab changes as well

        return () => {
            window.removeEventListener('language-updated', handleLanguageChange);
            window.removeEventListener('storage', handleLanguageChange);
        };
    }, []);

    const t = (key: string, params?: Record<string, string | number>): string => {
        let text = translations[key]?.[language] || key;

        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
            });
        }

        return text;
    };

    const setSystemLanguage = (lang: Language) => {
        localStorage.setItem('uri-tomo-system-language', lang);
        window.dispatchEvent(new Event('language-updated'));
        setLanguage(lang);
    };

    return { t, language, setSystemLanguage };
};
