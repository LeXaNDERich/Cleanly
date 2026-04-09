(() => {
    const THEME_KEY = 'cleanly_theme';
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else {
            body.classList.remove('theme-dark');
        }
    };

    const loadTheme = () => {
        const saved = localStorage.getItem(THEME_KEY);
        return saved === 'dark' ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
        const value = theme === 'dark' ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, value);
        applyTheme(value);
    };

    const bindToggle = () => {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        toggle.checked = loadTheme() === 'dark';
        toggle.addEventListener('change', () => {
            setTheme(toggle.checked ? 'dark' : 'light');
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(loadTheme());
        bindToggle();
    });

    window.theme = {
        set: setTheme,
        current: loadTheme
    };
})();

