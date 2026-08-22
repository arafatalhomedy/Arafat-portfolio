import React from "react";

const ProjectCard = ({ project }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:scale-102 duration-500 transition-all shadow-sm">
      <img
        src={project.image}
        className="w-full h-48 object-cover rounded-t-xl"
        alt=""
      />
      <div className="p-5">
        <h3 className="mt-3 mb-2 text-lg font-semibold">{project.title}</h3>
        <p
          className={`text-sm opacity-60 w-5/6 ${expanded ? "" : "line-clamp-3"}`}
        >
          {project.description}
        </p>

        {expanded && (
          <div className="mt-3 space-y-1">
            <p className="text-sm break-words">
              Github:{" "}
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View repository
              </a>
            </p>
            <p className="text-sm break-words">
              Live:{" "}
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Project
              </a>
            </p>
          </div>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </div>
    </div>
  );
};
export default ProjectCard;
