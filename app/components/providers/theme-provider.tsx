"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Props for the ThemeProvider component.
 * Inherits all props from next-themes ThemeProvider.
 *
 * @typedef {React.ComponentProps<typeof NextThemesProvider>} ThemeProviderProps
 */
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

/**
 * Theme provider component that wraps the application to enable theme switching.
 *
 * This component is a thin wrapper around next-themes ThemeProvider that provides
 * theme context to all child components, enabling dark/light mode switching throughout
 * the application.
 *
 * @component
 * @param {ThemeProviderProps} props - Component props including children and theme configuration
 * @param {React.ReactNode} props.children - Child components to be wrapped with theme context
 *
 * @example
 * ```tsx
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * @see {@link https://github.com/pacocoursey/next-themes next-themes documentation}
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
