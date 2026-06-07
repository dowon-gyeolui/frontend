/**
 * 스타 충전 결제 클라이언트 — 토스페이먼츠 서버승인(2단계) 방식.
 *
 * 흐름:
 *   1. createOrder(productId)        → 백엔드가 주문 생성 + 금액/스타 확정
 *   2. startStarCheckout(...)        → 토스 결제창 호출 (loadTossPayments)
 *   3. (성공 리다이렉트 → /payment/success)
 *   4. confirmPayment({...})         → 백엔드 최종 승인 + 스타 적립
 *
 * 금액은 절대 클라이언트가 정하지 않는다 — createOrder 응답의 amount 를
 * 그대로 결제창·confirm 에 전달한다(백엔드가 위변조 검증).
 */

import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";

import { apiFetch } from "@/lib/api";
import { TOSS_CLIENT_KEY } from "@/lib/config";

/** PRD 5번 가격구조(VAT 포함). 백엔드 PRODUCT_CATALOG 와 동일 — UI 표시용. */
export type StarProduct = {
  product_id: string;
  price: number; // 원
  stars: number; // 지급 스타
  cards: number; // 열람 가능 카드 수 (별 10개 = 1장)
  note: string; // 비고
  featured?: boolean; // 주력 상품 강조
};

export const STAR_PRODUCTS: StarProduct[] = [
  { product_id: "STAR-001", price: 1100, stars: 10, cards: 1, note: "첫 결제용" },
  { product_id: "STAR-002", price: 5500, stars: 50, cards: 5, note: "기본 상품" },
  {
    product_id: "STAR-003",
    price: 9900,
    stars: 100,
    cards: 10,
    note: "주력 상품",
    featured: true,
  },
  { product_id: "STAR-004", price: 19900, stars: 220, cards: 22, note: "헤비 유저용" },
];

/** 별 10개 = 인연 카드 1장 (PRD 6.4). */
export const STAR_COST_PER_CARD = 10;

/** POST /payments/orders 응답. */
export type OrderResponse = {
  order_id: string;
  product_id: string;
  amount: number;
  star_amount: number;
  order_name: string; // "ZAMI 스타 50개"
};

/** POST /payments/confirm 응답 — 적립 후 최신 잔액. */
export type BalanceResponse = { star_balance: number };

/**
 * 주문 생성. 서버가 금액·지급 스타를 확정해 돌려준다.
 * 이 응답값(order_id/amount/order_name)만 결제창에 전달한다.
 */
export async function createOrder(productId: string): Promise<OrderResponse> {
  return apiFetch<OrderResponse>("/payments/orders", {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
  });
}

/**
 * 토스 결제 성공 후 최종 승인. successUrl 쿼리의 paymentKey/orderId/amount 를
 * 그대로 전달한다(amount 는 Number 로 변환). 멱등 — 같은 주문 재호출 안전.
 */
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

/** confirm/success 페이지에서 amount → 지급 스타 수 역산(카탈로그 기준). */
export function productByAmount(amount: number): StarProduct | undefined {
  return STAR_PRODUCTS.find((p) => p.price === Number(amount));
}

/**
 * 패키지 선택 → 주문 생성 → 토스 결제창 호출까지 한 번에.
 *
 * requestPayment 는 성공 시 successUrl 로, 실패/취소 시 failUrl 로
 * 브라우저를 리다이렉트시키므로 정상 흐름에선 반환되지 않는다. 사용자가
 * 결제창을 닫으면 reject 되므로 호출부에서 try/catch 로 처리한다.
 *
 * @param customerKey 로그인 유저 식별자. 없으면 익명키(ANONYMOUS).
 */
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

  // requestPayment 가 리다이렉트시키므로 여기 도달하지 않음.
  throw new Error("결제창으로 이동하지 못했습니다.");
}

/** 토스 customerKey 규격에 맞춘 로그인 유저 식별자. */
export function customerKeyFor(userId: number | null | undefined): string | null {
  return userId != null ? `zami-user-${userId}` : null;
}
