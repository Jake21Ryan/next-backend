// pages/api/users/[id].js
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection("users");

    // UPDATE USER
    if (req.method === "PUT") {
      const { name, email, role } = req.body;

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { name, email, role } }
      );

      return res.status(200).json({ message: "User updated", result });
    }

    // DELETE USER
    if (req.method === "DELETE") {
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
      });

      return res.status(200).json({ message: "User deleted", result });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}