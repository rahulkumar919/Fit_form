import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
await mongoose.connect(uri, { dbName: "melamart" });

// 1. Update banner
await mongoose.connection.db.collection("banners").updateOne(
  {},
  { $set: { mobileImage: "/banner-mobile.webp" } }
);

// 2. Update hero section in settings
const s = await mongoose.connection.db.collection("settings").findOne({ key: "homepage" });
if (s?.value?.sections) {
  const nextSections = s.value.sections.map((sec) => {
    if (sec.type === "hero") {
      return { ...sec, mobileAspect: "16/9" };
    }
    return sec;
  });
  await mongoose.connection.db.collection("settings").updateOne(
    { key: "homepage" },
    { $set: { "value.sections": nextSections } }
  );
  console.log("Updated homepage hero section to mobileAspect 16/9");
}

await mongoose.disconnect();
