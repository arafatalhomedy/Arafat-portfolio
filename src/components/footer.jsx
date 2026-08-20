// New file: src/components/Footer.jsx
import React from "react";
import assets from "../assets";
import { motion } from "motion/react";

const Footer = ({ theme }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}

            className="bg-slate-50 dark:bg-gray-900 pt-10 mt-20 sm:mt-40 px-4 sm:px-10 lg:px-24 xl:px-20">

            {/*footer top*/}

            <div className="flex justify-between lg:items-center max-lg:flex-col gap-10 pb-10">
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}

                    className="space-y-5 text-sm text-gray-700 dark:text-gray-400">
                    <img src={theme === "dark" ? assets.arafat_logo_light : assets.arafat_logo_dark} className="w-32 h-12 object-contain" />
                    <p className="max-w-md mt-5">A developer who never stops learning, always looking for the next challenge to solve. </p>
                    <ul className="flex gap-8">
                        <li>
                            <a href="#hero" className="hover:text-primary">Home</a>
                        </li>
                        <li>
                            <a href="#services" className="hover:text-primary">Services</a>
                        </li>
                        <li>
                            <a href="#skills" className="hover:text-primary">Skills</a>
                        </li>
                        <li>
                            <a href="#projects" className="hover:text-primary">Projects</a>
                        </li>
                        <li>
                            <a href="#connect" className="hover:text-primary">Contact Me</a>
                        </li>
                    </ul>

                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="text-gray-600 dark:text-gray-400">

                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">Find me on GitHub and LinkedIn.</h3>
                    <p className="text-sm mb-4">Check out my code or connect professionally.</p>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com/arafatalhomedy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:scale-110 transition-all duration-300">
                            <img src={assets.github_icon} alt="GitHub" className="w-4.5 h-4.5 object-contain dark:invert" />
                        </a>
                        <a href="https://www.linkedin.com/in/arafat-ali-8686-ali/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:scale-110 transition-all duration-300">
                            <img src={assets.linkedin_icon} alt="LinkedIn" className="w-4.5 h-4.5 object-contain" />
                        </a>

                        <a href="https://www.linkedin.com/in/arafat-ali-8686-ali/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:scale-110 transition-all duration-300">
                            <img src={assets.facebook_icon} alt="Facebook" className="w-4.5 h-4.5 object-contain " />
                        </a>

                        <a href="https://www.linkedin.com/in/arafat-ali-8686-ali/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:scale-110 transition-all duration-300">
                            <img src={assets.instagram_icon} alt="Instagram " className="w-4.5 h-4.5 object-contain " />
                        </a>
                    </div>





                </motion.div>

            </div>

            <hr className="border-gray-300 dark:border-gray-600 my-6" />

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-center py-4 sm:py-7">

                <p className="text-xs text-gray-600 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} Arafat Ali. All rights reserved.
                </p>

            </motion.div>

        </motion.div>
    );
};

export default Footer;