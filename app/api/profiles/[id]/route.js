import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

function dbName() {
  return process.env.MONGODB_DB || "sample_mflix";
}

// ✅ match BOTH string and ObjectId
function idFilter(id) {
  if (ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { _id: new ObjectId(id) }] };
  }
  return { _id: id };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// PUT /api/profiles/:id
export async function PUT(req, { params: { id } }) {
  try {
    const form = await req.formData();
    const firstName = form.get("firstName");
    const lastName = form.get("lastName");
    const email = form.get("email");
    const file = form.get("profileImage");

    const updateDoc = {
      ...(firstName !== null ? { firstName: String(firstName).trim() } : {}),
      ...(lastName !== null ? { lastName: String(lastName).trim() } : {}),
      ...(email !== null ? { email: String(email).trim() } : {}),
      updatedAt: new Date(),
    };

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

      updateDoc.profileImageUrl = `/uploads/${safeName}`;
    }

    const client = await clientPromise;
    const db = client.db(dbName());
    const col = db.collection("profiles");

    const result = await col.findOneAndUpdate(
      idFilter(id),
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(result.value, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 400, headers: corsHeaders }
    );
  }
}

// DELETE /api/profiles/:id
export async function DELETE(_req, { params: { id } }) {
  const client = await clientPromise;
  const db = client.db(dbName());
  const col = db.collection("profiles");

  const result = await col.deleteOne(idFilter(id));
  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}