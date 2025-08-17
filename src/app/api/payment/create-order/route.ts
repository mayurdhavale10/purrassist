import { NextResponse } from "next/server";

const PLANS = {
  free: { name: "Basic Free", price: 0 },
  basic: { name: "Basic All-Colleges", price: 69 },
  premium: { name: "Premium Ultimate", price: 169 },
} as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
        
    if (!body.planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const planId = body.planId as keyof typeof PLANS;
    if (!PLANS[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const orderId = `order_${Date.now()}`;
    const orderPayload = {
      order_amount: PLANS[planId].price.toFixed(2),
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: `user_${orderId}`,
        customer_email: body.customerEmail || "sidnagaych4321@gmail.com",
        customer_phone: body.customerPhone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${orderId}`,
        // Fixed: Remove query parameter from webhook URL
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
      },
      order_note: `Subscription for ${PLANS[planId].name} plan`,
    };

    // const cashfreeUrl = process.env.NODE_ENV === "production"
    //   ? "https://api.cashfree.com/pg/orders"
    //   : "https://sandbox.cashfree.com/pg/orders";

    const cashfreeUrl = "https://api.cashfree.com/pg/orders";

    const response = await fetch(cashfreeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();
        
    if (!response.ok || !data.payment_session_id) {
      console.error("Cashfree API Error:", data);
      return NextResponse.json(
        { error: "Failed to create payment session", details: data },
        { status: 500 }
      );
    }

    // Log the webhook URL for debugging
    console.log("Webhook URL set to:", `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`);

    return NextResponse.json({
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
    });
   
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}