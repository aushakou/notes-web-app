import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode');
            // If there's no saved preference, check system preference
            if (saved === null) {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            return saved === 'true';
        }
        return true; // Default to dark mode
    });

    // Apply theme immediately on mount
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, []); // This runs once on mount

    // Update theme when darkMode changes
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleTheme = () => setDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
