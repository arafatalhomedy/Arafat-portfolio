import React, { useEffect } from "react";
import assets from "../assets";

const ThemeToggleBtn = ({ theme, setTheme }) => {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    setTheme(storedTheme || (systemPrefersDark ? "dark" : "light"));
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button>
      {theme === "dark" ? (
        <img
          onClick={() => setTheme("light")}
          src={assets.light_mode_icon}
          alt=""
          className="size-8.5 p-1.5 border border-gray-500 rounded-full dark:invert"
        />
      ) : (
        <img
          onClick={() => setTheme("dark")}
          src={assets.dark_mode_icon}
          alt=""
          className="size-8.5 p-1.5 border border-gray-500 rounded-full dark:invert"
        />
      )}
    </button>
  );
};

export default ThemeToggleBtn;
