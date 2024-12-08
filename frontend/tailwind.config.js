/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        main_grey: "#6480A4",
        sender_blue: "#DEE9FF",
        send_button_blue: "#8BABD8",
        placeholder_grey: "#707991",
        base_blue: "#8BABD8",
        notifications_popup_blue: "#3758F9",
        online_green: "#15CF74",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
