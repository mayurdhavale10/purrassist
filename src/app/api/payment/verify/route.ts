import { NextResponse } from "next/server";
import axios from "axios";
import { mongooseConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { auth } from "../../../../../auth";

const PLANS = {
  intercollege: { name: "Inter-College", price: 69 },
  genderSpecific: { name: "Gender Specific", price: 169 },
} as const;

type PlanId = keyof typeof PLANS;

export async function POST(req: Request) {
  try {
    const { orderId, planId } = await req.json();
    if (!orderId || !planId) {
      return NextResponse.json(
        { message: "Missing orderId or planId" },
        { status: 400 }
      );
    }

    if (!PLANS[planId as PlanId]) {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
    }

    await mongooseConnect();

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // ✅ Call Cashfree API to verify payment
    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`, // Use production URL in prod
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID!,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
          "x-api-version": "2022-09-01",
        },
      }
    );

    const paymentStatus = response.data?.order_status;

    if (paymentStatus === "PAID") {
      await User.findOneAndUpdate(
        { email: session.user.email },
        {
          plan: planId,
          planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      );

      return NextResponse.json({ success: true, status: paymentStatus });
    }

    return NextResponse.json({ success: false, status: paymentStatus }, { status: 400 });
  } catch (error: any) {
    console.error("Payment verify error:", error.response?.data || error.message);
    return NextResponse.json({ message: "Verification failed" }, { status: 500 });
  }
}
