// 스타 충전 결제 클라이언트 (토스페이먼츠 서버승인 2단계 방식).
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

import { apiFetch } from "@/lib/api";
import { TOSS_CLIENT_KEY } from "@/lib/config";

export type StarProduct = {
  product_id: string;
  price: number;
  stars: number;
  cards: number;
  note: string;
  featured?: boolean;
};

export const STAR_PRODUCTS: StarProduct[] = [
  { product_id: "STAR-001", price: 1100, stars: 10, cards: 1, note: "" },
  { product_id: "STAR-002", price: 5500, stars: 50, cards: 5, note: "" },
  { product_id: "STAR-003",price: 9900, stars: 100, cards: 10, note: "", featured: true,},
  { product_id: "STAR-004", price: 19900, stars: 220, cards: 22, note: "" },
];

export type OrderResponse = {
  order_id: string;
  product_id: string;
  amount: number;
  star_amount: number;
  order_name: string;
};

export type BalanceResponse = { star_balance: number };

export async function createOrder(productId: string): Promise<OrderResponse> {
  return apiFetch<OrderResponse>("/payments/orders", {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
  });
}

export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<BalanceResponse> {
  return apiFetch<BalanceResponse>("/payments/confirm", {
    method: "POST",
    body: JSON.stringify({
      payment_key: params.paymentKey,
      order_id: params.orderId,
      amount: Number(params.amount),
    }),
  });
}

export function productByAmount(amount: number): StarProduct | undefined {
  return STAR_PRODUCTS.find((p) => p.price === Number(amount));
}

export async function startStarCheckout(
  productId: string,
  customerKey: string | null,
): Promise<never> {
  const order = await createOrder(productId);

  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
  const payment = tossPayments.payment({
    customerKey: customerKey ?? ANONYMOUS,
  });

  const origin = window.location.origin;
  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: order.amount },
    orderId: order.order_id,
    orderName: order.order_name,
    successUrl: `${origin}/payment/success`,
    failUrl: `${origin}/payment/fail`,
  });

  throw new Error("결제창으로 이동하지 못했습니다.");
}

export function customerKeyFor(userId: number | null | undefined): string | null {
  return userId != null ? `zami-user-${userId}` : null;
}