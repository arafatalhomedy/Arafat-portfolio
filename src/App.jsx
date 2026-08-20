import React, { useRef } from "react";
import Navbars from "./components/Navbars";
import Hero from "./components/hero";
import Services from "./components/services";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Contact from "./components/contact";
import { Toaster } from "react-hot-toast";
import Footer from "./components/footer"

const App = () => {
  const [theme, setTheme] = React.useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : "light",
  );
  const dotRef = React.useRef(null);
  const outlineRef = React.useRef(null);
  const mouse = React.useRef({ x: 0, y: 0 });
  const position = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {

    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    const handleMouseLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (outlineRef.current) outlineRef.current.style.opacity = "0";
    };

    const handleMouseEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (outlineRef.current) outlineRef.current.style.opacity = "1";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    const animate = () => {
      position.current.x += (mouse.current.x - position.current.x) * 0.1
      position.current.y += (mouse.current.y - position.current.y) * 0.1
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.current.x - 6}px,${mouse.current.y - 6}px, 0)`
        outlineRef.current.style.transform = `translate3d(${position.current.x - 20}px,${position.current.y - 20}px, 0)`

      }

      requestAnimationFrame(animate)

    }
    animate()

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }


  }, []);




  return (
    <>
      <div className="dark:bg-gray-900 relative">
        <Toaster />
        <Navbars theme={theme} setTheme={setTheme} />
        <Hero />
        <Services />
        <Skills />
        <Projects />
        <Contact />
        <Footer theme={theme} />

        {/* Custom Cursor Ring */}
        <div ref={outlineRef} className={` fixed top-0 left-0 h-10 w-10 rounded-full border border-white pointer-events-none z-[9999] ${theme === "dark" ? "border-white" : "bg-indigo-200"}`}
          style={{ transition: "transform 0.1s ease-out" }}></div>

        {/* Custom Cursor Dot */}
        <div ref={dotRef} className={` fixed top-0 left-0 h-3 w-3 rounded-full border border-white pointer-events-none z-[9999] ${theme === "dark" ? "bg-white" : "bg-indigo-600"
          }`}> </div>

      </div>

    </>
  );
};

export default App;
