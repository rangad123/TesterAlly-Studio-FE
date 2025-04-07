
/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{js,jsx,ts,tsx}",
  "node_modules/flowbite-react/lib/esm/**/*.js",
  "./node_modules/flowbite/**/*.js"
];
export const theme = {
  extend: {},
  screens: {
    sm: '350px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
  },
};
export const plugins = [require("@tailwindcss/forms"), require("flowbite/plugin")];
