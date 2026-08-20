import React from "react";
import assets from "../assets";
import ThemeToggleBtn from "./ThemeToggleBtn";
import { motion } from "motion/react";



const Navbars = ({ theme, setTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}

      className="main_div fixed top-0 left-0 w-full z-50">
      <img
        src={
          theme === "dark" ? assets.arafat_logo_light : assets.arafat_logo_dark
        }
        alt="react"
        className="w-32 h-12 object-contain "
      />

      <div
        className={`text-gray-700 dark:text-white sm:text-sm ${!isMenuOpen ? "max-sm:w-0 overflow-hidden" : "max-sm:w-60 max-sm:pl-10"} z-50 max-sm:fixed top-0 bottom-0 right-0 max-sm:min-h-screen max-sm:h-full max-sm:flex-col max-sm:bg-primary max-sm:text-white max-sm:pt-20 flex sm:items-center gap-5 transition-all`}
      >
        <img
          src={assets.close_icon}
          alt=""
          className="w-5 absolute right-4 top-4 text-white max-sm:cursor-pointer sm:hidden"
          onClick={() => setIsMenuOpen(false)}
        />

        <a href="#" className="sm:hover:border-b">
          Home
        </a>

        <a href="#services" className="sm:hover:border-b">
          Services
        </a>

        <a href="#skills" className="sm:hover:border-b">
          Skills
        </a>

        <a href="#projects" className="sm:hover:border-b">
          Projects
        </a>

        <a href="#connect" className="sm:hover:border-b">
          Contact Me
        </a>
      </div>

      <div
        className={`flex items-center gap-2 sm:gap-4 ${isMenuOpen ? "max-sm:hidden" : ""}`}
      >
        <ThemeToggleBtn theme={theme} setTheme={setTheme} />

        <img
          src={theme === "dark" ? assets.menuIconDark : assets.menuIcon}
          alt=""
          className={`w-8 sm:hidden ${isMenuOpen ? "hidden" : ""} invert dark:invert`}
          onClick={() => setIsMenuOpen(true)}
        />

        <a href="#connect" className="connect_btn">
          Connect
          <img src={assets.arrow_icon} width={14} alt="" />
        </a>
      </div>
    </motion.div>
  );
};

export default Navbars;
