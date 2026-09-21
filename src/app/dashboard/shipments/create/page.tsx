"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import PaymentModal from "@/components/PaymentModal";
import {
  calculateShipmentCost,
  createShipment,
  initializeShipmentPayment,
  searchShipmentAddress,
  type ShipmentCostResponse,
} from "@/services/axios/shipments.service";
import styles from "./create.module.css";
import { useRouter } from "next/navigation";

const CoordinateMap = dynamic(() => import("@/components/CoordinateMap"), {
  ssr: false,
});

type Location = {
  address: string;
  latitude: string;
  longitude: string;
};

type Item = {
  itemName: string;
  quantity: string;
  weight: string;
  isFragile: boolean | "";
};

const initialLocation: Location = { address: "", latitude: "", longitude: "" };
const initialItem: Item = {
  itemName: "",
  quantity: "1",
  weight: "",
  isFragile: "",
};

export default function CreateShipmentPage() {
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState<Location>(initialLocation);
  const [delivery, setDelivery] = useState<Location>(initialLocation);
  const [shipmentType, setShipmentType] = useState("standard");
  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [cost, setCost] = useState<ShipmentCostResponse | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [items, setItems] = useState<Item[]>([{ ...initialItem }]);
  const [note, setNote] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [searchingLocation, setSearchingLocation] = useState<
    "pickup" | "delivery" | null
  >(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter()

  async function estimateCost() {
    if (!formRef.current?.reportValidity()) return;

    setIsCalculating(true);
    try {
      const result = await calculateShipmentCost({
        shipmentType,
        vehicleType,
        pickupLat: Number(pickup.latitude),
        pickupLng: Number(pickup.longitude),
        deliveryLat: Number(delivery.latitude),
        deliveryLng: Number(delivery.longitude),
      });
      setCost(result);
      console.log("Cost ", result);
    } catch {
      // The Axios interceptor displays the global error toast.
    } finally {
      setIsCalculating(false);
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const currentShipmentId =
        shipmentId ??
        (
          await createShipment({
            pickupAddress: pickup.address,
            deliveryAddress: delivery.address,
            pickupLatitude: Number(pickup.latitude),
            pickupLongitude: Number(pickup.longitude),
            deliveryLatitude: Number(delivery.latitude),
            deliveryLongitude: Number(delivery.longitude),
            shipmentType,
            vehicleType,
            estimatedCost: Number(
              cost?.estimatedCost.toString().replace(/,/g, ""),
            ),
            recipientName,
            recipientPhone,
            note,
            items: items.map((item) => ({
              itemName: item.itemName,
              quantity: Number(item.quantity),
              weight: item.weight ? Number(item.weight) : undefined,
              isFragile: item.isFragile === true,
            })),
          })
        ).id;
      setShipmentId(currentShipmentId);

      const payment = await initializeShipmentPayment(
        currentShipmentId,
        Number(cost?.estimatedCost.toString().replace(/,/g, "")),
      );
      setPaymentUrl(payment.url);
    } catch {
      // The Axios interceptor displays the global error toast.
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateItem(index: number, changes: Partial<Item>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    );
  }

  async function searchLocation(type: "pickup" | "delivery") {
    const location = type === "pickup" ? pickup : delivery;
    if (!location.address.trim()) return;

    setSearchingLocation(type);
    try {
      const result = await searchShipmentAddress(location.address);
      const updatedLocation = {
        address: result.address,
        latitude: result.latitude.toFixed(6),
        longitude: result.longitude.toFixed(6),
      };
      if (type === "pickup") setPickup(updatedLocation);
      else setDelivery(updatedLocation);
    } catch {
      // The Axios interceptor displays the global error toast.
    } finally {
      setSearchingLocation(null);
    }
  }

  return (
    <section className={styles.page}>
      <Link className={styles.back} href="/dashboard/shipments">
        ← Back to shipments
      </Link>
      <div className={styles.header}>
        <p className={styles.kicker}>Shipments</p>
        <h2>Create shipment</h2>
        <p>Plan the route, confirm the recipient, and add package details.</p>
      </div>

      <div className={styles.steps} aria-label="Shipment creation progress">
        {["Route & estimate", "Recipient", "Items"].map((label, index) => (
          <div
            className={index + 1 <= step ? styles.stepActive : styles.step}
            key={label}
          >
            <span>{index + 1}</span>
            {label}
          </div>
        ))}
      </div>

      <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
        {step === 1 && (
          <>
            <div className={styles.locationGrid}>
              <LocationFields
                label="Pickup location"
                location={pickup}
                onChange={setPickup}
                onSearch={() => searchLocation("pickup")}
                isSearching={searchingLocation === "pickup"}
              />
              <LocationFields
                label="Delivery location"
                location={delivery}
                onChange={setDelivery}
                onSearch={() => searchLocation("delivery")}
                isSearching={searchingLocation === "delivery"}
              />
            </div>
            <p className={styles.hint}>
              Select exact coordinates from your map and paste them into the
              latitude and longitude fields.
            </p>
            <div className={styles.grid}>
              <SelectField
                id="shipmentType"
                label="Shipment type"
                value={shipmentType}
                onChange={setShipmentType}
                options={["standard", "express", "fragile"]}
              />
              <SelectField
                id="vehicleType"
                label="Vehicle type"
                value={vehicleType}
                onChange={setVehicleType}
                options={["motorcycle", "bicycle", "truck"]}
              />
            </div>

            {/* Estimated Cost Badge */}
            {cost && (
              <div className={styles.quote}>
                <span>Estimated shipment cost:</span>
                <strong>₦ {Number(cost.estimatedCost).toLocaleString()}</strong>
                <small>
                  {cost.distanceInKm.toFixed(2)} km route via {vehicleType}
                </small>
                <small>
                  Price Per Km: ₦ {Number(cost.pricePerKm).toLocaleString()}
                </small>
                <small>
                  Vehicle Fee: ₦ {Number(cost.vehicleFee).toLocaleString()}
                </small>
                <small>
                  Shipment Type Fee: ₦{" "}
                  {Number(cost.shipmentTypePricing).toLocaleString()}
                </small>
              </div>
            )}

            <div className={styles.actions}>
              <Link className={styles.cancel} href="/dashboard/shipments">
                Cancel
              </Link>
              <button
                onClick={() => void estimateCost()}
                disabled={isCalculating}
                type="button"
              >
                {isCalculating ? "Calculating..." : "Calculate estimate"}
              </button>
              {cost && (
                <button
                  onClick={() => {
                    if (formRef.current?.reportValidity()) setStep(2);
                  }}
                  type="button"
                >
                  Accept and continue
                </button>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.grid}>
              <Field
                id="recipientName"
                label="Recipient name"
                value={recipientName}
                onChange={setRecipientName}
                placeholder="Recipient name"
                required
              />
              <Field
                id="recipientPhone"
                label="Recipient phone"
                value={recipientPhone}
                onChange={setRecipientPhone}
                placeholder="+234..."
                required
              />
            </div>
            <StepActions
              onBack={() => setStep(1)}
              onNext={() => {
                if (formRef.current?.reportValidity()) setStep(3);
              }}
              nextLabel="Continue to items"
            />
          </>
        )}

        {step === 3 && (
          <>
            <div className={styles.itemHeader}>
              <div>
                <h3>Package items</h3>
                <p>Add every item included in this shipment.</p>
              </div>
              <button
                className={styles.secondaryButton}
                onClick={() =>
                  setItems((current) => [...current, { ...initialItem }])
                }
                type="button"
              >
                + Add item
              </button>
            </div>
            <div className={styles.items}>
              {items.map((item, index) => (
                <div className={styles.item} key={`item-${index + 1}`}>
                  <div className={styles.itemTitle}>
                    <strong>Item {index + 1}</strong>
                    {items.length > 1 && (
                      <button
                        onClick={() =>
                          setItems((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        type="button"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className={styles.grid}>
                    <Field
                      id={`itemName-${index}`}
                      label="Item name"
                      value={item.itemName}
                      onChange={(value) =>
                        updateItem(index, { itemName: value })
                      }
                      placeholder="Package contents"
                      required
                    />
                    <Field
                      id={`quantity-${index}`}
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(value) =>
                        updateItem(index, { quantity: value })
                      }
                      placeholder="1"
                      required
                    />
                    <Field
                      id={`weight-${index}`}
                      label="Weight (Optional)"
                      type="number"
                      value={item.weight}
                      onChange={(value) => updateItem(index, { weight: value })}
                      placeholder="0"
                    />
                    <div className={styles.field}>
                      <label htmlFor={`isFragile-${index}`}>
                        Is this item fragile?
                      </label>
                      <select
                        id={`isFragile-${index}`}
                        onChange={(event) =>
                          updateItem(index, {
                            isFragile: event.target.value === "true",
                          })
                        }
                        required
                        value={
                          item.isFragile === "" ? "" : String(item.isFragile)
                        }
                      >
                        <option value="">Select an option</option>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.field}>
              <label htmlFor="note">Special instructions</label>
              <textarea
                id="note"
                onChange={(event) => setNote(event.target.value)}
                placeholder="Special delivery instructions"
                rows={3}
                value={note}
              />
            </div>
            <StepActions
              onBack={() => setStep(2)}
              nextLabel={isSubmitting ? "Creating..." : "Create shipment"}
              submit
              disabled={isSubmitting}
            />
          </>
        )}
      </form>

      {paymentUrl && (
        <PaymentModal
          completedHref="/dashboard/shipments"
          onClose={() => setPaymentUrl(null)}
          onCompleted={() => router.push("/dashboard/shipments")}
          paymentUrl={paymentUrl}
          title="Complete your shipment payment"
          description="Finish payment below. Your shipment will be confirmed after the payment provider processes it."
        />
      )}
    </section>
  );
}

function LocationFields({
  label,
  location,
  onChange,
  onSearch,
  isSearching,
}: {
  label: string;
  location: Location;
  onChange: (location: Location) => void;
  onSearch: () => void;
  isSearching: boolean;
}) {
  return (
    <fieldset className={styles.location}>
      <legend>{label}</legend>
      <div className={styles.addressSearch}>
        <Field
          id={`${label}-address`}
          label="Location address"
          value={location.address}
          onChange={(address) =>
            onChange({ ...location, address, latitude: "", longitude: "" })
          }
          placeholder="Enter an address to search"
          required
        />
        <button disabled={isSearching} onClick={onSearch} type="button">
          {isSearching ? "Searching..." : "Search map"}
        </button>
      </div>
      <div className={styles.coordinateGrid}>
        <Field
          id={`${label}-latitude`}
          label="Latitude"
          type="number"
          value={location.latitude}
          onChange={(latitude) => onChange({ ...location, latitude })}
          placeholder="6.6018"
          required
        />
        <Field
          id={`${label}-longitude`}
          label="Longitude"
          type="number"
          value={location.longitude}
          onChange={(longitude) => onChange({ ...location, longitude })}
          placeholder="3.3515"
          required
        />
      </div>
      <CoordinateMap
        latitude={location.latitude ? Number(location.latitude) : undefined}
        longitude={location.longitude ? Number(location.longitude) : undefined}
        onSelect={(latitude, longitude) =>
          onChange({
            ...location,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          })
        }
      />
    </fieldset>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option[0].toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </div>
  );
}

function StepActions({
  onBack,
  onNext,
  nextLabel,
  submit = false,
  disabled = false,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel: string;
  submit?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={styles.actions}>
      <button className={styles.cancel} onClick={onBack} type="button">
        Back
      </button>
      <button
        disabled={disabled}
        onClick={onNext}
        type={submit ? "submit" : "button"}
      >
        {nextLabel}
      </button>
    </div>
  );
}
