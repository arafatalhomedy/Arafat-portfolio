import { useState, useEffect } from "react";
import assets from "../assets";

const images = [assets.port_image1, assets.port_image2, assets.port_image3];

const image_retote = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 3000); // change image every 3 seconds

        return () => clearInterval(interval); // cleanup on unmount
    }, []);

    return (
        <div className="relative w-full max-w-6xl h-[300px] sm:h-[500px] overflow-hidden rounded-3xl">
            {images.map((img, index) => (
                <img
                    key={index}
                    src={img}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === current ? "opacity-100" : "opacity-0"
                        }`}
                />
            ))}
        </div>
    );
};

export default image_retote;