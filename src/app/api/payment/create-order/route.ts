// /app/api/payment/create-order/route.ts
import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/dbConnect";
import ProductOrder from "@/models/ProductOrder";

const PLANS = {
  free:    { name: "Basic Free",        price: 0,   planType: "free" },
  basic:   { name: "Basic All-Colleges", price: 1,  planType: "intercollege" },
  premium: { name: "Premium Ultimate",   price: 169, planType: "gender" },
} as const;

function cfBaseUrl() {
  const env = (process.env.CASHFREE_ENV || process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox").toLowerCase();
  return env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

export async function POST(req: Request) {
  try {
    await mongooseConnect();

    const body = await req.json();
    const { planId, customerEmail, customerPhone, userId } = body || {};

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: "Invalid or missing planId" }, { status: 400 });
    }

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_BASE_URL" }, { status: 500 });
    }

    const plan = PLANS[planId as keyof typeof PLANS];

    // Generate unique merchant order_id (yours)
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    // Create order at Cashfree
    const orderPayload = {
      order_amount: plan.price, // number per API spec
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: userId ? String(userId) : `user_${orderId}`,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
      },
      order_note: `Subscription for ${plan.name}`,
    };

    const response = await fetch(`${cfBaseUrl()}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
      },
      body: JSON.stringify(orderPayload),
      // Important in serverless: timeout protection can be added via AbortController if needed
    });

    const data = await response.json();

    if (!response.ok || !data?.payment_session_id) {
      console.error("[Cashfree] Create order error:", data);
      return NextResponse.json({ error: "Failed to create payment session", details: data }, { status: 502 });
    }

    // Persist our order in DB (status ACTIVE post creation)
    const orderDoc = await ProductOrder.create({
      orderId,
      cfOrderId: data?.cf_order_id ? String(data.cf_order_id) : undefined,
      userId: userId ? String(userId) : undefined,
      customerEmail,
      customerPhone,
      amount: plan.price,
      currency: "INR",
      status: "ACTIVE",
      paymentStatus: "PENDING",
      items: [
        { productId: String(planId), name: plan.name, qty: 1, price: plan.price },
      ],
      meta: { planId, planType: plan.planType },
    });

    return NextResponse.json({
      paymentSessionId: data.payment_session_id,
      orderId: orderDoc.orderId,
      cfOrderId: orderDoc.cfOrderId,
      env: (process.env.CASHFREE_ENV || process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox").toLowerCase(),
    });
  } catch (error: any) {
    console.error("[Create Order] Error:", error);
    return NextResponse.json({ error: "Internal server error", message: error?.message }, { status: 500 });
  }
}