"use client";

import { useRouter } from "next/navigation";
import styles from "./PaymentModal.module.css";

type PaymentModalProps = {
  paymentUrl: string;
  onClose: () => void;
  completedHref: string;
  onCompleted?: () => void;
  title?: string;
  description?: string;
};

export default function PaymentModal({
  paymentUrl,
  onClose,
  completedHref,
  onCompleted,
  title = "Complete your payment",
  description = "Finish payment below. Your payment will be confirmed after the payment provider processes it.",
}: PaymentModalProps) {
  const router = useRouter();
  function completePayment() {
    onClose();

    if (onCompleted) {
      router.push("/dashboard/shipments");
      onCompleted();
      return;
    }

    window.location.assign(completedHref);
  }

  return (
    <div
      aria-labelledby="payment-modal-title"
      aria-modal="true"
      className={styles.overlay}
      role="dialog"
    >
      <section className={styles.modal}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>Secure payment</p>
            <h2 id="payment-modal-title">{title}</h2>
            <p>{description}</p>
          </div>
          <button
            aria-label="Close payment"
            className={styles.close}
            onClick={completePayment}
            type="button"
          >
            x
          </button>
        </div>
        <iframe
          className={styles.frame}
          title="Payment checkout"
          src={paymentUrl}
        />
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose} type="button">
            Pay later
          </button>
          <button
            className={styles.complete}
            onClick={completePayment}
            type="button"
          >
            I&apos;ve completed payment
          </button>
        </div>
      </section>
    </div>
  );
}
