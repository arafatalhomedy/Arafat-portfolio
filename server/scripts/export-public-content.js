import { access, copyFile, mkdir, writeFile } from "node:fs/promises";

import { createHash } from "node:crypto";

const api = "http://127.0.0.1:3001";
const base = "/Arafat-portfolio/";

const publicDirectory = new URL("../../public/", import.meta.url);
const imageDirectory = new URL("published-images/", publicDirectory);
const uploadedImages = new URL("../uploads/projects/", import.meta.url);

async function publishImage(value) {
  if (!value) return "";

  const url = new URL(value);

  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if (!local) return url.href;

  // Images already inside the frontend's public folder.
  if (url.pathname.startsWith(base)) {
    const relative = url.pathname.slice(base.length);

    await access(new URL(relative, publicDirectory));

    return base + relative;
  }

  // Copy only screenshots referenced by published projects.
  const match = /^\/api\/uploads\/projects\/([a-f0-9-]{36}\.webp)$/i.exec(
    url.pathname,
  );

  if (!match) {
    throw new Error("Cannot publish this local image: " + value);
  }

  await copyFile(
    new URL(match[1], uploadedImages),
    new URL(match[1], imageDirectory),
  );

  return base + "published-images/" + match[1];
}

async function exportContent() {
  const response = await fetch(api + "/api/content", {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error("Content export failed: HTTP " + response.status);
  }

  const data = await response.json();

  if (![data.projects, data.skills, data.services].every(Array.isArray)) {
    throw new Error("Invalid public content response.");
  }

  await mkdir(imageDirectory, { recursive: true });

  const projects = await Promise.all(
    data.projects.map(async (item) => ({
      ...item,
      image: await publishImage(item.image),
    })),
  );

  const skills = await Promise.all(
    data.skills.map(async (item) => ({
      ...item,
      icon: await publishImage(item.icon),
    })),
  );

  let avatar = "";

  const photo = await fetch(api + "/api/profile/public-avatar", {
    signal: AbortSignal.timeout(15000),
  });

  if (photo.ok) {
    if (!photo.headers.get("content-type")?.startsWith("image/webp")) {
      throw new Error("Unexpected profile photo format.");
    }

    const bytes = Buffer.from(await photo.arrayBuffer());

    const filename =
      "avatar-" +
      createHash("sha256").update(bytes).digest("hex").slice(0, 16) +
      ".webp";

    await writeFile(new URL(filename, imageDirectory), bytes);

    avatar = base + "published-images/" + filename;
  } else if (photo.status !== 404) {
    throw new Error("Profile photo export failed: HTTP " + photo.status);
  }

  await writeFile(
    new URL("portfolio-content.json", publicDirectory),
    JSON.stringify(
      {
        projects,
        skills,
        services: data.services,
        avatar,
      },
      null,
      2,
    ) + "\n",
  );

  console.log(
    "Exported " +
      projects.length +
      " projects, " +
      skills.length +
      " skills, and " +
      data.services.length +
      " services.",
  );
}

exportContent().catch((error) => {
  console.error("Export failed. Keep the backend running on port 3001.");
  console.error(error.message);
  process.exitCode = 1;
});
