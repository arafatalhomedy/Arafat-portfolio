import React from "react";
import Title from "./title";
import { skillData } from "../assets";
import { motion } from "motion/react";


const Skills = () => {

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            transition={{ staggerChildren: 0.2 }}
            viewport={{ once: true }}
            id="skills" className="flex flex-col items-center gap-7 px-4 sm:px-12 lg:px-24 sl:px-40 pt-30 text-gray-800 dark:text-white" >

            <Title title="My Skills" description="Languages and tools I use to build, from web apps to low-level systems code." />

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">

                {skillData.map((skill, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        key={skill.title} className="flex max-sm:flex-col items-center gap-5 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl shadow-gray-100 dark:shadow-white/5 hover:scale-103 transition-all duration-400">
                        <img src={skill.icon} alt="" className="w-12 h-12 rounded-full" />
                        <div className="flex-1">

                            <span className="text-xs opacity-60">{skill.title}</span>

                        </div>
                    </motion.div>
                ))}


            </div>






        </motion.div>
    )
}

export default Skills;