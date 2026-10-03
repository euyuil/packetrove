import { createTheme, type CSSVariablesResolver } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'violet',
  primaryShade: 7,
  defaultRadius: 'md',
});

export const cssVariablesResolver: CSSVariablesResolver = theme => ({
  variables: {},
  light: { '--mantine-color-dimmed': theme.colors.gray[7] },
  dark: {},
});
