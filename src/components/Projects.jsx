import React from "react";
import Title from "./title";
import assets from "../assets";
import ProjectCard from "./ProjectCards";
import { motion } from "motion/react";

const Projects = () => {
  const projects_data = [
    {
      id: 1,
      title: "Letter Safari",
      description:
        "An educational game that teaches letters and phonics to kids ages 4–6 through a jungle safari adventure — matching letters, rescuing animals, and earning stars along the way. Built in Python for my AI course using Pygame for the game engine and graphics, NumPy for underlying logic, plus a voice system that speaks each letter and its sound aloud to keep it engaging for young learners.",
      image: assets.leter_safari,
      github: "https://github.com/arafatalhomedy/letter_safari_project.git",
      live: "https://github.com/arafatalhomedy/letter_safari_project.git",
    },
    {
      id: 2,
      title: "ATS CV Checker",
      description:
        "An ATS resume checker that compares your CV against a job description, scores how well it would pass automated screening, and highlights which keywords and sections are missing. The backend (Python, Flask) parses PDF/DOCX resumes and scores them using Pandas, NumPy, and scikit-learn for keyword matching and text similarity, while the frontend is built with React.",
      image: assets.cv_checker,
      github: "https://github.com/arafatalhomedy/ATC-CV-Checker.git",
      live: "https://arafatalhomedy.github.io/ATC-CV-Checker/",
    },
  ];
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      transition={{ staggerChildren: 0.2 }}
      viewport={{ once: true }}
      id="projects"
      className="relative flex flex-col items-center gap-7 px-4 sm:px-12 lg:px-24 xl:px-40 text-gray-700 dark:text-white pt-20 "
    >
      <img
        src={assets.bg_image2}
        className="absolute -top-100 -left-70 -z-1 dark:hidden "
        alt=""
      />

      <Title
        title="My Projects"
        description="A look at what I've built so far across web development and programming."
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        viewport={{ once: true }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl"
      >
        {projects_data.map((project) => (
          <ProjectCard project={project} key={project.id} />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Projects;
