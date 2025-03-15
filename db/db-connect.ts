import dotenv from "dotenv";
import path from "path";
import { Collection, DataAPIClient } from "@datastax/astra-db-ts";

dotenv.config({ path: path.resolve(__dirname, "../.env") });  // 👈 Adjust path if needed

// console.log("🔹 ASTRA_DB_API:", process.env.ASTRA_DB_API);
// console.log("🔹 ASTRA_DB_APPLICATION_TOKEN:", process.env.ASTRA_DB_APPLICATION_TOKEN);
// console.log("🔹 ASTRA_URL:", process.env.ASTRA_URL);
// console.log("🔹 ASTRA_TOKEN:", process.env.ASTRA_TOKEN);

export let collection: Collection;

const dbConnect = async () => {
  if (!process.env.ASTRA_TOKEN || !process.env.ASTRA_URL) {
    throw new Error("Astra DB environment variables are missing");
  }

  const client = new DataAPIClient(process.env.ASTRA_TOKEN);

  const db = client.db(process.env.ASTRA_URL, {
    keyspace: "default_keyspace", // Change if needed
    token: process.env.ASTRA_TOKEN,
  });

  collection = db.collection("db_astra_coll");

  console.log("✅ Astra DB is connected");
};

export default dbConnect;





// import { DataAPIClient } from "@datastax/astra-db-ts";
// import dotenv from "dotenv";

// dotenv.config();

// export let collection;

// const dbConnect = async () => {
//   const client = new DataAPIClient(process.env.ASTRA_TOKEN); // Astra token from the environment variables

//   const db = client.db(process.env.ASTRA_URL, {
//     keyspace: "your_keyspace_name", // Replace with your actual keyspace
//     token: process.env.ASTRA_TOKEN,
//   });

//   collection = db.collection("post_data");

//   console.log("Astra db is connected");
// };

// export default dbConnect;
