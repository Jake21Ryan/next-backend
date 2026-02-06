import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const client = await clientPromise;
    const db = client.db();

    const sample = [
      { name: "Lynn", email: "lynn@test.com", role: "admin" },
      { name: "Jake", email: "jake@test.com", role: "user" },
      { name: "Ryan", email: "ryan@test.com", role: "user" },
    ];

    await db.collection("users").insertMany(sample);
    return res.status(200).json({ message: "Seeded users", count: sample.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Seed failed" });
  }
}