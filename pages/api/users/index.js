// pages/api/users/index.js
import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db();
      const users = await db.collection("users").find({}).toArray();

      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}