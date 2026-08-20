import React from "react";
import assets from "../assets";
import ImageRotate from "./image_retote";
import { motion } from "motion/react"

const Hero = () => {
  return (
    <div id="head" className=" w-full overflow-hidden flex flex-col items-center gap-6 py-20 px-4 sm:px-12 lg:px-24 xl:px-40 text-center  text-gray-700 dark:text-white">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        viewport={{ once: true }}


        className="inline-flex items-center gap-2 border border-gray-300 p-1.5 pr-4 rounded-full cursor-pointer hover:scale-103">
        <img className='w-20' src={assets.group_profile} alt="" />
        <p className="text-xs font-medium"> trusted by many people</p>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        viewport={{ once: true }}

        className="text-4xl sm:text-5xl md:text-6xl xl:text-[84px] font-medium xl:leading-[95px] max-w-5xl">Arafat Ali
        <span className="Title-1"> Software Engineer </span> & <span className="Title-1"> Full Stack Developer</span></motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        viewport={{ once: true }}
        className="text-sm sm:text-lg font-medium text-gray-500 dark:text-white/75 max-w-4/5 sm:max-w-lg pb-3">Transforming complex requirements into clean, efficient code. Passionate about building scalable, high-performance web applications and solving real-world problems with technology.</motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 2 }}
        viewport={{ once: true }}

        className="relative w-full max-w-6xl">
        <ImageRotate />
        <img className="absolute -top-40 -right-40 sm:-top-100 sm:-right-70 -z-1 dark:hidden" src={assets.bg_image1} alt="" />
      </motion.div>


    </div>
  )
}

export default Hero;