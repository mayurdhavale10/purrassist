import { NextResponse } from "next/server";
import { auth } from "../../../../../auth"; // adjust path as needed

const PLANS = {
  intercollege: { name: "Inter-College", price: 69 },
  genderSpecific: { name: "Gender Specific", price: 169 },
} as const;

type PlanId = keyof typeof PLANS;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const planId = body.planId as PlanId; // ✅ proper type assertion

    if (!PLANS[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const orderPayload = {
      order_amount: PLANS[planId].price,
      order_currency: "INR",
      order_id: "order_" + Date.now(),
      customer_details: {
        customer_id: session.user.email,
        customer_email: session.user.email,
        customer_phone: "9999999999", // TODO: replace with user's phone if available
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id={order_id}&plan=${planId}`,
      },
    };

    const cfRes = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2022-09-01",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await cfRes.json();
    if (data?.order_token) {
      return NextResponse.json({
        orderToken: data.order_token,
        orderId: data.order_id,
      });
    } else {
      console.error("Cashfree error:", data);
      return NextResponse.json(
        { error: "Failed to create order", details: data },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
