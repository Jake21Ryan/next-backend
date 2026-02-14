import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

function dbName() {
  return process.env.MONGODB_DB || "sample_mflix";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const client = await clientPromise;
  const db = client.db(dbName());
  const col = db.collection("profiles");

  const profiles = await col.find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ profiles }, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const form = await req.formData();

    const firstName = form.get("firstName");
    const lastName = form.get("lastName");
    const email = form.get("email");
    const file = form.get("profileImage");

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    let profileImageUrl = "";

    if (file && typeof file === "object" && file.size > 0) {
      if (!file.type?.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image file types allow" },
          { status: 400, headers: corsHeaders }
        );
      }

      const ext = (file.name?.split(".").pop() || "png").toLowerCase();
      const safeName = crypto.randomUUID() + "." + ext;

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      await fs.writeFile(path.join(uploadDir, safeName), Buffer.from(bytes));

      profileImageUrl = `/uploads/${safeName}`;
    }

    const client = await clientPromise;
    const db = client.db(dbName());
    const col = db.collection("profiles");

    const doc = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim(),
      profileImageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(doc);

    return NextResponse.json(
      { _id: result.insertedId, ...doc },
      { status: 201, headers: corsHeaders }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500, headers: corsHeaders }
    );
  }
}