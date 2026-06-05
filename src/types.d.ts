// Declare CSS side-effect imports so TypeScript does not error on them.
// @payloadcms/next/css resolves to a plain CSS file with no .d.ts entry;
// TypeScript 6 strict mode (TS2882) requires an explicit declaration.
declare module '*.css' {}
declare module '*.scss' {}
declare module '@payloadcms/next/css' {}
