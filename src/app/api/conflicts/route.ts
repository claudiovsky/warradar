import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { ConflictZone } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("conflicts")
      .orderBy("lastUpdated", "desc")
      .get();

    const conflicts: ConflictZone[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConflictZone[];

    return NextResponse.json({ conflicts, count: conflicts.length });
  } catch (error) {
    console.error("Error fetching conflicts:", error);
    // Try without ordering if index is missing
    try {
      const snapshot = await adminDb.collection("conflicts").get();
      const conflicts: ConflictZone[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as ConflictZone)
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      return NextResponse.json({ conflicts, count: conflicts.length });
    } catch {
      return NextResponse.json({ conflicts: [], count: 0 });
    }
  }
}
