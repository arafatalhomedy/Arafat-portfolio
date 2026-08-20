import React from 'react';
import assets from '../assets';
import { motion } from "motion/react";

const ServiceCard = ({ Service, index }) => {
    const [position, setposition] = React.useState({ x: 0, y: 0 })
    const [isHover, setIsHover] = React.useState(false);

    const divref = React.useRef(null);


    const handleMouseMove = (e) => {
        const bounds = divref.current.getBoundingClientRect();
        setposition({
            x: e.clientX - bounds.left,
            y: e.clientY - bounds.top
        })
    }
    const handleMouseLeave = () => {
        setIsHover(false);
    }
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="relative overflow-hidden max-w-lg w-full h-full m-2 sm:m-4 rounded-x1 border border-gray-200 dark:border-gray-700 shadow-md shadow-2xl shadow-gray-100 dark:shadow-white/10" ref={divref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onMouseEnter={() => setIsHover(true)}>

            <div className={`pointer-events-none blur-2xl rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-[300px] h-[300px] absolute z-0 transition-opacity duration-500 mix-blend-multiply dark:mix-blend-lighten ${isHover ? "opacity-70" : "opacity-0"}`} style={{ top: position.y - 150, left: position.x - 150 }} />
            <div className='flex items-center gap-10 p-8 hover:p-7.5 hover:m-0.5 transition-all rounded-[10px] bg-white dark:bg-gray-900 z-10 relative h-full'>

                <div className='bg-gray-100 dark:bg-gray-700 rounded-full'>
                    <img src={Service.icon} alt="" className='max-w-24 bg-white dark:bg-gray-900 rounded-full m-2' />
                </div>

                <div className='flex flex-col gap-2'>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{Service.title}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-white/75">{Service.description}</p>
                </div>

            </div>

        </motion.div >
    )
}

export default ServiceCard;
