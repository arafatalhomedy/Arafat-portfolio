import React from 'react';
import assets from '../assets';
import Title from './title';
import ServiceCard from './ServiceCard';
import { motion } from "motion/react";

const Services = () => {

    const service_data = [
        {
            id: 1,
            title: "Web Development",
            description: "I build full-stack web applications using React and Next.js on the front end, with server-side rendering, routing, and API integration, backed by Node.js for server logic and data handling.",
            icon: assets.web_dev
        },
        {
            id: 2,
            title: "Systems Programming",
            description: "I write C and C++ code that deals directly with memory and hardware-level details — skills I've built through coursework and practice, rather than relying on languages that handle that automatically.",
            icon: assets.systems_programming
        },
        {
            id: 3,
            title: "Problem Solving",
            description: "I practice solving coding problems and learning data structures and algorithms using Python, Java, and C++ — building the core problem-solving skills every programmer needs.",
            icon: assets.problem_solving
        },
        {
            id: 4,
            title: "Backend Development",
            description: "I work on the behind the scenes part of apps — writing server code and simple APIs with Node.js, Python, and Java to handle data and logic that the front end doesn't see.",
            icon: assets.backend_dev
        }
    ]

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            transition={{ staggerChildren: 0.2 }}
            viewport={{ once: true }}

            id="services" className="relative flex flex-col items-center gap-7 px-4 sm:px-12 lg:px-24 xl:px-40 text-gray-700 dark:text-white  " >

            <img src={assets.bg_image2} className="absolute -top-100 -left-70 -z-1 dark:hidden " alt="" />

            <Title title="What I can build" description="From front end to backend, I turn ideas into working software using the languages and frameworks I know best." />

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10'>
                {service_data.map((Service, index) => {
                    return (
                        <ServiceCard
                            Service={Service}
                            key={index}
                            index={index}
                        />
                    );
                })}
            </div>



        </motion.div>
    )
}

export default Services;