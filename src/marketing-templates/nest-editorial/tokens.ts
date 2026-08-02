// Nest Editorial Design System Tokens (nest_editorial_v1)

export const NEST_TOKENS = {
  version: 'nest_editorial_v1',
  colors: {
    paper: '#FFFDF8',
    mist: '#F6F7F1',
    forest: '#01362D',
    emerald: '#00635C',
    pistachio: '#D0D6BB',
    ink: '#10201B',
    muted: '#68736E',
    rule: 'rgba(1, 54, 45, 0.16)',
    ruleLight: 'rgba(208, 214, 187, 0.4)',
    white: '#FFFFFF',
  },
  fonts: {
    display: 'Georgia, "Times New Roman", serif',
    body: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  spacing: {
    space1: '4px',
    space2: '8px',
    space3: '12px',
    space4: '16px',
    space5: '24px',
    space6: '32px',
    space7: '48px',
    space8: '64px',
  },
  dimensions: {
    flyerWidth: '612pt', // 8.5 inches at 72dpi
    flyerHeight: '792pt', // 11 inches at 72dpi
  },
} as const;
