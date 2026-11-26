export const themes = {
    default: {
        primary: '#082A59',
        secondary: '#0B376E',
        accent: '#D0A45D',
        background: '#F4F7FA',
        surface: '#ffffff',
        border: '#D8E1EA',
        text: {
            primary: '#102F50',
            secondary: '#536A81',
            accent: '#008F8C'
        }
    },
    green: {
        primary: '#008F8C',
        secondary: '#0B376E',
        accent: '#D0A45D',
        background: '#F4F7FA',
        surface: '#ffffff',
        border: '#D8E1EA',
        text: {
            primary: '#102F50',
            secondary: '#536A81',
            accent: '#008F8C'
        }
    },
    purple: {
        primary: '#123B70',
        secondary: '#0B376E',
        accent: '#D0A45D',
        background: '#F4F7FA',
        surface: '#ffffff',
        border: '#D8E1EA',
        text: {
            primary: '#102F50',
            secondary: '#536A81',
            accent: '#008F8C'
        }
    },
    orange: {
        primary: '#0B376E',
        secondary: '#082A59',
        accent: '#C99A4A',
        background: '#F4F7FA',
        surface: '#ffffff',
        border: '#D8E1EA',
        text: {
            primary: '#102F50',
            secondary: '#536A81',
            accent: '#008F8C'
        }
    }
};

export type ThemeType = keyof typeof themes;
