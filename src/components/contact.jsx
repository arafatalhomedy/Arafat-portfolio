import React from "react";
import Title from "./title";
import assets from "../assets";
import toast from "react-hot-toast";
import { motion } from "motion/react"

const Contact = () => {

    const [result, setResult] = React.useState("");

    const onSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        formData.append("access_key", "b93374d5-7d7d-4d2f-a171-33320e0d4d20");

        try {

            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Thank you for your message")
                event.target.reset();
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error("Error: " + error.message);
        }

    };


    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            transition={{ staggerChildren: 0.2 }}
            viewport={{ once: true }}
            id="connect" className="flex flex-col items-center gap-7 px-4 sm:px-12 lg:px-24 sl:px-40 pt-30 text-gray-700 dark:text-white">
            <Title title="Contact Me" description="Feel free to reach out if you have any questions or would like to collaborate." />
            <motion.form
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3 sm:gap-5 max-w-2xl w-full ">
                <div>
                    <p className="mb-2 text-sm font-medium  ">Your name</p>
                    <div className="flex pl-3 rounded-lg border border-gray-300 dark:border-gray-600">

                        <img src={assets.person_icon} alt="" />
                        <input name="name" type="text" className="w-full p-3 text-sm outline-none" placeholder="Enter your name" required />
                    </div>


                </div>

                <div>
                    <p className="mb-2 text-sm font-medium  ">Your Email</p>
                    <div className="flex pl-3 rounded-lg border border-gray-300 dark:border-gray-600">

                        <img src={assets.email_icon} alt="" />
                        <input name="email" type="email" className="w-full p-3 text-sm outline-none" placeholder="Enter your email" required />
                    </div>


                </div>

                <div className="sm:col-span-2">
                    <p className="mb-2 text-sm font-medium  ">Your Message</p>
                    <textarea name="message" rows={8} placeholder="Enter your message" className=" w-full p-3 text-sm outline-none rounded-lg border border-gray-300 dark:border-gray-600" />
                </div>
                <button type="submit" className="sm:col-span-2 w-max justify-self-center flex items-center gap-2 bg-primary text-white text-sm px-8 py-2.5 rounded-full cursor-pointer hover:scale-103 transition-all">Send message
                    <img src={assets.arrow_icon} alt="" className="w-4" />
                </button>




            </motion.form>
        </motion.div>
    );
}
export default Contact;